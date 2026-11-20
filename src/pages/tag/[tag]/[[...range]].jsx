import PostListing from '@/components/PostListing'
import {getArticles} from '@/helpers/articles'
import {getSeries} from '@/helpers/series'
import {collectTags} from '@/helpers/tags'
import {createPreviews, listingPaths} from '@/helpers/listing'
import {getListingProps} from '@/helpers/listing-props'

export async function getStaticPaths() {
  const articles = await getArticles(), series = await getSeries()
  const paths = collectTags(articles, series).flatMap(tag => {
    const pages = listingPaths(createPreviews(articles, series, tag.label).length, tag.path)
    return [[], ...pages.slice(1).map(p => [p.split('/').at(-1)])]
      .map(range => ({params: {tag: tag.slug, range}}))
  })
  return {paths, fallback: false}
}

export async function getStaticProps({params}) {
  if (params.range?.length > 1) return {notFound: true}
  return getListingProps(params.tag, params.range?.[0])
}
export default PostListing
