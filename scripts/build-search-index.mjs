import fs from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {pathToFileURL} from 'node:url'
import {collectSearchRecords} from './search-content.mjs'
import {buildSearchArtifact} from '../src/search/engine.mjs'

async function writeChanged(file, text) {
  if (await fs.readFile(file, 'utf8').catch(() => null) === text) return
  await fs.mkdir(path.dirname(file), {recursive:true})
  await fs.writeFile(`${file}.tmp`, text)
  await fs.rename(`${file}.tmp`, file)
}
export async function buildSearchIndex(root = process.cwd()) {
  const records = await collectSearchRecords(root)
  const json = JSON.stringify(buildSearchArtifact(records))
  const hash = createHash('sha256').update(json).digest('hex').slice(0,20)
  const url = `/search-assets/${hash}.json`
  await writeChanged(path.join(root, 'public', url), json)
  await writeChanged(path.join(root, 'src/generated/search.json'), JSON.stringify({url})+'\n')
  // Only retain the current generated artifact in the next deployment.
  for (const file of await fs.readdir(path.join(root, 'public/search-assets'))) {
    if (/^[a-f0-9]{20}\.json$/.test(file) && file !== `${hash}.json`) {
      await fs.unlink(path.join(root, 'public/search-assets', file))
    }
  }
  return {url, records: records.length, bytes: Buffer.byteLength(json)}
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(await buildSearchIndex())
