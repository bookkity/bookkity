// Hold image responses until layout settles, then verify loading cannot move boxes.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {chromium} from 'playwright'
const origin = process.argv[2] || 'http://127.0.0.1:3320'
const routes = Object.keys(JSON.parse(await fs.readFile('.next/prerender-manifest.json')).routes)
  .filter(route => route !== '/search' && !route.endsWith('/0-10'))
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})
const results = [], errors = []
try {
  for (const width of [1280, 390]) for (const route of routes) {
    const page = await browser.newPage({viewport: {width, height: 844}})
    page.on('pageerror', error => errors.push({route, error: error.message}))
    page.on('response', response => { if (response.status() >= 400) errors.push({route, status: response.status(), url: response.url()}) })
    await page.addInitScript(() => localStorage.setItem('merch-polish-popup-seen', 'true'))
    await page.route('https://api.bookkity.com/**', r => r.fulfill({json: {uid: 'layout-test'}}))
    let release
    const gate = new Promise(resolve => { release = resolve })
    await page.route('**/*', async r => {
      if (r.request().resourceType() === 'image') await gate
      await r.fallback()
    })
    try {
      await page.goto(origin + route, {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => window.next?.router.isReady)
      await page.evaluate(async () => {
        await document.fonts.ready
        document.querySelectorAll('img').forEach(img => { img.loading = 'eager' })
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const targets = [...document.querySelectorAll('img, .content h1, .content h2, .content p')]
        const rect = element => { const r = element.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height] }
        window.imageAudit = {targets, rect, before: targets.map(rect), maxDelta: 0, shifts: [], pending: [...document.images].filter(img => !img.complete).length}
        const sample = () => {
          for (let i = 0; i < targets.length; i++) {
            const after = rect(targets[i])
            window.imageAudit.maxDelta = Math.max(window.imageAudit.maxDelta, ...after.map((n, j) => Math.abs(n - window.imageAudit.before[i][j])))
          }
          window.imageAudit.frame = requestAnimationFrame(sample)
        }
        sample()
        window.imageAudit.observer = new PerformanceObserver(list => window.imageAudit.shifts.push(...list.getEntries().map(entry => ({value: entry.value, recentInput: entry.hadRecentInput}))))
        window.imageAudit.observer.observe({type: 'layout-shift'})
      })
      release()
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0))
      await page.waitForTimeout(150)
      const result = await page.evaluate(() => {
        const a = window.imageAudit
        cancelAnimationFrame(a.frame); a.observer.disconnect()
        return {maxDelta: a.maxDelta, pending: a.pending, images: document.images.length, shifts: a.shifts,
          changed: a.targets.flatMap((element, i) => {
            const after = a.rect(element)
            return after.some((n, j) => Math.abs(n - a.before[i][j]) > 0.5) ? [{tag: element.tagName, src: element.getAttribute('src'), before: a.before[i], after}] : []
          })}
      })
      results.push({route, width, ...result})
      console.log(route, width, result.maxDelta, result.pending)
    } catch (error) { errors.push({route, width, error: error.message}) }
    finally { release(); await page.close() }
  }
} finally { await browser.close() }
await fs.writeFile(process.env.IMAGE_LAYOUT_OUTPUT || '/tmp/bookkity-image-layout.json', JSON.stringify({results, errors}, null, 2))
assert.deepEqual(errors, [])
if (!process.env.IMAGE_LAYOUT_BASELINE) assert.ok(results.every(result => result.maxDelta <= 0.5), 'image load changed layout')
