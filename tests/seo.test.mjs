import test from 'node:test'
import assert from 'node:assert/strict'
import {collectTags, tagPath, legacyTagDestination} from '../src/helpers/tags.js'
import {contentImage, pageGraph, serializeJsonLd} from '../src/helpers/seo.js'
import {sitemapPaths, renderSitemap} from '../src/helpers/sitemap.js'

const articles = [{url:'hello', image:'cover.jpg', date:'2024-01-01', tags:['Java', 'Windows Internals']}, {url:'_draft', image:'cover.jpg', tags:['Draft']}]
const series = [{details:{url:'guide', image:'cover.jpg', tags:['Kotlin']}, chapters:[{order:1,published:true,listed:false},{order:2,published:false,listed:true}]}]
test('tags derive from public content, encode routes and reject collisions', () => {
  assert.deepEqual(collectTags(articles,series).map(t=>t.slug), ['java','kotlin','windows-internals'])
  assert.equal(tagPath('C++'), '/tag/c%2B%2B')
  assert.throws(()=>collectTags([{url:'x',tags:['A B','A-B']}],[]), /collision/)
})
test('sitemap includes published unlisted chapters, excludes drafts/external projects, deduplicates', () => {
  const paths=sitemapPaths({articles,series,authors:[{name:'alice'}],projects:[{id:'internal',url:'local'},{id:'external',url:'https://example.com'}],merch:[{id:'shirt'}]})
  for(const path of ['/series/guide/1','/alice','/tag/kotlin','/project/internal','/merch/shirt']) assert.ok(paths.includes(path),path)
  for(const path of ['/articles/_draft','/series/guide/2','/tag/draft','/project/external']) assert.ok(!paths.includes(path),path)
  assert.equal(new Set(paths).size,paths.length)
  assert.match(renderSitemap(['/a?b=1&c=2']), /&amp;c=2/)
  assert.ok(!renderSitemap(paths).includes('lastmod'))
})
test('post and profile share person IDs; schema is safe inside HTML and omits draft posts', () => {
  const person={name:'alice',avatar:'alice.png',description:'Writer'}
  const base={title:'</script><script>alert(1)</script>',description:'Example',path:'/articles/hello',kind:'post',date:'2024-01-01',language:'en',authors:[person],tags:['Java']}
  const graph=pageGraph(base), post=graph['@graph'].find(n=>n['@type']==='BlogPosting')
  const profile=pageGraph({kind:'profile',title:'alice',description:'Writer',path:'/alice',person})
  assert.equal(post.author[0]['@id'], profile['@graph'].find(n=>n['@type']==='Person')['@id'])
  assert.equal(post.publisher['@id'],'https://bookkity.com/#organization')
  assert.ok(!serializeJsonLd(graph).includes('<'))
  assert.deepEqual(JSON.parse(serializeJsonLd(graph)),JSON.parse(JSON.stringify(graph)))
  assert.ok(!pageGraph({...base,noindex:true})['@graph'].some(n=>n['@type']==='BlogPosting'))
  assert.equal(contentImage('article','/0001/image.png'),'https://bookkity.com/article/0001/image.png')
})

test('sitemap preserves URL data while encoding XML text delimiters', () => {
  const xml = renderSitemap(["/articles?a=1&label='quoted'&payload=<script>"])
  assert.ok(xml.includes("a=1&amp;label=%27quoted%27&amp;payload=%3Cscript%3E"))
  assert.ok(!xml.includes('<script>'))
})

test('legacy home fragments resolve only to known topic paths', () => {
  const tags=collectTags(articles,series)
  assert.equal(legacyTagDestination('#Java',tags),'/tag/java')
  assert.equal(legacyTagDestination('#Windows%20Internals',tags),'/tag/windows-internals')
  for(const hash of ['#unknown','#%ZZ','#https://evil.example','#']) assert.equal(legacyTagDestination(hash,tags),null)
})

test('curated navigation retains its original labels and empty topic routes', async () => {
  const {BROWSE_TOPICS, listingTags} = await import('../src/helpers/tags.js')
  assert.deepEqual(BROWSE_TOPICS.map(tag => tag.label), ['All', 'JVM', 'Java', 'Kotlin', 'Rust', 'DevOps', 'Hardware'])
  const routes = listingTags(articles, series)
  for (const slug of ['rust', 'devops', 'hardware']) assert.ok(routes.some(tag => tag.slug === slug))
  assert.equal(routes.filter(tag => tag.slug === 'java').length, 1)
})
