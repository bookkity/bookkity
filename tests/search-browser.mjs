// Production behavior and end-to-end timing: node tests/search-browser.mjs [origin]
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {chromium} from 'playwright'
import {pathToFileURL} from 'node:url'
import path from 'node:path'
import {collectSearchRecords} from '../scripts/search-content.mjs'
import {buildSearchArtifact} from '../src/search/engine.mjs'

const origin = process.argv[2] || 'http://127.0.0.1:3100'
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})
const manifest = JSON.parse(await fs.readFile('src/generated/search.json', 'utf8'))
const artifactResponse = await fetch(origin + manifest.url)
assert.equal(artifactResponse.status, 200)
assert.match(artifactResponse.headers.get('cache-control'), /max-age=31536000.*immutable/)
const artifact = await artifactResponse.json()
const sitemap = await (await fetch(origin + '/sitemap.xml')).text()
for (const record of artifact.records) assert.ok(sitemap.includes(`<loc>https://bookkity.com${record.url}</loc>`), `search result is indexable: ${record.url}`)
const html = await (await fetch(origin + '/search?q=api sets')).text()
assert.match(html, /name="robots" content="noindex"/)
assert.ok(!html.includes('api sets'), 'query/results must not be server rendered')
const data = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1])
assert.ok(data.props.pageProps.previews.length <= 10, 'static shell carries only the normal first listing page')
assert.ok(data.props.pageProps.previews.every(record => !('body' in record)), 'no bodies in listing props')
const pageErrors = []
const newPage = async (options = {}) => {
  const context = await browser.newContext(options)
  await context.route('https://api.bookkity.com/**', route => route.fulfill({json: {}}))
  const page = await context.newPage()
  page.on('pageerror', error => pageErrors.push(error.message))
  return {context, page}
}
const submit = async (page, query, expected) => {
  await page.getByRole('searchbox').fill(query)
  return page.evaluate(({query, expected}) => new Promise((resolve, reject) => {
    const start = performance.now()
    const timer = setTimeout(() => { observer.disconnect(); reject(new Error('Search timeout: ' + query)) }, 15000)
    const observer = new MutationObserver(() => {
      const status = document.querySelector('[role=status]')?.textContent || ''
      const first = document.querySelector('[aria-label="Search results"] a')?.getAttribute('href') ?? null
      if (status.includes(`“${query}”`) && first === expected) {
        clearTimeout(timer)
        observer.disconnect()
        resolve(performance.now() - start)
      }
    })
    observer.observe(document.body, {subtree: true, childList: true, characterData: true})
    document.querySelector('form[role=search]').requestSubmit()
  }), {query, expected})
}
// SSR and client rendering can emit identical attributes in different orders.
const cardMarkup = node => {
  const copy = node.cloneNode(true)
  for (const element of [copy, ...copy.querySelectorAll('*')]) {
    const attributes = [...element.attributes].map(attribute => [attribute.name, attribute.value]).sort(([a], [b]) => a.localeCompare(b))
    for (const [name] of attributes) element.removeAttribute(name)
    for (const [name, value] of attributes) element.setAttribute(name, value)
  }
  return copy.innerHTML
}
const summarize = values => ({median: [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)], min: Math.min(...values), max: Math.max(...values)})
const measurements = []
try {
  const live = await newPage()
  const livePage = live.page
  await livePage.goto(origin + '/articles')
  assert.equal(await livePage.locator('a[href="/search"]').count(), 0, 'no search navigation item')
  assert.equal(await livePage.getByRole('button', {name: 'Search', exact: true}).count(), 0)
  assert.deepEqual(await livePage.locator('[aria-label="Topics"] a').allTextContents(), ['All', 'JVM', 'Java', 'Kotlin', 'Rust', 'DevOps', 'Hardware'])
  const chapterCard = await livePage.locator('[data-article-card="/series/intellij-plugin-development/2"]').evaluate(cardMarkup)
  const apiCard = await livePage.locator('[data-article-card="/articles/api-sets"]').evaluate(cardMarkup)
  await livePage.getByRole('searchbox').dispatchEvent('compositionstart')
  await livePage.getByRole('searchbox').fill('api')
  await livePage.waitForTimeout(400)
  assert.equal(new URL(livePage.url()).pathname, '/articles', 'IME composition does not navigate')
  await livePage.getByRole('searchbox').dispatchEvent('compositionend')
  await livePage.waitForTimeout(100)
  assert.equal(new URL(livePage.url()).pathname, '/articles', 'typing waits for debounce')
  await livePage.getByRole('searchbox').fill('api sets')
  await livePage.waitForURL(url => url.pathname === '/search' && url.searchParams.get('q') === 'api sets')
  await livePage.locator('[aria-label="Search results"] [data-article-card="/articles/api-sets"]').waitFor()
  assert.equal(await livePage.locator('[data-article-card="/articles/api-sets"]').evaluate(cardMarkup), apiCard, 'same card markup and content as archive')
  assert.equal(await livePage.getByRole('searchbox').evaluate(node => node === document.activeElement), true, 'focus survives initial navigation')
  await livePage.getByRole('searchbox').fill('quick fixes')
  await livePage.locator('[data-article-card="/series/intellij-plugin-development/2"]').waitFor()
  assert.equal(await livePage.locator('[data-article-card="/series/intellij-plugin-development/2"]').evaluate(cardMarkup), chapterCard, 'chapter card matches archive')
  await livePage.getByTitle('Show new chapters in series or display only articles').click()
  await livePage.waitForFunction(() => document.querySelector('[role=status]')?.textContent.includes('No results'))
  await livePage.getByTitle('Show new chapters in series or display only articles').click()
  await livePage.getByRole('searchbox').fill('')
  await livePage.waitForURL(origin + '/search')
  await livePage.locator('[aria-label="Articles"] [data-article-card]').first().waitFor()
  await livePage.goBack()
  await livePage.waitForURL(origin + '/articles')
  await livePage.getByRole('searchbox').fill('unfinished')
  await livePage.locator('[aria-label="Topics"] a').filter({hasText: /^Java$/}).click()
  await livePage.waitForURL(origin + '/tag/java')
  await livePage.waitForTimeout(400)
  assert.equal(new URL(livePage.url()).pathname, '/tag/java', 'leaving cancels a pending search')
  for (const topic of ['rust', 'devops', 'hardware']) {
    const response = await livePage.goto(origin + '/tag/' + topic)
    assert.equal(response.status(), 200)
    assert.equal(await livePage.locator('meta[name="robots"]').getAttribute('content'), 'noindex')
    assert.ok(!sitemap.includes('<loc>https://bookkity.com/tag/' + topic + '</loc>'))
  }
  await live.context.close()

  const {context, page} = await newPage({locale: 'pl-PL', timezoneId: 'Pacific/Honolulu'})
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.goto(origin + '/articles')
  await page.getByRole('searchbox').waitFor()
  assert.equal(requests.filter(url=>url.includes('/search-assets/')).length, 0, 'archive does not fetch search data')
  await submit(page, 'api sets', '/articles/api-sets')
  assert.equal(new URL(page.url()).pathname, '/search')
  await submit(page, 'multiplatfrom', '/articles/kotlin-multiplatform-a-practical-use-case-of-js-target')
  await page.goBack()
  await page.waitForURL(origin + '/articles')
  await page.waitForFunction(() => document.querySelector('input[name=q]')?.value === '')
  await page.goForward()
  await page.waitForFunction(() => document.querySelector('[aria-label="Search results"] a')?.getAttribute('href')?.includes('kotlin-multiplatform'))
  await page.waitForFunction(() => document.querySelector('input[name=q]')?.value === 'multiplatfrom')
  // Rapid reversal must not clear the input while retaining the restored results.
  await page.goBack()
  await page.waitForURL(origin + '/articles')
  await page.goForward()
  await page.waitForURL(url => url.pathname === '/search')
  await page.waitForFunction(() => document.querySelector('input[name=q]')?.value === 'multiplatfrom')
  await submit(page, 'java qzxvnonexistent', null)
  assert.equal(requests.filter(url=>url.includes('/search-assets/')).length, 1, 'worker downloads corpus once')
  // Two submissions in the same task: the final route owns the displayed results.
  await page.evaluate(() => {
    const form = document.querySelector('form[role=search]')
    const input = form.querySelector('input')
    input.value = 'api sets'; form.requestSubmit()
    input.value = 'reposilite'; form.requestSubmit()
  })
  await page.waitForFunction(() => document.querySelector('[aria-label="Search results"] a')?.getAttribute('href') === '/series/reposilite-3x-backstage/1')
  await page.workers()[0].evaluate(() => self.postMessage({id: -123, results: [{url: '/stale-result', title: 'Stale response'}]}))
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  assert.equal(await page.getByText('Stale response', {exact: true}).count(), 0)
  assert.equal(requests.filter(url => /\/_next\/data\/.*\/(articles|series)\/.*\.json$/.test(new URL(url).pathname)).length, 0, 'results do not eagerly download article page data')
  await context.close()

  const retry = await newPage()
  let blocked = true
  await retry.page.route('**/search-assets/*.json', route => blocked ? route.abort() : route.continue())
  await retry.page.goto(origin + '/search?q=api sets')
  await retry.page.getByRole('button', {name: 'Try again'}).waitFor()
  blocked = false
  await retry.page.getByRole('button', {name: 'Try again'}).click()
  await retry.page.locator('[aria-label="Search results"] a').first().waitFor()
  assert.equal(await retry.page.locator('[aria-label="Search results"] a').first().getAttribute('href'), '/articles/api-sets')
  await retry.context.close()

  const records = await collectSearchRecords()
  const versions = [{name: 'metadata', origin, build: buildSearchArtifact}]
  if (process.env.SEARCH_BASELINE_ROOT && process.env.SEARCH_BASELINE_ORIGIN) {
    const baseline = await import(pathToFileURL(path.join(process.env.SEARCH_BASELINE_ROOT, 'src/search/engine.mjs')))
    versions.push({name: 'fullBody', origin: process.env.SEARCH_BASELINE_ORIGIN, build: baseline.buildSearchArtifact})
  }
  const expanded = Array.from({length: 1000}, (_, i) => ({...records[i % records.length], url: records[i % records.length].url + '?copy=' + i}))
  const apiCopy = records.findIndex(record => record.url === '/articles/api-sets')
  const chapterCopy = records.findIndex(record => record.url === '/series/intellij-plugin-development/2')
  const scenarios = versions.flatMap(version => [false, true].map(synthetic => ({
    ...version, synthetic, large: JSON.stringify(version.build(expanded)), cold: [], warm: [], workerOnly: [],
  })))
  // Alternate both versions and sizes. Both origins serve actual production builds.
  for (let run = 0; run < 5; run++) {
    for (const scenario of run % 2 ? [...scenarios].reverse() : scenarios) {
      const {context, page} = await newPage()
      if (scenario.synthetic) await page.route('**/search-assets/*.json', route => route.fulfill({contentType: 'application/json', body: scenario.large}))
      await page.goto(scenario.origin + '/search')
      await page.getByRole('searchbox').waitFor()
      scenario.cold.push(await submit(page, 'api sets', '/articles/api-sets' + (scenario.synthetic ? '?copy=' + apiCopy : '')))
      const expected = '/series/intellij-plugin-development/2' + (scenario.synthetic ? '?copy=' + chapterCopy : '')
      scenario.warm.push(await submit(page, 'quick fixes', expected))
      const measured = await page.workers()[0].evaluate(() => new Promise((resolve, reject) => {
        const original = self.postMessage
        const start = performance.now()
        self.postMessage = data => {
          self.postMessage = original
          if (data.error) reject(new Error('Worker timing query failed'))
          else resolve({ms: performance.now() - start, url: data.results[0]?.url})
        }
        self.onmessage({data: {id: -1, query: 'quick fixes'}})
      }))
      assert.equal(measured.url, expected)
      scenario.workerOnly.push(measured.ms)
      await context.close()
    }
  }
  for (const {name, synthetic, cold, warm, workerOnly} of scenarios) measurements.push({
    name, records: synthetic ? 1000 : records.length, synthetic,
    coldMs: summarize(cold), warmMs: summarize(warm), workerOnlyMs: summarize(workerOnly),
    workerShareOfWarmMedian: summarize(workerOnly).median / summarize(warm).median,
    runs: {cold, warm, workerOnly},
  })
  assert.deepEqual(pageErrors, [], 'no uncaught browser errors')
  const report = {browser: browser.version(), rounds: 5, measured: 'form submit to matching result DOM mutation, homelab localhost', measurements, errors: pageErrors}
  await fs.writeFile('/tmp/bookkity-search-browser.json', JSON.stringify(report, null, 2)+'\n')
  console.log(report)
} finally {
  await browser.close()
}
