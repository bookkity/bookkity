// Run on the homelab after seed-math.mjs and a production build.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {chromium} from 'playwright'

const origin = process.argv[2] || 'http://127.0.0.1:3324'
const routes = ['/series/math-fixture/1', '/series/math-fixture/2', ...process.argv.slice(3)]
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true})
const errors = [], views = []
const fontResponses = []
try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}})
  await page.route('https://api.bookkity.com/**', route => route.fulfill({json: {uid: 'math-test'}}))
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    if (response.url().includes('/KaTeX_')) {
      fontResponses.push({url: response.url(), status: response.status(), cache: response.headers()['cache-control']})
    }
  })
  await page.goto(origin + '/articles')
  await page.evaluate(() => document.fonts.ready)
  assert.equal(fontResponses.length, 0, 'A listing does not download math fonts')
  for (const route of routes) {
    const response = await page.goto(origin + route)
    assert.equal(response.status(), 200, route)
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('.katex-error').count(), 0)
    if (route.includes('math-fixture')) {
      const fonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family))
      for (const family of ['KaTeX_AMS', 'KaTeX_Fraktur', 'KaTeX_Main']) assert.ok(fonts.includes(family), `${family} loads when needed`)
    }
    const props = await page.evaluate(() => JSON.parse(document.querySelector('#__NEXT_DATA__').textContent).props.pageProps)
    assert.ok(props.chapter.content.compiledSource)
    assert.ok(props.series.chapters.every(chapter => !('content' in chapter)), 'Sidebar must contain metadata only')
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({width, height: 844})
      await page.waitForTimeout(100)
      const result = await page.evaluate(() => {
        const displays = [...document.querySelectorAll('.math-scroll')]
        const rect = e => e.getBoundingClientRect()
        return {
          width: innerWidth, documentWidth: document.documentElement.scrollWidth,
          count: displays.length,
          mathml: displays.every(e => e.querySelector('math') && e.querySelector('annotation')),
          correctFocus: displays.every(e => e.tabIndex === (e.scrollWidth > e.clientWidth + 1 ? 0 : -1)),
          correctFades: displays.every(e => {
            const end = e.scrollWidth - e.clientWidth
            return e.parentElement.hasAttribute('data-scroll-left') === (end > 1 && e.scrollLeft > 1)
              && e.parentElement.hasAttribute('data-scroll-right') === (end > 1 && e.scrollLeft < end - 1)
          }),
          numbers: [...document.querySelectorAll('.math-scroll .katex-tag')].map(tag => {
            const formula = tag.previousElementSibling
            return {separated: rect(tag).left >= rect(formula).right - 1, visible: getComputedStyle(tag).display !== 'none'}
          }),
          wrongFonts: [...document.querySelectorAll('.katex .mord,.katex .mbin,.katex .mrel')]
            .filter(e => !e.children.length && /Inter/.test(getComputedStyle(e).fontFamily)).map(e => e.textContent),
        }
      })
      assert.ok(result.count > 0, route)
      assert.equal(result.documentWidth, width, `${route} at ${width}px overflows`)
      assert.ok(result.mathml, 'MathML and TeX annotations survive wrapping')
      assert.ok(result.correctFocus, 'Only overflow joins tab order')
      assert.ok(result.correctFades, 'Fades follow resizing and scroll position')
      assert.ok(result.numbers.every(n => n.separated && n.visible), 'Tags must not overlap formulas')
      assert.deepEqual(result.wrongFonts, [], 'Math must inherit KaTeX fonts')
      views.push({route, ...result})
    }
    await page.setViewportSize({width: 390, height: 844})
    await page.waitForTimeout(100)
    const scroller = page.locator('.math-scroll[tabindex="0"]').filter({has: page.locator('.katex-tag')}).first()
    const block = scroller.locator('..')
    const edges = () => block.evaluate(e => ({left: e.hasAttribute('data-scroll-left'), right: e.hasAttribute('data-scroll-right')}))
    assert.deepEqual(await edges(), {left: false, right: true}, 'Only the hidden end has a fade')
    await scroller.focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    assert.ok(await scroller.evaluate(e => e.scrollLeft > 0), 'Native keyboard scroll')
    await scroller.evaluate(e => {e.scrollLeft = (e.scrollWidth - e.clientWidth) / 2})
    await page.waitForTimeout(100)
    assert.deepEqual(await edges(), {left: true, right: true}, 'Both fades appear between edges')
    if (process.env.MATH_SCREENSHOTS && route.endsWith('/1')) {
      await fs.mkdir(process.env.MATH_SCREENSHOTS, {recursive: true})
      await block.screenshot({path: `${process.env.MATH_SCREENSHOTS}/${route.split('/')[2]}-middle.png`})
    }
    await scroller.evaluate(e => {e.scrollLeft = e.scrollWidth})
    await page.waitForTimeout(100)
    assert.ok(await scroller.evaluate(e => e.scrollLeft >= e.scrollWidth - e.clientWidth - 1), 'Full formula reachable')
    assert.deepEqual(await edges(), {left: true, right: false}, 'End fade disappears when all content is reached')
    if (process.env.MATH_SCREENSHOTS && route.endsWith('/1')) await block.screenshot({path: `${process.env.MATH_SCREENSHOTS}/${route.split('/')[2]}-end.png`})
    await scroller.evaluate(e => {e.scrollLeft = 0})
    await page.waitForTimeout(100)
    assert.equal(await scroller.evaluate(e => e.scrollLeft), 0)
    assert.deepEqual(await edges(), {left: false, right: true})
    assert.ok(await block.evaluate(e => [e, e.firstElementChild].every(element => {
      const style = getComputedStyle(element)
      return style.boxShadow === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderTopWidth === '0px'
    })), 'Equations stay flat against the page without a painted panel or shadow')
    assert.equal(await block.evaluate(e => getComputedStyle(e, '::after').content), 'none')
    assert.notEqual(await scroller.evaluate(e => getComputedStyle(e).maskImage), 'none')
    if (process.env.MATH_SCREENSHOTS && route.endsWith('/1')) await block.screenshot({path: `${process.env.MATH_SCREENSHOTS}/${route.split('/')[2]}-start.png`})
  }
  await page.setViewportSize({width: 390, height: 844})
  await page.evaluate(() => {document.documentElement.style.fontSize = '200%'})
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, '200% text reflows')
  assert.ok(await page.locator('.header').evaluate(header => {
    const bottom = header.getBoundingClientRect().bottom
    return [...header.children].every(child => child.getBoundingClientRect().bottom <= bottom + 1)
  }), 'Header contains enlarged navigation')
  await page.evaluate(() => {document.documentElement.style.fontSize = ''; document.documentElement.dir = 'rtl'})
  assert.equal(await page.locator('.math-scroll').first().evaluate(e => getComputedStyle(e).direction), 'ltr', 'Math direction survives an RTL page')
  await page.evaluate(() => {document.documentElement.dir = ''})
  await page.emulateMedia({reducedMotion: 'reduce', forcedColors: 'active'})
  await page.locator('.math-scroll[tabindex="0"]').first().focus()
  assert.notEqual(await page.locator('.math-scroll[tabindex="0"]').first().evaluate(e => getComputedStyle(e.parentElement).outlineStyle), 'none')
  assert.equal(await page.locator('.math-scroll').first().evaluate(e => getComputedStyle(e).maskImage), 'none')
  assert.deepEqual(errors, [])
  assert.ok(fontResponses.length > 0, 'Math pages download their required font faces')
  assert.ok(fontResponses.every(font => font.url.startsWith(origin) && font.url.endsWith('.woff2') && font.status === 200), 'Every math font is self-hosted WOFF2')
  assert.ok(fontResponses.every(font => /immutable/.test(font.cache)), 'Next caches content-hashed fonts immutably')
  const report = {views, errors}
  if (process.env.MATH_REPORT) await fs.writeFile(process.env.MATH_REPORT, JSON.stringify(report, null, 2))
  console.log(JSON.stringify({views: views.length, errors, widths: [320, 390, 768, 1024, 1440]}))
} finally { await browser.close() }
