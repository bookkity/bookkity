import manifest from '../generated/search.json'
import {createSearch} from './engine.mjs'

let ready
let latestId
function load() {
  return ready ||= fetch(manifest.url, {signal: AbortSignal.timeout(30000)})
    .then(response => {
      if (!response.ok) throw new Error('Search download failed')
      return response.json()
    })
    .then(artifact => createSearch(artifact))
    .catch(error => {
      ready = undefined
      throw error
    })
}
self.onmessage = async ({data: {id, query}}) => {
  latestId = id
  try {
    const search = await load()
    if (id === latestId) self.postMessage({id, results: search(query)})
  } catch {
    if (id === latestId) self.postMessage({id, error: true})
  }
}
