import {authorPath} from '@/helpers/author-path'
import NextLink from "next/link"
import Seo from "@/components/Seo";
import Layout from "@/components/Layout";
import {getAuthors} from "@/helpers/authors"
import {contentImage} from "@/helpers/seo"
import {getChapter, getSeries} from "@/helpers/series";
import {MDXRemote} from "next-mdx-remote";
import MDX from "@/components/mdx/MdxComponents";

export async function getStaticPaths() {
  const allSeries = await getSeries()

  return ({
    paths:
      allSeries
        .flatMap(series => {
          return series.chapters.map(chapter => ({series, chapter}))
        })
        .map(({series, chapter}) => {
          return {
            params: {
              seriesUrl: series.details.url,
              chapterIdx: chapter.order.toString()
            }
          }
        }),
    fallback: false
  })
}

export async function getStaticProps({params: {seriesUrl, chapterIdx}}) {
  const allSeries = await getSeries()
  const series = allSeries.find(it => it.details.url === seriesUrl)
  if (!series) return {notFound: true}
  const chapter = await getChapter(series.details.path, Number(chapterIdx))
  if (!chapter) return {notFound: true}

  return {
    props: {
      series,
      chapter,
      authorRecords: (await getAuthors()).filter(author => series.details.authors.includes(author.name))
    }
  }
}

export default function ChapterIdx({series, chapter: selectedChapter, authorRecords}) {
  const description = series.details.description || `Read "${selectedChapter.title}" on Bookkity.`
  const imageUrl = contentImage('series', selectedChapter.image || series.details.image)

  return (
    <>
      <Seo page={{kind: 'post', title: `${selectedChapter.title} - ${series.details.title}`, description, path: `/series/${series.details.url}/${selectedChapter.order}`, image: imageUrl, language: series.details.language, date: selectedChapter.date, authors: authorRecords, tags: series.details.tags, noindex: selectedChapter.published !== true}} />
      <Layout>
        <div className={`flex min-h-full flex-col md:flex-row`}>
          <div
            id={`chapter-border`}
            className={`
              flex flex-col md:max-w-80
              md:border-1 md:border-r md:b-1 md:b-r 
              text-sm md:pr-4
              pt-4 md:pt-8
              md:pb-32
              min-h-full`}
          >
            <h2 className={`pt-1 pb-4 font-bold text-gray-900`}>
              {series.details.title}
            </h2>
            {series.chapters.map((chapter, idx) => {
              return (
                <div key={idx} className={`flex pl-4 py-2 text-gray-700`}>
                  <div className={`flex`}>
                    <NextLink prefetch={false}
                      href={`/series/${series.details.url}/${chapter.order}`}
                      className={`hover:underline hover:text-gray-500 ${chapter.order === selectedChapter.order ? 'font-semibold text-purple-800' : ''}`}
                    >
                      {idx + 1}.&nbsp;
                      {chapter.published !== true && (
                        <span className={`mr-1 text-gray-400 text-xs`}>[UNPUBLISHED]</span>
                      )}
                      {chapter.title}
                    </NextLink>
                  </div>
                </div>
              )
            })}
          </div>
          <div className={`flex min-w-0 flex-col md:pl-8 pt-4 md:pt-8 md:w-4/5 h-full`}>
            {selectedChapter.published !== true && (
              <div className={`mr-2 mb-6 text-center text-purple-900 font-semibold text-xs py-1 px-4 bg-gray-300 rounded-3xl`}>
                This chapter is not published yet
              </div>
            )}
            <h1 className={`text-3xl font-bold`}>
                {selectedChapter.title}
            </h1>
            <span className={'text-xs text-gray-500 pt-2'}>
              by {series.details.authors.map((author, idx) => (
                <NextLink prefetch={false} key={idx} className={`text-purple-500`} href={authorPath(author)}>
                  {author}
                </NextLink>
              ))}
              <span> on {selectedChapter.date}</span>
            </span>
            <div className={`mdx pt-4`}>
              <MDXRemote components={MDX} {...selectedChapter.content} />
            </div>
            <div className={`flex w-full pt-4 justify-between`}>
              {selectedChapter.order > 1 && (
                <div className={`w-full flex`}>
                  <NextLink prefetch={false}
                    href={`/series/${series.details.url}/${selectedChapter.order - 1}`}
                    className={`bg-white text-purple-900 rounded px-4 py-2 font-semibold text-sm`}
                  >
                    &larr; Previous Chapter
                  </NextLink>
                </div>
              )}
              {series.chapters.length > selectedChapter.order && (
                <div className={`w-full flex`}>
                  <NextLink prefetch={false}
                    href={`/series/${series.details.url}/${selectedChapter.order + 1}`}
                    className={`bg-white text-purple-900 rounded px-4 py-2 font-semibold text-sm`}
                  >
                    Next Chapter &rarr;
                  </NextLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
