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
  const listing = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1]).props.pageProps.listingPage
  if (listing) assert.equal((html.match(/<h1[ >]/g)||[]).length, 0, `no visible listing title ${path}`)
  else assert.ok((html.match(/<h1[ >]/g)||[]).length >= 1, `h1 ${path}`)
  for(const node of graph.filter(n=>n['@type']==='BlogPosting')) {
    for(const author of node.author) assert.ok(graph.some(n=>n['@type']==='Person'&&n['@id']===author['@id']))
  }
  const list = graph.find(n => n['@type'] === 'ItemList')
  if (list) {
    assert.ok(list.itemListElement.length <= 10, `bounded page ${path}`)
    const data = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1]).props.pageProps
    assert.equal(data.path, path)
    for (const direction of ['previous', 'next']) if (data[direction]) {
      assert.ok((html.match(/<a\b[^>]*>/g) || []).some(link => link.includes(`href="${data[direction]}"`) && link.includes(`rel="${direction === 'previous' ? 'prev' : 'next'}"`)), `navigation ${path}`)
      assert.ok(urls.includes(`https://bookkity.com${data[direction]}`), `sitemap pagination ${path}`)
    }
    const offsets = list.itemListElement.map(item => html.indexOf(`href="${new URL(item.url).pathname}"`))
    assert.ok(offsets.every((offset, i) => offset >= 0 && (i === 0 || offset > offsets[i - 1])), `schema matches visible order ${path}`)
  }
  if(path.startsWith('/tag/')) assert.ok(/href="\/(articles|series)\//.test(html),`topic links ${path}`)
  visited.add(path)
}
for(const path of Object.keys(manifest.routes)) {
  if(visited.has(path)) continue
  const response = await fetch(`${origin}${path}`, {redirect:'manual'})
  if (response.status === 308) {
    assert.ok(path.endsWith('/0-10'), `unexpected alias ${path}`)
    assert.equal(response.headers.get('location'), path.slice(0, -5))
    continue
  }
  const html=await response.text()
  assert.match(html,/name="robots" content="noindex"/,`omitted route must be noindex: ${path}`)
  assert.ok(!html.includes('"@type":"BlogPosting"'),`draft rich markup ${path}`)
}
assert.equal((await fetch(`${origin}/tag/not-a-real-topic`)).status,404)
assert.match(await (await fetch(`${origin}/robots.txt`)).text(),/Sitemap: https:\/\/bookkity.com\/sitemap.xml/)
console.log(`Verified ${urls.length} indexable routes, draft exclusions, tag 404, robots and sitemap headers.`)

for(const [from,to] of [['/','/articles'],['/article','/articles'],['/article/hello-world','/articles/hello-world'],['/articles/0-10','/articles'],['/tag/java/0-10','/tag/java'],['/tags/java','/tag/java']]) {
  const response=await fetch(`${origin}${from}`,{redirect:'manual'})
  assert.equal(response.status,308,from)
  assert.equal(response.headers.get('location'),to,from)
}
for(const path of ['/articles/00-10','/articles/1-11','/articles/10-30','/articles/9990-10000','/tag/java/10-30','/tag/java/10-20/20-30']) {
  assert.equal((await fetch(`${origin}${path}`)).status,404,path)
}
assert.equal((await fetch(`${origin}/article/0003/logo.png`)).status,200,'legacy article asset')
if(process.env.REQUIRE_PAGINATION === 'true') {
  for(const path of ['/articles/10-20','/articles/20-30','/tag/java/10-20','/tag/java/20-30']) assert.ok(visited.has(path),path)
}
console.log('Verified permanent aliases, malformed ranges, pagination links and retained image URLs.')
