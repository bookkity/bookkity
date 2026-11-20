// Homelab only: node tests/listing-journeys.mjs BASELINE_ORIGIN CANDIDATE_ORIGIN [rounds=5]
// Both production builds need the same >=21 public Java-tagged article fixtures.
// Expected claim: transitions retain the listing shell and avoid blank/wrong-content frames.
// This measures DOM at animation frames, not compositor screenshots or Internet performance.
import fs from 'node:fs/promises'
import os from 'node:os'
import {performance} from 'node:perf_hooks'
import {chromium} from 'playwright'

const [baselineOrigin, candidateOrigin, count = '5'] = process.argv.slice(2)
if (!baselineOrigin || !candidateOrigin) throw new Error('Pass baseline and candidate production origins')
const rounds = Number(count)
if (!Number.isInteger(rounds) || rounds < 1) throw new Error('Round count must be positive')
const sides = [
  {name: 'baseline', origin: baselineOrigin, sha: process.env.BASELINE_SHA || '3d2f1287e9decd5ebf710842fbc273889f6f035c'},
  {name: 'candidate', origin: candidateOrigin, sha: process.env.CANDIDATE_SHA || 'uncommitted; supply CANDIDATE_SHA'},
]
const viewports = [{name: 'desktop', width: 1280, height: 800}, {name: 'mobile', width: 390, height: 844}]
const API = '/articles/api-sets'
const FIXES = '/series/intellij-plugin-development/2'
const output = process.env.JOURNEY_OUTPUT || '/tmp/bookkity-listing-journeys.json'
const listingInventory = new Map()
const listingPaths = ['/articles', '/articles/10-20', '/articles/20-30', '/tag/java', '/tag/java/10-20', '/search']
for (const side of sides) {
  for (const path of listingPaths) {
    const response = await fetch(side.origin + path)
    if (!response.ok) throw new Error(`${side.name} missing fixture route ${path}: ${response.status}`)
    const html = await response.text()
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)
    const props = match && JSON.parse(match[1]).props.pageProps
    const previews = props?.previews || props?.listing?.previews
    if (!Array.isArray(previews) || !previews.length) throw new Error(`${side.name} needs nonempty listing props at ${path}`)
    listingInventory.set(side.name + path, previews.map(preview => preview.url))
  }
}
const runs = [], errors = []
const loadBefore = os.loadavg()
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})

// The host owns the trace, so full document navigations cannot erase their evidence.
function instrument() {
  const documentId = `${performance.timeOrigin}-${Math.random()}`
  const ids = new WeakMap()
  let nextId = 0
  const identify = element => {
    if (!element) return null
    if (!ids.has(element)) ids.set(element, `${documentId}:${++nextId}`)
    return ids.get(element)
  }
  const visible = element => {
    const box = element.getBoundingClientRect(), style = getComputedStyle(element)
    return box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0
  }
  const emit = data => window.__journeyRecord({...data, at: performance.timeOrigin + performance.now(), documentId}).catch(() => {})
  const sample = () => {
    const form = document.querySelector('form[role=search]')
    const box = form?.getBoundingClientRect()
    const cards = [...document.querySelectorAll('[data-article-card]')].filter(visible)
    const results = document.querySelector('[aria-label="Search results"]')
    emit({kind: 'frame', path: location.pathname, query: new URL(location.href).searchParams.get('q') || '',
      formId: identify(form), form: box && {x: box.left + scrollX, y: box.top + scrollY, width: box.width, height: box.height},
      scrollY, cards: cards.map(card => card.getAttribute('data-article-card')),
      resultMode: Boolean(results), input: form?.querySelector('input')?.value ?? null,
      focused: document.activeElement === form?.querySelector('input'),
      status: document.querySelector('[role=status]')?.textContent || '',
      busy: results?.getAttribute('aria-busy') || null})
    requestAnimationFrame(sample)
  }
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) emit({kind: 'shift', value: entry.value, hadRecentInput: entry.hadRecentInput,
      sources: entry.sources?.map(source => ({tag: source.node?.tagName, className: typeof source.node?.className === 'string' ? source.node.className : '',
        region: source.node?.closest?.('[data-article-card]') ? 'card' : source.node?.closest?.('nav[aria-label=Pagination]') ? 'pagination' : 'chrome',
        previousRect: source.previousRect, currentRect: source.currentRect}))})
  }).observe({type: 'layout-shift', buffered: true})
  requestAnimationFrame(sample)
}

