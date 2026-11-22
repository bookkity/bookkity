// Exercise automatic add/delete discovery through npm's development launcher.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {openSync, closeSync} from 'node:fs'
import {spawn} from 'node:child_process'
import {setTimeout as delay} from 'node:timers/promises'
import {chromium} from 'playwright'
import {buildSearchIndex} from '../scripts/build-search-index.mjs'

const port = process.argv[2] || '3317'
const origin = `http://127.0.0.1:${port}`
const slug = `search-integration-${process.pid}`
const file = `articles/${slug}.mdx`
const manifest = async () => JSON.parse(await fs.readFile('src/generated/search.json', 'utf8')).url
const until = async predicate => {
  const end = Date.now() + 45000
  while (Date.now() < end) {
    if (await predicate().catch(() => false)) return
    await delay(150)
  }
  throw new Error('Development index did not update')
}
const log = openSync(`/tmp/bookkity-search-dev-${process.pid}.log`, 'w')
const child = spawn(process.execPath, ['scripts/dev.mjs', '--hostname', '127.0.0.1', '--port', port], {detached: true, stdio: ['ignore', log, log]})
let browser
try {
  await until(async () => (await fetch(origin + '/search', {signal: AbortSignal.timeout(2000)})).ok)
  const initial = await manifest()
  await fs.writeFile(file, `---\ntitle: Automatic discovery fixture\nurl: ${slug}\nauthors: [dzikoysk]\ntags: [testing]\nlanguage: en\ndate: '2026-11-20'\nimage: /0000/progress-bar.jpg\n---\nAutomatedDiscoverySentinel`, {flag: 'wx'})
  await until(async () => await manifest() !== initial)
  browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined})
  const page = await browser.newPage()
  await page.route('https://api.bookkity.com/**', route => route.fulfill({json: {}}))
  await page.goto(origin + '/search?q=AutomatedDiscoverySentinel')
  await page.locator(`[aria-label="Search results"] [data-article-card="/articles/${slug}"]`).waitFor()
  await fs.unlink(file)
  await until(async () => await manifest() === initial)
  await page.reload()
  await page.waitForFunction(() => document.querySelector('[role=status]')?.textContent.includes('No results'))
  assert.equal(await page.locator('[aria-label="Search results"] [data-article-card]').count(), 0)
  console.log('Development watcher: added content became searchable; deleting it removed it without restart.')
} finally {
  await fs.rm(file, {force: true})
  await browser?.close()
  try { process.kill(-child.pid, 'SIGTERM') } catch (error) { if (error.code !== 'ESRCH') throw error }
  closeSync(log)
  await buildSearchIndex()
}
