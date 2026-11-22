import assert from 'node:assert/strict'
import {chromium} from 'playwright'

const origin = process.argv[2] || 'http://127.0.0.1:3320'
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})
const errors = [], optimizerRequests = []
let checked = 0
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({viewport: {width, height: 844}})
    await page.route('https://api.bookkity.com/**', route => route.fulfill({json: {uid: 'image-test'}}))
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (request.url().includes('/_next/image?')) optimizerRequests.push(request.url()) })
    for (const route of ['/articles', '/articles/api-sets', '/series/intellij-plugin-development/2', '/about', '/dzikoysk', '/projects', '/project/funnyguilds', '/merch', '/merch/boo-halloween']) {
      await page.goto(origin + route)
      await page.locator('img').evaluateAll(images => images.forEach(img => { img.loading = 'eager' }))
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0))
      const images = await page.locator('img').evaluateAll(images => images.map(img => ({
        src: img.getAttribute('src'), width: Number(img.getAttribute('width')), height: Number(img.getAttribute('height')), alt: img.hasAttribute('alt'),
      })))
      for (const img of images) {
        assert.ok(img.width > 0 && img.height > 0 && img.alt, `${route}: ${img.src}`)
        checked++
      }
      const distorted = await page.locator('.mdx img').evaluateAll(images => images.filter(img => {
        const box = img.getBoundingClientRect()
        return Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) > 0.02
      }).map(img => img.src))
      assert.deepEqual(distorted, [], 'MDX image proportions')
      if (route === '/merch') await page.getByRole('button', {name: 'Rozumiem / I understand'}).click()
      if (route === '/merch/boo-halloween') {
        assert.equal(await page.getByRole('button', {name: 'Rozumiem / I understand'}).count(), 0)
        await page.reload()
        assert.equal(await page.getByRole('button', {name: 'Rozumiem / I understand'}).count(), 0)
      }
    }
    await page.close()
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(optimizerRequests, [])
  console.log(JSON.stringify({checked, errors, optimizerRequests}))
} finally { await browser.close() }
