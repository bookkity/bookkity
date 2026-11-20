// Run against `next start` after a production build: node tests/seo-http.mjs [origin]
import assert from 'node:assert/strict'
import fs from 'node:fs'
const origin = process.argv[2] || 'http://127.0.0.1:3100'
const response = await fetch(`${origin}/sitemap.xml`)
assert.equal(response.status, 200)
assert.match(response.headers.get('content-type'), /application\/xml/)
assert.equal(response.headers.get('cache-control'), 'public, max-age=0, s-maxage=43200, stale-while-revalidate=60')
const xml = await response.text()
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
assert.ok(urls.length > 10)
assert.equal(urls.length,new Set(urls).size)
const manifest = JSON.parse(fs.readFileSync('.next/prerender-manifest.json'))
const visited = new Set()
for (const url of urls) {
  const path = new URL(url).pathname
  assert.equal(new URL(url).origin,'https://bookkity.com')
  assert.ok(manifest.routes[decodeURIComponent(path)], `Built route missing: ${path}`)
  const page = await fetch(`${origin}${path}`)
  assert.equal(page.status,200,path)
  const html = await page.text()
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,path)
  assert.ok(html.includes(`href="${url}"`),`canonical ${path}`)
  assert.ok(!/name="robots" content="noindex"/.test(html),`unexpected noindex ${path}`)
  const json = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)
  assert.ok(json,`schema ${path}`)
  const graph = JSON.parse(json[1])['@graph']
  assert.equal(graph.filter(n=>n['@id']==='https://bookkity.com/#organization').length,1)
  assert.ok((html.match(/<h1[ >]/g)||[]).length >= 1,`h1 ${path}`)
  for(const node of graph.filter(n=>n['@type']==='BlogPosting')) {
    for(const author of node.author) assert.ok(graph.some(n=>n['@type']==='Person'&&n['@id']===author['@id']))
  }
  if(path.startsWith('/tags/')) assert.ok(/href="\/(article|series)\//.test(html),`topic links ${path}`)
  visited.add(path)
}
for(const path of Object.keys(manifest.routes)) {
  if(visited.has(path)) continue
  const html=await (await fetch(`${origin}${path}`)).text()
  assert.match(html,/name="robots" content="noindex"/,`omitted route must be noindex: ${path}`)
  assert.ok(!html.includes('"@type":"BlogPosting"'),`draft rich markup ${path}`)
}
assert.equal((await fetch(`${origin}/tags/not-a-real-topic`)).status,404)
assert.match(await (await fetch(`${origin}/robots.txt`)).text(),/Sitemap: https:\/\/bookkity.com\/sitemap.xml/)
console.log(`Verified ${urls.length} indexable routes, draft exclusions, tag 404, robots and sitemap headers.`)
