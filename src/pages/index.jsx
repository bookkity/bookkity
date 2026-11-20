import PostListing from "@/components/PostListing"
import {getArticles} from "@/helpers/articles"
import {getSeries} from "@/helpers/series"
import {collectTags} from "@/helpers/tags"
import generateRssFeed from "@/helpers/rss"

export async function getStaticProps() {
  const allArticles = await getArticles()
  const allSeries = await getSeries()
  generateRssFeed(allArticles, allSeries)

  return {
    props: {
      allArticles,
      allSeries,
      tags: collectTags(allArticles, allSeries)
    }
  }
}

export default PostListing
