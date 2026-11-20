import {getArticles} from '@/helpers/articles'
import {getAuthors} from '@/helpers/authors'
import {getSeries} from '@/helpers/series'
import {getProjects} from '@/helpers/projects'
import {getMerchItems} from '@/helpers/merch'
import {sitemapPaths, renderSitemap} from '@/helpers/sitemap'

// A static pathname with a raw XML response. Shared HTTP caches provide the TTL;
// getStaticProps would produce HTML, and next start alone is not an edge cache.
export async function getServerSideProps({res}) {
  const [articles, authors, series, projects, merch] = await Promise.all([
    getArticles(), getAuthors(), getSeries(), getProjects(), getMerchItems(),
  ])
  const xml = renderSitemap(sitemapPaths({articles, authors, series, projects, merch}))
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=43200, stale-while-revalidate=60')
  res.end(xml)
  return {props: {}}
}

export default function Sitemap() { return null }
