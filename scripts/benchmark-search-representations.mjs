// Run on the homelab: node scripts/benchmark-search-representations.mjs /path/to/full-body-checkout
import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import os from 'node:os'
import {performance} from 'node:perf_hooks'
import {gzipSync} from 'node:zlib'
import matter from 'gray-matter'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import Fuse from 'fuse.js'
import {collectSearchRecords} from './search-content.mjs'
import {buildSearchArtifact, createSearch, SEARCH_KEYS, SEARCH_OPTIONS} from '../src/search/engine.mjs'
import {searchCases, metadataCases} from '../tests/search-cases.mjs'

const baselineRoot = process.argv[2]
if (!baselineRoot) throw new Error('Pass a checkout of full-body baseline 12da8c7 (with its dependencies installed).')
const baseline = await import(pathToFileURL(path.resolve(baselineRoot, 'src/search/engine.mjs')))
const loadBefore = os.loadavg()
const records = await collectSearchRecords()
// Headings are a benchmark-only alternative, not another production mode.
const parser = unified().use(remarkParse).use(remarkMdx)
const headingsByUrl = new Map()
const read = async file => matter(await fs.readFile(file, 'utf8'))
const addHeadings = (url, source) => {
  const headings = []
  const text = node => ['text', 'inlineCode'].includes(node.type) ? node.value : (node.children || []).map(text).join(' ')
  const visit = node => {
    if (node.type === 'heading') headings.push(text(node))
    else node.children?.forEach(visit)
  }
  visit(parser.parse(source))
  headingsByUrl.set(url, [...new Set(headings)].join(' ').slice(0, 1024))
}
for (const file of await fs.readdir('articles')) {
  if (!/\.mdx?$/.test(file)) continue
  const {data, content} = await read(path.join('articles', file))
  addHeadings(`/articles/${encodeURIComponent(data.url)}`, content)
}
for (const directory of await fs.readdir('series', {withFileTypes: true})) {
  if (!directory.isDirectory()) continue
  const folder = path.join('series', directory.name)
  const {data: series} = await read(path.join(folder, '.mdx'))
  for (const file of await fs.readdir(folder)) {
    if (file === '.mdx' || !/\.mdx?$/.test(file)) continue
    const {data, content} = await read(path.join(folder, file))
    addHeadings(`/series/${encodeURIComponent(series.url)}/${data.order}`, content)
  }
}
const sources = records.map(record => ({...record, headings: headingsByUrl.get(record.url) || ''}))
const headingOptions = {...SEARCH_OPTIONS, keys: [...SEARCH_KEYS, {name: 'headings', weight: 1}]}
const variants = [
  {name: 'fullBody', build: input => baseline.buildSearchArtifact(input.map(({headings, ...record}) => record)), search: baseline.createSearch},
  {name: 'metadata', build: buildSearchArtifact, search: createSearch},
  {name: 'metadataHeadings', build: input => ({...buildSearchArtifact(input), index: Fuse.createIndex(headingOptions.keys, input).toJSON()}), search: artifact => createSearch(artifact, headingOptions)},
]
const summarize = values => ({median: [...values].sort((a,b)=>a-b)[Math.floor(values.length / 2)], min: Math.min(...values), max: Math.max(...values)})
const size = data => ({bytes: Buffer.byteLength(JSON.stringify(data)), gzipBytes: gzipSync(JSON.stringify(data)).length})
const checks = (search, cases) => cases.flatMap(([query, expected]) => {
  const actual = search(query)[0]?.url ?? null
  return actual === expected ? [] : [{query, expected, actual}]
})
const quality = variants.map(variant => {
  const search = variant.search(variant.build(sources))
  return {name: variant.name, metadataFailures: checks(search, metadataCases), historicalFailures: checks(search, searchCases)}
})
if (process.argv.includes('--coverage-only')) {
  const headingCoverage = variants.map(variant => ({name: variant.name, failures: checks(variant.search(variant.build(sources)), [['immutable objects', '/articles/toward-functional-paradigm-fundamental-concepts-in-java']])}))
  console.log(JSON.stringify({quality, headingCoverage}, null, 2))
  process.exit(0)
}
const probes = [records.length, 1000].flatMap(count => {
  const input = count === records.length ? sources : Array.from({length: count}, (_, i) => ({...sources[i % sources.length], url: sources[i % sources.length].url + '?copy=' + i}))
  return variants.map(variant => ({variant, count, artifact: variant.build(input), runs: [], errors: 0, consumed: 0}))
})
for (let round = 0; round < 5; round++) {
  for (const probe of round % 2 ? [...probes].reverse() : probes) {
    const start = performance.now()
    const search = probe.variant.search(probe.artifact)
    const initialized = performance.now()
    for (const [query, expected] of metadataCases) {
      const hits = search(query)
      probe.consumed += hits.length
      if (expected ? hits[0]?.url.split('?')[0] !== expected : hits.length !== 0) probe.errors++
    }
    probe.runs.push({initializationMs: initialized - start, batchMs: performance.now() - initialized})
  }
}
// Separate field-removal savings from compacting display records; this variant is size-only.
const large = Array.from({length: 1000}, (_, i) => ({...records[i % records.length], url: records[i % records.length].url + '?copy=' + i}))
const bodyRemovedOnly = {...baseline.buildSearchArtifact(large), index: Fuse.createIndex(SEARCH_KEYS, large).toJSON()}
const report = {
  runtime: process.version, fuse: Fuse.version, cpu: os.cpus()[0].model, cores: os.availableParallelism(), loadBefore, loadAfter: os.loadavg(),
  rounds: 5, queryCount: metadataCases.length, historicalQueryCount: searchCases.length, quality, bodyRemovedWithoutDisplayCompaction: size(bodyRemovedOnly),
  measurements: probes.map(({variant, count, artifact, runs, errors, consumed}) => ({name: variant.name, count, synthetic: count !== records.length, ...size(artifact), errors, consumed, runs,
    initializationMs: summarize(runs.map(r => r.initializationMs)), batchMs: summarize(runs.map(r => r.batchMs))})),
}
await fs.writeFile('/tmp/bookkity-keyword-benchmark.json', JSON.stringify(report, null, 2)+'\n')
console.log(JSON.stringify(report, null, 2))
if (quality.some(q => q.metadataFailures.length) || probes.some(p => p.errors)) process.exitCode = 1