async function session(side, viewport, round) {
  const context = await browser.newContext({viewport: {width: viewport.width, height: viewport.height}})
  const events = [], requests = [], failures = []
  let routeDelay = 0, indexDelay = 0, rejectIndex = false, activeJourney = 'setup'
  await context.exposeBinding('__journeyRecord', (_, data) => { events.push(data) })
  await context.addInitScript(instrument)
  await context.route('https://api.bookkity.com/**', route => route.fulfill({json: {}}))
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin === new URL(side.origin).origin) {
      if (url.pathname.startsWith('/search-assets/')) {
        if (indexDelay) await new Promise(resolve => setTimeout(resolve, indexDelay))
        if (rejectIndex) return route.abort()
      } else if (routeDelay && (request.resourceType() === 'document' || url.pathname.startsWith('/_next/data/'))) {
        await new Promise(resolve => setTimeout(resolve, routeDelay))
      }
    }
    await route.fallback()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.setDefaultNavigationTimeout(30000)
  const recordFailure = failure => {
    failures.push(failure)
    errors.push({side: side.name, viewport: viewport.name, round, name: activeJourney, ...failure})
  }
  page.on('pageerror', error => recordFailure({kind: 'pageerror', message: error.message, at: Date.now()}))
  page.on('request', request => requests.push({at: Date.now(), url: request.url(), type: request.resourceType(), navigation: request.isNavigationRequest()}))
  page.on('response', response => {
    if (response.status() >= 400) recordFailure({kind: 'http', status: response.status(), url: response.url(), at: Date.now()})
  })
  const readyListing = async path => {
    await page.waitForURL(url => url.pathname === path && !url.searchParams.get('q'))
    await page.waitForFunction(expected => {
      const actual = [...document.querySelectorAll('[data-article-card]')].map(card => card.getAttribute('data-article-card'))
      return JSON.stringify(actual) === JSON.stringify(expected)
    }, listingInventory.get(side.name + path))
  }
  const readySearch = async (query, expected) => {
    await page.waitForURL(url => url.pathname === '/search' && url.searchParams.get('q') === query)
    await page.waitForFunction(({query, expected}) => {
      const first = document.querySelector('[aria-label="Search results"] [data-article-card]')?.getAttribute('data-article-card')
      const status = document.querySelector('[role=status]')?.textContent || ''
      return first === expected && status.includes(`“${query}”`) && document.querySelector('input[name=q]')?.value === query
    }, {query, expected})
  }
  const readyNoResults = async query => {
    await page.waitForURL(url => url.pathname === '/search' && url.searchParams.get('q') === query)
    await page.waitForFunction(query => !document.querySelector('[data-article-card]') &&
      document.querySelector('[role=status]')?.textContent.includes(`No results for “${query}”`), query)
  }
  const readyEmptyTopic = async () => {
    await page.waitForURL(url => url.pathname === '/tag/rust')
    await page.getByText('No articles found in this category', {exact: false}).waitFor()
    if (await page.locator('[data-article-card]').count()) throw new Error('Empty Rust topic unexpectedly has cards')
  }
  const settle = async () => {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(100)
  }
  const go = async path => { await page.goto(side.origin + path); await page.getByRole('searchbox').waitFor(); await settle() }
  const type = async query => { await page.getByRole('searchbox').fill(query) }
  const topic = async label => { await page.locator('[aria-label="Topics"] a').filter({hasText: new RegExp(`^${label}$`)}).click() }
  const pagination = async rel => { await page.locator(`nav[aria-label=Pagination] a[rel=${rel}]`).click() }
  const measure = async (name, action, ready, options = {}) => {
    // Include one stable source frame in range calculations; setup is outside the measured window.
    activeJourney = name
    const source = events.filter(event => event.kind === 'frame').at(-1)
    const start = Date.now(), monotonicStart = performance.now()
    const requestStart = requests.length, failureStart = failures.length
    let error = null, readyMs = null
    try { await action(); await ready(); readyMs = performance.now() - monotonicStart; await page.waitForTimeout(100) }
    catch (caught) { error = caught.message; errors.push({side: side.name, viewport: viewport.name, round: options.round, name, error}) }
    const elapsedMs = performance.now() - monotonicStart, end = Date.now()
    const trace = events.filter(event => event.at >= start && event.at <= end)
    const frames = trace.filter(event => event.kind === 'frame')
    const withSource = source ? [source, ...frames] : frames
    const positions = withSource.filter(frame => frame.form).map(frame => frame.form)
    const span = key => positions.length ? Math.max(...positions.map(position => position[key])) - Math.min(...positions.map(position => position[key])) : null
    const nonemptyEnd = frames.at(-1)?.cards.length > 0
    const continuity = options.continuity !== false && Boolean(source?.cards.length) && nonemptyEnd
    const shifts = trace.filter(event => event.kind === 'shift')
    const navigationRequests = requests.slice(requestStart).filter(request => request.type === 'document' && request.navigation)
    const formIds = new Set(withSource.map(frame => frame.formId).filter(Boolean))
    const record = {side: side.name, sha: side.sha, viewport: viewport.name, round: options.round, name,
      readyMs, observationMs: elapsedMs, samples: frames.length, error, correctness: !error,
      blankCardFrames: continuity ? frames.filter(frame => !frame.cards.length).length : null,
      missingFormFrames: frames.filter(frame => !frame.formId).length,
      wrongArchiveFrames: options.directSearch ? frames.filter(frame => frame.cards.length && (!frame.resultMode || frame.cards[0] !== API)).length : null,
      formNodeChanges: Math.max(0, formIds.size - 1), documentNavigations: navigationRequests.length,
      controlXSpanPx: span('x'), controlYSpanPx: span('y'), controlWidthSpanPx: span('width'),
      initialScrollY: source?.scrollY ?? null, finalScrollY: frames.at(-1)?.scrollY ?? null,
      finalInput: frames.at(-1)?.input ?? null, finalFocused: frames.at(-1)?.focused ?? null,
      chromeShiftEvents: shifts.filter(entry => entry.sources?.some(source => source.region === 'chrome')).length,
      layoutShiftSum: shifts.reduce((sum, entry) => sum + entry.value, 0),
      layoutShiftWithoutRecentInputSum: shifts.filter(entry => !entry.hadRecentInput).reduce((sum, entry) => sum + entry.value, 0),
      failures: failures.slice(failureStart), navigationRequests, frames, shifts}
    runs.push(record)
    activeJourney = 'setup'
    console.log(`${side.name} ${viewport.name} ${name}: ${error ? 'FAIL' : 'OK'} blank=${record.blankCardFrames} reloads=${record.documentNavigations} controlY=${record.controlYSpanPx}`)
    return record
  }
  return {context, page, go, type, topic, pagination, readyListing, readySearch, readyNoResults, readyEmptyTopic, settle, measure,
    delayRoutes: value => { routeDelay = value }, delayIndex: value => { indexDelay = value }, rejectIndex: value => { rejectIndex = value }}
}

