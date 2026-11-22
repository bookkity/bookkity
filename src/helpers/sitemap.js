import {authorPath} from './author-path.js'
import {absoluteUrl} from './seo.js'
import {createPreviews, listingPaths} from './listing.js'
import {collectTags} from './tags.js'

/** Enumerate indexable routes, independently of home-feed visibility. */
export function sitemapPaths({articles, series, authors, projects, merch}) {
  return [...new Set([
    ...listingPaths(createPreviews(articles, series).length, '/articles'), '/about', '/series', '/projects', '/merch',
    ...authors.map(a => authorPath(a.name)),
    ...articles.filter(a => !a.url.startsWith('_')).map(a => `/articles/${encodeURIComponent(a.url)}`),
    ...series.flatMap(s => s.chapters.filter(c => c.published === true).map(c => `/series/${encodeURIComponent(s.details.url)}/${c.order}`)),
    ...projects.filter(p => !p.url.startsWith('http')).map(p => `/project/${encodeURIComponent(p.id)}`),
    ...merch.map(m => `/merch/${encodeURIComponent(m.id)}`),
    ...collectTags(articles, series).flatMap(t => listingPaths(createPreviews(articles, series, t.label).length, t.path)),
  ])].sort()
}

export function renderSitemap(paths) {
  // URL values occupy XML text nodes: entity-encode them, do not sanitize as HTML.
  const escape = value => value.replace(/[<>&"']/g, c => ({'<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;'}[c]))
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map(path => `  <url><loc>${escape(absoluteUrl(path))}</loc></url>`).join('\n') + '\n</urlset>'
}
