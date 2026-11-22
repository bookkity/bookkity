// Audit the pre-SEO route inventory against a running production build.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import matter from 'gray-matter'
const origin = process.argv[2] || 'http://127.0.0.1:3100'
const ref = process.env.LEGACY_REF || 'fd3742a'
const files = execFileSync('git',['ls-tree','-r','--name-only',ref],{encoding:'utf8'}).trim().split('\n')
const read = file => execFileSync('git',['show',`${ref}:${file}`])
const metadata = file => matter(read(file).toString()).data
const unchanged = new Set(['/about','/series','/projects','/merch'])
const moved = new Map([['/','/articles'],['/article','/articles']])
for(const file of files) {
  if(file.startsWith('articles/') && /\.mdx?$/.test(file)) {
    const {url} = metadata(file)
    moved.set(`/article/${url}`,`/articles/${url}`)
  }
  if(file.startsWith('authors/') && file.endsWith('.md')) moved.set(`/${metadata(file).name}`, `/author/${metadata(file).name}`)
  if(file.startsWith('series/') && file.endsWith('.mdx') && !file.endsWith('/.mdx')) {
    const details = metadata(`${file.slice(0,file.lastIndexOf('/'))}/.mdx`)
    unchanged.add(`/series/${details.url}/${metadata(file).order}`)
  }
}
for(const project of JSON.parse(read('projects/projects.json'))) if(!project.url.startsWith('http')) unchanged.add(`/project/${project.id}`)
for(const item of JSON.parse(read('merch/merch.json'))) unchanged.add(`/merch/${item.id}`)
for(const [from,to] of moved) {
  const suffix='?ref=legacy-audit'
  const response=await fetch(`${origin}${from}${suffix}`,{redirect:'manual'})
  assert.equal(response.status,308,from)
  assert.equal(response.headers.get('location'),`${to}${suffix}`,from)
  const destination = await fetch(`${origin}${to}`)
  assert.equal(destination.status,200,to)
  if (to.startsWith('/author/')) {
    const html = await destination.text()
    assert.ok(html.includes(`rel="canonical" href="https://bookkity.com${to}"`), to)
    assert.ok(html.includes(`https://bookkity.com${to}#person`), to)
    assert.ok(!html.includes(`https://bookkity.com${from}#person`), from)
  }
}
for(const path of unchanged) assert.equal((await fetch(`${origin}${path}`,{redirect:'manual'})).status,200,path)
let assets=0
for(const file of files.filter(f=>f.startsWith('public/'))) {
  const path='/'+file.slice(7).split('/').map(encodeURIComponent).join('/')
  const response=await fetch(`${origin}${path}`,{redirect:'manual'})
  assert.equal(response.status,200,path)
  const digest = bytes => createHash('sha256').update(bytes).digest('hex')
  assert.equal(digest(Buffer.from(await response.arrayBuffer())),digest(read(file)),`unchanged asset ${path}`)
  assets++
}
for(const from of ['/article/hello-world/','/articles/0-10/','/tag/java/0-10/']) {
  let path=from, hops=0
  while(true) {
    const response=await fetch(`${origin}${path}`,{redirect:'manual'})
    if(response.status===200) break
    assert.equal(response.status,308,path)
    assert.ok(++hops<=2,`redirect chain ${from}`)
    path=response.headers.get('location')
  }
}
assert.equal((await fetch(`${origin}/article/not-a-real-post`)).status,404)
assert.equal((await fetch(`${origin}/author/not-a-real-author`)).status,404)
assert.equal((await fetch(`${origin}/not-a-real-author`, {redirect:'manual'})).status,404)
const rss=await (await fetch(`${origin}/rss.xml`)).text()
assert.ok(rss.includes('https://bookkity.com/articles/'))
for (const item of rss.matchAll(/<item>(.*?)<\/item>/gs)) {
  const link = item[1].match(/<link>(.*?)<\/link>/s)?.[1]
  const guid = item[1].match(/<guid[^>]*>(.*?)<\/guid>/s)?.[1]
  if (link?.includes('/articles/')) assert.equal(guid, link.replace('/articles/', '/article/'), 'stable RSS identity')
  else assert.ok(item[1].includes('isPermaLink="true"'), 'chapter GUID semantics preserved')
}
console.log(`Legacy audit: ${moved.size} permanent mappings with query preservation, ${unchanged.size} unchanged routes, ${assets} byte-identical assets; slash aliases and RSS passed.`)
