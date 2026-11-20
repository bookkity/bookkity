import test from 'node:test'
import assert from 'node:assert/strict'
import {createPreviews, listingPage, listingPaths} from '../src/helpers/listing.js'
import {sitemapPaths} from '../src/helpers/sitemap.js'
const items = count => Array.from({length:count}, (_, i) => ({url:`/articles/post-${i}`}))

test('fixed ranges partition 0, 1, 10, 11 and 21 items without gaps or overlap', () => {
  for (const count of [0,1,10,11,21]) {
    const paths = listingPaths(count, '/articles')
    const pages = paths.map((path,i) => listingPage(items(count), '/articles', i ? path.split('/').at(-1) : undefined))
    assert.deepEqual(pages.flatMap(p => p.previews), items(count))
    pages.forEach((page,i) => {
      assert.ok(page.previews.length <= 10)
      assert.equal(page.previous, paths[i-1] || null)
      assert.equal(page.next, paths[i+1] || null)
      assert.equal(page.path, paths[i])
    })
  }
  assert.equal(listingPage(items(21), '/tag/java', '20-30').previews.length,1)
  assert.equal(listingPage(items(21), '/tag/java', '0-10').path,'/tag/java')
})
test('invalid, ambiguous, unsafe and empty later ranges are rejected', () => {
  for(const range of ['00-10','0-010','1-11','10-30','-10-0','10','10-20/20-30','9007199254740990-9007199254741000','30-40']) {
    assert.equal(listingPage(items(21), '/articles', range),null,range)
  }
})
test('shared inventory keeps deterministic order, publication and canonical sitemap pages', () => {
  const articles = Array.from({length:21}, (_,i) => ({url:`post-${String(i).padStart(2,'0')}`,date:'2024-01-01',title:'Post',image:'/cover.jpg',tags:['Java']}))
  const series = [{details:{url:'guide',title:'Guide',image:'cover.jpg',tags:['Java']},chapters:[{order:1,published:true,listed:false,date:'2025-01-01'},{order:2,published:false,listed:true,date:'2025-01-02'}]}]
  const previews = createPreviews(articles,series)
  assert.equal(previews.length,21)
  assert.equal(previews[0].url,'/articles/post-00')
  assert.equal(createPreviews([...articles].reverse(),series)[0].url,previews[0].url)
  assert.equal(createPreviews(articles,series,'Java')[0].url,'/series/guide/1')
  assert.ok(!('content' in previews[0]))
  const paths=sitemapPaths({articles,series,authors:[],projects:[],merch:[]})
  for(const path of ['/articles','/articles/10-20','/articles/20-30','/tag/java','/tag/java/10-20','/tag/java/20-30']) assert.ok(paths.includes(path),path)
  assert.ok(!paths.some(p=>p.endsWith('/0-10')||p.endsWith('/30-40')))
})
