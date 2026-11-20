// Claim: choose natural-query relevance on this corpus; characterize latency, not a speedup guarantee.
// Times: initialization + consumed query batches; excludes file collection/build and UI/network.
import fs from 'node:fs/promises'
import os from 'node:os'
import {performance} from 'node:perf_hooks'
import {gzipSync} from 'node:zlib'
import Fuse from 'fuse.js'
import {collectSearchRecords} from './search-content.mjs'
import {buildSearchArtifact,createSearch,SEARCH_OPTIONS} from '../src/search/engine.mjs'
import {metadataCases as searchCases} from '../tests/search-cases.mjs'

const loadBefore = os.loadavg()
const records = await collectSearchRecords()
const artifact = buildSearchArtifact(records)
const variants = ['fuzzy','token-all','token-any','extended'].flatMap(mode => [0,0.2,0.3,0.4,0.6].map(threshold => ({
  name:`${mode}-${threshold}`, options:{...SEARCH_OPTIONS, threshold,
    useTokenSearch:mode.startsWith('token'), tokenMatch:mode==='token-all'?'all':'any',useExtendedSearch:mode==='extended'},
})))
const summary = values => ({median: [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)], min:Math.min(...values), max:Math.max(...values)})
const results = variants.map(v => ({name:v.name, runs:[], failedQueries:[], errors:0, consumedResults:0}))
for(let round=0;round<5;round++) {
  const order=round%2 ? [...variants.keys()].reverse() : [...variants.keys()]
  for(const i of order) {
    const result=results[i], start=performance.now()
    try {
      const search=createSearch(artifact, variants[i].options)
      const initialized=performance.now()
      for(const [query,expected] of searchCases) {
        const hits=search(query);result.consumedResults+=hits.length
        if((hits[0]?.url || null)!==expected && !result.failedQueries.includes(query)) result.failedQueries.push(query)
      }
      result.runs.push({initializationMs:initialized-start, batchMs:performance.now()-initialized})
    } catch(error) {result.errors++;result.failure=String(error)}
  }
}
for(const r of results) {
  r.initializationMs=summary(r.runs.map(v=>v.initializationMs));r.queryBatchMs=summary(r.runs.map(v=>v.batchMs))
  r.passed=searchCases.length-r.failedQueries.length
}
// Alternate corpus sizes too, so sustained CPU load does not always favor one size.
const probes = [250,1000].map(count => {
  const expanded=Array.from({length:count},(_,i)=>({...records[i%records.length],url:`${records[i%records.length].url}-${i}`}))
  const data=buildSearchArtifact(expanded)
  return {count,data,runs:[],errors:0,consumed:0}
})
for(let round=0;round<5;round++) {
  for(const probe of round%2 ? [...probes].reverse() : probes) {
    const start=performance.now(), search=createSearch(probe.data), initialized=performance.now()
    for(const [q, expected] of searchCases) {
      const hits=search(q);probe.consumed+=hits.length
      if (expected && !hits.some(h=>h.url.startsWith(expected+'-'))) probe.errors++
      if (!expected && hits.length) probe.errors++
    }
    probe.runs.push({initializationMs:initialized-start,batchMs:performance.now()-initialized})
  }
}
const stress=probes.map(({data,...probe}) => ({...probe,synthetic:true,bytes:Buffer.byteLength(JSON.stringify(data)),gzipBytes:gzipSync(JSON.stringify(data)).length,
  initializationMs:summary(probe.runs.map(r=>r.initializationMs)),queryBatchMs:summary(probe.runs.map(r=>r.batchMs))}))
const report={runtime:process.version,fuse:Fuse.version,platform:os.platform(),architecture:os.arch(),cores:os.availableParallelism(),cpu:os.cpus()[0].model,loadBefore,loadAfter:os.loadavg(),
  corpus:records.length,queries:searchCases.length,rounds:5,bytes:Buffer.byteLength(JSON.stringify(artifact)),gzipBytes:gzipSync(JSON.stringify(artifact)).length,results,stress}
const output=process.argv.includes('--profile')?'/tmp/bookkity-search-profile-results.json':'/tmp/bookkity-search-benchmark.json'
await fs.writeFile(output,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({output,corpus:records.length,quality:results.map(r=>({name:r.name,passed:r.passed,errors:r.errors})),stress:stress.map(s=>({count:s.count,errors:s.errors,batch:s.queryBatchMs}))},null,2))
