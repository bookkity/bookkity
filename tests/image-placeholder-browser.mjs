import assert from 'node:assert/strict'
import {chromium} from 'playwright'
import sharp from 'sharp'
import {IMAGE_SHIMMER} from '../src/helpers/image-placeholder.mjs'
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})
const origin = process.argv[2] || 'http://127.0.0.1:3321'
try {
  // Check the actual SVG when embedded as a CSS image, including reduced motion.
  for (const reducedMotion of ['no-preference']) {
    const page = await browser.newPage({viewport: {width: 320, height: 180}, reducedMotion})
    await page.setContent(`<body style="margin:0"><div style='height:180px;background-image:url("${IMAGE_SHIMMER}")'></div></body>`)
    await page.waitForTimeout(200)
    const first = await sharp(await page.screenshot()).raw().toBuffer()
    await page.waitForTimeout(600)
    const second = await sharp(await page.screenshot()).raw().toBuffer()
    assert.equal(first.equals(second), reducedMotion === 'reduce', `SVG motion: ${reducedMotion}`)
    await page.close()
  }
  const page = await browser.newPage({viewport: {width: 1280, height: 800}})
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.addInitScript(() => localStorage.setItem('merch-polish-popup-seen', 'true'))
  await page.route('https://api.bookkity.com/**', r => r.fulfill({json: {uid: 'shimmer-test'}}))
  let release
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/*', async r => {
    if (r.request().resourceType() === 'image') await gate
    await r.fallback()
  })
  await page.goto(origin + '/articles', {waitUntil: 'domcontentloaded'})
  await page.waitForFunction(() => window.next?.router.isReady)
  const image = page.locator('[data-article-card] img').first()
  assert.ok((await image.evaluate(img => getComputedStyle(img).backgroundImage)).includes('data:image/svg+xml'))
  await page.emulateMedia({reducedMotion: 'reduce'})
  const still = await sharp(await image.screenshot()).raw().toBuffer()
  await page.waitForTimeout(600)
  assert.ok(still.equals(await sharp(await image.screenshot()).raw().toBuffer()), 'reduced-motion placeholder is static')
  await page.emulateMedia({reducedMotion: 'no-preference'})
  const before = await image.boundingBox()
  await page.screenshot({path: '/tmp/bookkity-shimmer-pending.png'})
  release()
  await image.evaluate(img => img.decode())
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-article-card] img')).backgroundImage === 'none')
  assert.deepEqual(await image.boundingBox(), before)
  await page.screenshot({path: '/tmp/bookkity-shimmer-ready.png'})
  // Do not eagerly load gallery thumbnails: the next large image must be cold.
  await page.unroute('**/*')
  await page.goto(origin + '/merch/boo-halloween')
  const main = page.locator('.group > img').first()
  await main.evaluate(img => img.decode())
  const box = await main.boundingBox()
  const src = await main.getAttribute('src')
  let releaseNext
  const nextGate = new Promise(resolve => { releaseNext = resolve })
  await page.route('**/*', async r => {
    if (r.request().resourceType() === 'image') await nextGate
    await r.fallback()
  })
  // Block and evict cached images before changing the selected source.
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.clearBrowserCache')
  await page.getByRole('button', {name: 'Next image'}).click({force: true})
  await page.waitForFunction(old => document.querySelector('.group > img')?.getAttribute('src') !== old, src)
  assert.ok((await main.evaluate(img => getComputedStyle(img).backgroundImage)).includes('data:image/svg+xml'))
  assert.deepEqual(await main.boundingBox(), box)
  releaseNext()
  await main.evaluate(img => img.decode())
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.group > img')).backgroundImage === 'none')
  assert.deepEqual(await main.boundingBox(), box)
  await page.unroute('**/*')
  await page.route('**/*', r => r.request().resourceType() === 'image' ? r.abort() : r.fallback())
  await page.goto(origin + '/articles', {waitUntil: 'domcontentloaded'})
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-article-card] img')
    return image?.complete && getComputedStyle(image).backgroundImage === 'none'
  })
  assert.deepEqual(await page.locator('[data-article-card] img').first().boundingBox(), before, 'failed image keeps reserved space')
  assert.deepEqual(errors, [])
  console.log('SVG animation/reduced motion, pending/ready cards, cold gallery changes, and failed-image sizing passed.')
} finally { await browser.close() }