async function journeys(side, viewport, round) {
  const s = await session(side, viewport, round)
  const measured = (name, action, ready, options) => s.measure(name, action, ready, {round, ...options})
  try {
    await s.go('/articles')
    await measured('listing → page 2', () => s.pagination('next'), () => s.readyListing('/articles/10-20'))
    await measured('page 2 → page 3', () => s.pagination('next'), () => s.readyListing('/articles/20-30'))
    await measured('page 3 → page 2', () => s.pagination('prev'), () => s.readyListing('/articles/10-20'))
    await measured('page 2 → listing', () => s.pagination('prev'), () => s.readyListing('/articles'))
    await measured('listing → search', () => s.type('api sets'), () => s.readySearch('api sets', API))
    await measured('search → listing', () => s.topic('All'), () => s.readyListing('/articles'))
    await s.go('/articles/10-20')
    await measured('page 2 → search', () => s.type('api sets'), () => s.readySearch('api sets', API))
    await measured('search → page 2 (Back)', () => s.page.goBack(), () => s.readyListing('/articles/10-20'))
    await measured('page 2 → search (Forward)', () => s.page.goForward(), () => s.readySearch('api sets', API))
    await measured('search → updated search', () => s.type('quick fixes'), () => s.readySearch('quick fixes', FIXES))
    await measured('search → no results', () => s.type('qzxvnonexistent'), () => s.readyNoResults('qzxvnonexistent'), {continuity: false})
    await measured('no results → search results', () => s.type('api sets'), () => s.readySearch('api sets', API), {continuity: false})
    await measured('search → cleared listing', () => s.type(''), () => s.readyListing('/search'))
    await s.go('/articles')
    await measured('listing → empty topic', () => s.topic('Rust'), () => s.readyEmptyTopic(), {continuity: false})
    await measured('empty topic → listing', () => s.topic('All'), () => s.readyListing('/articles'), {continuity: false})
    await measured('pending query → topic navigation', async () => { await s.type('unfinished'); await s.topic('Java') }, async () => {
      await s.readyListing('/tag/java'); await s.page.waitForTimeout(400); await s.readyListing('/tag/java')
      await s.page.waitForFunction(() => document.querySelector('input[name=q]')?.value === '')
    })
    await s.go('/articles')
    await measured('pending query → page navigation', async () => { await s.type('unfinished'); await s.pagination('next') }, async () => {
      await s.readyListing('/articles/10-20'); await s.page.waitForTimeout(400); await s.readyListing('/articles/10-20')
      await s.page.waitForFunction(() => document.querySelector('input[name=q]')?.value === '')
    })
    await s.go('/articles')
    await measured('listing → topic', () => s.topic('Java'), () => s.readyListing('/tag/java'))
    await measured('topic → topic page 2', () => s.pagination('next'), () => s.readyListing('/tag/java/10-20'))
    await measured('topic page 2 → topic', () => s.pagination('prev'), () => s.readyListing('/tag/java'))
    await measured('topic → search', () => s.type('api sets'), () => s.readySearch('api sets', API))
    await measured('search → topic', () => s.topic('Java'), () => s.readyListing('/tag/java'))
    await measured('topic → listing', () => s.topic('All'), () => s.readyListing('/articles'))
    await s.type('api sets'); await s.readySearch('api sets', API)
    await measured('search → rapid Back/Forward', async () => {
      await s.page.goBack(); await s.page.waitForURL(url => url.pathname === '/articles'); await s.page.goForward()
    }, async () => {
      await s.readySearch('api sets', API)
      await s.page.waitForFunction(() => document.querySelector('input[name=q]')?.value === 'api sets')
    })
    await s.go('/articles')
    s.delayRoutes(200)
    await measured('listing → delayed page 2', () => s.pagination('next'), () => s.readyListing('/articles/10-20'))
    s.delayRoutes(0)
  } finally { await s.context.close() }
  for (const mode of ['direct', 'direct-empty', 'delayed-index', 'retry']) {
    const cold = await session(side, viewport, round)
    try {
      if (!mode.startsWith('direct')) await cold.go('/articles')
      if (mode === 'delayed-index') cold.delayIndex(200)
      if (mode === 'retry') cold.rejectIndex(true)
      if (mode === 'retry') {
        await cold.type('api sets')
        await cold.page.getByRole('button', {name: 'Try again'}).waitFor()
        cold.rejectIndex(false)
        await cold.measure('search error → retry', () => cold.page.getByRole('button', {name: 'Try again'}).click(), () => cold.readySearch('api sets', API), {round, continuity: false})
      } else if (mode === 'direct-empty') {
        await cold.measure('direct empty search load', () => cold.page.goto(side.origin + '/search'), () => cold.readyListing('/search'), {round, continuity: false})
      } else {
        await cold.measure(mode === 'direct' ? 'direct search load' : 'listing → delayed cold search',
          () => mode === 'direct' ? cold.page.goto(side.origin + '/search?q=api+sets') : cold.type('api sets'),
          () => cold.readySearch('api sets', API), {round, directSearch: mode === 'direct', continuity: mode !== 'direct'})
      }
    } finally { await cold.context.close() }
  }
}

