import {getArticles} from '@/helpers/articles'
import {getSeries} from '@/helpers/series'
import {getAuthors} from '@/helpers/authors'
import {collectTags} from '@/helpers/tags'
import {createPreviews, listingPage} from '@/helpers/listing'
import generateRssFeed from '@/helpers/rss'

export async function getListingProps(tagSlug, range) {
  const [articles, series, authors] = await Promise.all([getArticles(), getSeries(), getAuthors()])
  const tags = collectTags(articles, series)
  const tag = tagSlug === undefined ? null : tags.find(t => t.slug === tagSlug)
  if (tagSlug !== undefined && !tag) return {notFound: true}
  const selectedTag = tag?.label || ''
  const page = listingPage(createPreviews(articles, series, selectedTag), tag?.path || '/articles', range)
  if (!page) return {notFound: true}
  if (!tag && range === undefined) await generateRssFeed(articles, series)
  return {props: {...page, selectedTag, tags, authors: authors.map(({name, avatar}) => ({name, avatar}))}}
}
