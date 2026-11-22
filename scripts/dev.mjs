import {watch} from 'node:fs'
import {spawn} from 'node:child_process'
import {buildSearchIndex} from './build-search-index.mjs'
import {buildImageSizes} from './build-image-sizes.mjs'

await Promise.all([buildSearchIndex(), buildImageSizes()])
let timer
let pending = Promise.resolve()
const watchers = ['articles', 'series', 'authors', 'public'].map(directory => watch(directory, {recursive: true}, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    pending = pending.then(() => Promise.all([buildSearchIndex(), buildImageSizes()])).catch(error => console.error('Generated assets:', error))
  }, 150)
}))
const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', ...process.argv.slice(2)], {stdio: 'inherit'})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => next.kill(signal))
next.on('exit', code => {
  clearTimeout(timer)
  watchers.forEach(watcher => watcher.close())
  process.exitCode = code ?? 0
})