const summarize = values => {
  const sorted = values.filter(value => value !== null).sort((a, b) => a - b)
  return sorted.length ? {median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted.at(-1)} : null
}
try {
  for (let round = 1; round <= rounds; round++) {
    for (const viewport of viewports) {
      for (const side of round % 2 ? sides : [...sides].reverse()) {
        try { await journeys(side, viewport, round) }
        catch (error) { errors.push({side: side.name, viewport: viewport.name, round, stage: 'setup', error: error.message}); console.error(error.message) }
      }
    }
    // Persist partial evidence after each alternating round, including failures.
    await fs.writeFile(output, JSON.stringify({rounds, completedRound: round, runs, errors}, null, 2))
  }
} finally { await browser.close() }
const summary = [...new Set(runs.map(run => `${run.side}|${run.viewport}|${run.name}`))].map(key => {
  const selected = runs.filter(run => `${run.side}|${run.viewport}|${run.name}` === key)
  const [side, viewport, name] = key.split('|')
  return {side, viewport, name, runs: selected.length, errors: selected.filter(run => run.error || run.failures.length).length,
    httpFailures: selected.reduce((sum, run) => sum + run.failures.filter(failure => failure.kind === 'http').length, 0),
    pageErrors: selected.reduce((sum, run) => sum + run.failures.filter(failure => failure.kind === 'pageerror').length, 0),
    ...Object.fromEntries(['readyMs', 'blankCardFrames', 'wrongArchiveFrames', 'documentNavigations', 'formNodeChanges', 'controlXSpanPx', 'controlYSpanPx', 'chromeShiftEvents', 'layoutShiftSum', 'layoutShiftWithoutRecentInputSum'].map(metric => [metric, summarize(selected.map(run => run[metric]))]))}
})
const expectedSamples = 29 * rounds * viewports.length * sides.length
if (runs.length !== expectedSamples) errors.push({kind: 'coverage', expectedSamples, actualSamples: runs.length})
for (const run of runs.filter(run => run.side === 'candidate')) {
  const defects = []
  if (run.blankCardFrames > 0) defects.push('transient empty cards')
  if (run.wrongArchiveFrames > 0) defects.push('wrong archive cards on direct search')
  if (run.formNodeChanges > 0) defects.push('form remounted')
  if (!run.name.startsWith('direct') && run.documentNavigations) defects.push('document reload')
  if (run.controlXSpanPx > 0.5 || run.controlYSpanPx > 0.5 || run.controlWidthSpanPx > 0.5) defects.push('controls moved')
  if (run.chromeShiftEvents) defects.push('chrome layout shifted')
  if (['listing → search', 'page 2 → search', 'topic → search', 'search → updated search', 'listing → delayed cold search'].includes(run.name) && !run.finalFocused) defects.push('typing lost focus')
  if (defects.length) errors.push({side: run.side, viewport: run.viewport, round: run.round, name: run.name, defects})
}
const report = {expectedSamples, baseline: sides[0], candidate: sides[1], rounds, viewports, runtime: process.version,
  cpu: os.cpus()[0]?.model, cores: os.availableParallelism(), loadBefore, loadAfter: os.loadavg(),
  method: 'Five alternating side runs per viewport by default. rAF DOM samples and layout-shift events streamed to the host across navigations. Each sample is one complete named user journey, after setup and fonts settle. readyMs ends when exact destination content is verified; observationMs includes another 100 ms for trailing frames. Direct loads include startup. Localhost production builds; API identity mocked. Cold-index and route-data delays are 200 ms. Layout shift sums are not CLS session-window scores. Source/destination card-count changes are intentional; blank frames count only nonempty-to-nonempty journeys. DOM observations cannot prove compositor paint continuity.',
  summary, runs, errors}
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n')
console.log(`Wrote ${output}: ${runs.length} journey samples, ${errors.length} correctness/setup errors`)
if (errors.length || runs.some(run => run.failures.length)) process.exitCode = 1
