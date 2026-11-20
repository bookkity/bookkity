import Fuse from 'fuse.js'

export const SEARCH_KEYS = [
  {name: 'title', weight: 4}, {name: 'tags', weight: 3}, {name: 'keywords', weight: 3},
  {name: 'authors', weight: 2}, {name: 'series', weight: 2},
  {name: 'description', weight: 1},
]
export const SEARCH_OPTIONS = {
  keys: SEARCH_KEYS, includeScore: true, ignoreLocation: true, ignoreDiacritics: true,
  threshold: 0.3, useTokenSearch: true, tokenMatch: 'all',
  // Retain language names such as C++ and C#; punctuation isn't query syntax.
  tokenize: /[\p{L}\p{M}\p{N}_]+(?:[+#]+)?/gu,
}
export const SEARCH_LIMIT = 20
export const MAX_QUERY_LENGTH = 200

export function buildSearchArtifact(records) {
  return {
    schemaVersion: 2, fuseVersion: Fuse.version,
    // The index owns searchable metadata; results carry only what the UI renders.
    records: records.map(({url, title, description, authors, series}) => ({url, title, description, authors, series})),
    index: Fuse.createIndex(SEARCH_KEYS, records).toJSON(),
  }
}

export function createSearch(artifact, options = SEARCH_OPTIONS) {
  if (artifact.schemaVersion !== 2 || artifact.fuseVersion !== Fuse.version || !Array.isArray(artifact.records)) {
    throw new Error('Search data version mismatch. Reload this page.')
  }
  const fuse = new Fuse(artifact.records, options, Fuse.parseIndex(artifact.index))
  return query => {
    const text = query.trim().slice(0, MAX_QUERY_LENGTH)
    if (!text.match(/[\p{L}\p{N}]/u)) return []
    return fuse.search(text, {limit: SEARCH_LIMIT}).map(({item}) => item)
  }
}
