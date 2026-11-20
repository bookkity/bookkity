import {getAuthors} from "@/helpers/authors"
import PostListing from '@/components/PostListing'
import {getArticles} from '@/helpers/articles'
import {getSeries} from '@/helpers/series'
import {collectTags} from '@/helpers/tags'

export async function getStaticPaths() {
  const tags = collectTags(await getArticles(), await getSeries())
  return { paths: tags.map(tag => ({ params: { tag: tag.slug } })), fallback: false }
}

export async function getStaticProps({params}) {
  const allArticles = await getArticles()
  const allSeries = await getSeries()
  const tags = collectTags(allArticles, allSeries)
  const tag = tags.find(tag => tag.slug === params.tag)
  if (!tag) return { notFound: true }
  return { props: { authors: await getAuthors(), allArticles: allArticles.filter(a => !a.url.startsWith('_') && a.tags.includes(tag.label)),
    allSeries: allSeries.filter(s => s.details.tags.includes(tag.label)), tags, selectedTag: tag.label } }
}

export default PostListing
