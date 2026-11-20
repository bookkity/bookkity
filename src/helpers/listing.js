export const PAGE_SIZE = 10

/** Shared public-card inventory; no MDX bodies cross into listing props. */
export function createPreviews(articles, series, tag = '') {
  return [
    ...articles.filter(a => !a.url.startsWith('_')).map(a => ({
      type: 'article', title: a.title, tags: a.tags, authors: a.authors, language: a.language,
      image: `/article/${a.image.replace(/^\/+/, '')}`, url: `/articles/${a.url}`, date: a.date,
    })),
    ...series.flatMap(s => s.chapters.filter(c => c.published === true && (tag || c.listed)).map(c => ({
      type: 'chapter', title: `${s.details.title}: ${c.shortTitle}`, tags: s.details.tags,
      authors: s.details.authors, language: s.details.language,
      image: `/series/${(c.image || s.details.image).replace(/^\/+/, '')}`,
      url: `/series/${s.details.url}/${c.order}`, date: c.date,
    }))),
  ].filter(p => !tag || p.tags.includes(tag))
    .sort((a, b) => new Date(b.date) - new Date(a.date) || a.url.localeCompare(b.url))
}

export function listingPath(base, start) {
  return start === 0 ? base : `${base}/${start}-${start + PAGE_SIZE}`
}

export function listingPaths(total, base) {
  return Array.from({length: Math.max(1, Math.ceil(total / PAGE_SIZE))}, (_, i) => listingPath(base, i * PAGE_SIZE))
}

/** Exact, aligned [start,end) ranges only. null denotes a 404. */
export function listingPage(previews, base, range) {
  let start = 0
  if (range !== undefined) {
    if (!/^(0|[1-9]\d*)-(0|[1-9]\d*)$/.test(range)) return null
    const [from, to] = range.split('-').map(Number)
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from % PAGE_SIZE || to !== from + PAGE_SIZE) return null
    start = from
  }
  if (start > 0 && start >= previews.length) return null
  return {
    previews: previews.slice(start, start + PAGE_SIZE), path: listingPath(base, start), start, total: previews.length,
    previous: start > 0 ? listingPath(base, start - PAGE_SIZE) : null,
    next: start + PAGE_SIZE < previews.length ? listingPath(base, start + PAGE_SIZE) : null,
  }
}
