import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {collectSearchRecords, searchText} from '../scripts/search-content.mjs'
import {buildSearchIndex} from '../scripts/build-search-index.mjs'
import {buildSearchArtifact, createSearch} from '../src/search/engine.mjs'
import {searchCases} from './search-cases.mjs'

test('public corpus: all relevance cases survive index serialization', async () => {
  const records = await collectSearchRecords()
  const artifact = JSON.parse(JSON.stringify(buildSearchArtifact(records)))
  assert.ok(artifact.records.every(record => !('body' in record)))
  const search = createSearch(artifact)
  for (const [query, expected] of searchCases) assert.equal(search(query)[0]?.url ?? null, expected, query)
  assert.equal(search('memory training').length, 0, 'unpublished chapter')
  assert.throws(() => createSearch({...artifact, fuseVersion: 'old'}), /version mismatch/)
})

test('MDX extraction includes prose, code and alt text without evaluating expressions', () => {
  const source = 'import HiddenImport from "hidden-module"\n\n# Heading\n\n<Card>Visible child</Card>\n\n![Diagram](private-url)\n\n`ApiSetMap`\n\n```js\nfindPlugins()\n```\n\n{secretVariable}\n\n<script>hiddenScript</script>'
  assert.equal(searchText(source), 'Heading Visible child Diagram ApiSetMap findPlugins()')
})

test('new content and author metadata automatically change the generated index', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bookkity-search-'))
  t.after(() => fs.rm(root, {recursive: true, force: true}))
  const write = async (file, text) => {
    const full = path.join(root, file)
    await fs.mkdir(path.dirname(full), {recursive: true})
    await fs.writeFile(full, text)
  }
  await write('authors/ada.md', '---\nname: Ada Lovelace\n---')
  await write('articles/one.mdx', '---\ntitle: C++ notes\nurl: cpp\nauthors: [ada]\ntags: [programming]\nkeywords: [platypus]\n---\nCrème brûlée. `UniqueCompilerIdentifier`')
  await write('articles/hidden.mdx', '---\ntitle: Hidden\nurl: _hidden\nauthors: [ada]\n---\nclassifiedsecret')
  await write('series/tutorial/.mdx', '---\ntitle: Compiler series\nurl: compiler\nauthors: [ada]\ntags: [toolchain]\n---')
  await write('series/tutorial/one.mdx', '---\ntitle: C# notes\nshortTitle: ConciseAlias\norder: 1\npublished: true\nlisted: false\n---\nExclusiveChapterText')
  await write('series/tutorial/draft.mdx', '---\ntitle: Draft\norder: 2\npublished: false\n---\nclassifiedsecret')
  const first = await buildSearchIndex(root)
  const readArtifact = async result => JSON.parse(await fs.readFile(path.join(root, 'public', result.url), 'utf8'))
  const search = createSearch(await readArtifact(first))
  for (const query of ['platypus', 'UniqueCompilerIdentifier', 'creme brulee', 'Ada Lovelace C++']) {
    assert.equal(search(query)[0]?.url, '/articles/cpp', query)
  }
  assert.equal(search('C#')[0]?.url, '/series/compiler/1')
  assert.equal(search('ConciseAlias')[0]?.url, '/series/compiler/1')
  assert.equal(search('C++')[0]?.url, '/articles/cpp')
  assert.equal(search('toolchain ExclusiveChapterText')[0]?.url, '/series/compiler/1')
  assert.equal(search('classifiedsecret').length, 0)
  assert.equal(first.records, 2)
  assert.deepEqual(await buildSearchIndex(root), first, 'unchanged input produces the same artifact')
  await write('articles/new.mdx', '---\ntitle: Newly added article\nurl: new space\nauthors: [ada]\n---\nFreshlyDiscoverable')
  const second = await buildSearchIndex(root)
  assert.notEqual(second.url, first.url)
  await assert.rejects(fs.access(path.join(root, 'public', first.url)), /ENOENT/)
  assert.equal(createSearch(await readArtifact(second))('FreshlyDiscoverable')[0]?.url, '/articles/new%20space')
  await write('articles/collision.mdx', '---\ntitle: Duplicate\nurl: new space\nauthors: [ada]\n---\nDuplicate')
  await assert.rejects(buildSearchIndex(root), /Duplicate search URL/)
})
