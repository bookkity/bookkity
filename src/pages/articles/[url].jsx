import Article from '@/components/Article'
import PostListing from '@/components/PostListing'
import {getArticles} from '@/helpers/articles'
import {getAuthors} from '@/helpers/authors'
import {getSeries} from '@/helpers/series'
import {createPreviews, listingPaths} from '@/helpers/listing'
import {getListingProps} from '@/helpers/listing-props'

export async function getStaticPaths() {
  const articles = await getArticles()
  if (articles.some(a => /^\d+-\d+$/.test(a.url))) throw new Error('Numeric range article slugs are reserved for pagination')
  const pages = listingPaths(createPreviews(articles, await getSeries()).length, '/articles')
  const segments = [...articles.map(a => a.url), ...pages.slice(1).map(p => p.split('/').at(-1))]
  return {paths: segments.map(url => ({params: {url}})), fallback: false}
}

export async function getStaticProps({params: {url}}) {
  if (/^\d+-\d+$/.test(url)) return getListingProps(undefined, url)
  const article = (await getArticles()).find(a => a.url === url)
  if (!article) return {notFound: true}
  const authorRecords = (await getAuthors()).filter(a => article.authors.includes(a.name))
  return {props: {article, authorRecords}}
}

export default function ArticleOrListing(props) {
  return props.article ? <Article {...props} /> : <PostListing {...props} />
}
