/** Tags are derived from indexable content, not the home feed's `listed` flag. */
export function tagSlug(label) {
  return label.trim().toLowerCase().replace(/\s+/g, '-')
}

export function tagPath(label) {
  return `/tags/${encodeURIComponent(tagSlug(label))}`
}

export function collectTags(articles, series) {
  const labels = articles.filter(a => !a.url.startsWith('_')).flatMap(a => a.tags)
    .concat(series.filter(s => s.chapters.some(c => c.published === true)).flatMap(s => s.details.tags))
  const tags = new Map()
  for (const label of labels) {
    const slug = tagSlug(label)
    if (!slug || /[/?#]/.test(slug)) throw new Error(`Invalid tag: ${label}`)
    if (tags.has(slug) && tags.get(slug).label !== label) throw new Error(`Tag slug collision: ${label}`)
    tags.set(slug, { label, slug, path: tagPath(label) })
  }
  return [...tags.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}
