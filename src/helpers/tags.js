// Curated browse navigation from the original homepage; content tags remain independent.
export const BROWSE_TOPICS = [
  {label: 'All', slug: '', path: '/articles'},
  ...['JVM', 'Java', 'Kotlin', 'Rust', 'DevOps', 'Hardware'].map(label => ({
    label, slug: label.toLowerCase(), path: `/tag/${label.toLowerCase()}`,
  })),
]

export function listingTags(articles, series) {
  const tags = collectTags(articles, series)
  return [...tags, ...BROWSE_TOPICS.filter(topic => topic.slug && !tags.some(tag => tag.slug === topic.slug))
    .map(topic => ({...topic, label: topic.slug}))]
}

export function tagSlug(label) {
  return label.trim().toLowerCase().replace(/\s+/g, '-')
}

export function tagPath(label) {
  return `/tag/${encodeURIComponent(tagSlug(label))}`
}

/** Include published chapters even when they are absent from the home feed. */
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

/** Old home-page topic fragments never reach the HTTP redirect handler. */
export function legacyTagDestination(hash, tags) {
  let slug
  try { slug = tagSlug(decodeURIComponent(hash.replace(/^#/, ''))) } catch { return null }
  return tags.find(tag => tag.slug === slug)?.path || null
}
