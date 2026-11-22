// Homelab production check: app links must retain the same document.
import assert from 'node:assert/strict'
import {chromium} from 'playwright'

const origin = process.argv[2] || 'http://127.0.0.1:3316'
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})
const errors = [], documents = [], visited = []
try {
  const page = await browser.newPage()
  await page.route('https://api.bookkity.com/**', route => route.fulfill({json: {}}))
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.isNavigationRequest() && request.resourceType() === 'document') documents.push(request.url()) })
  await page.goto(origin + '/articles')
  await page.evaluate(() => { window.__navigationProof = 'same-document' })
  const follow = async locator => {
    const href = await locator.getAttribute('href')
    const destination = new URL(href, page.url())
    await locator.click()
    await page.waitForURL(url => url.pathname === destination.pathname && url.hash === destination.hash)
    await page.waitForFunction(path => window.next.router.asPath.split('?')[0].split('#')[0] === path, destination.pathname)
    assert.equal(await page.evaluate(() => window.__navigationProof), 'same-document', href)
    visited.push(destination.pathname + destination.hash)
  }
  await follow(page.locator('[data-article-card="/articles/api-sets"] a').first())
  await follow(page.locator('.content a[href*="#"]:not([href^="http"])').first())
  await follow(page.locator('.content a[href="/author/thatbakamono"]').first())
  await follow(page.locator('.header a').filter({hasText: /^Articles$/}))
  await follow(page.locator('[aria-label="Topics"] a').filter({hasText: /^Java$/}))
  for (const name of ['Series', 'Projects', 'Merch', 'About Us', 'Articles']) {
    await follow(page.locator('.header a').filter({hasText: new RegExp(`^${name}$`)}))
    if (name === 'Series') await follow(page.locator('.content a[href^="/series/"]').first())
    if (name === 'Projects') await follow(page.locator('.content a[href^="/project/"]').first())
    if (name === 'Merch') {
      await page.getByRole('button', {name: 'Rozumiem / I understand'}).click()
      await follow(page.locator('.content a[href^="/merch/"]').first())
    }
    if (name === 'About Us') await follow(page.locator('.content a[href^="/"]').first())
  }
  assert.equal(documents.length, 1, 'internal app links do not reload the document')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({visited, documentLoads: documents.length, errors}, null, 2))
} finally {
  await browser.close()
}
