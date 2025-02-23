import Head from "next/head";
import Layout from "@/components/Layout";
import {getSeries} from "@/helpers/series";
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
  const chapter = series.chapters.find(it => it.order === parseInt(chapterIdx))

  return {
    props: {
      series,
      chapter
    }
  }
}

export default function ChapterIdx({series, chapter: selectedChapter}) {
  return (
    <>
      <Head>
        <title>Bookkity - Series</title>
      </Head>
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
                    <a
                      href={`/series/${series.details.url}/${chapter.order}`}
                      className={`hover:underline hover:text-gray-500 ${chapter.order === selectedChapter.order ? 'font-semibold text-purple-800' : ''}`}
                    >
                      {idx + 1}.&nbsp;
                      {chapter.published !== true && (
                        <span className={`mr-1 text-gray-400 text-xs`}>[UNPUBLISHED]</span>
                      )}
                      {chapter.title}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <div className={`flex flex-col md:pl-8 pt-4 md:pt-8 w-full h-full`}>
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
                <span>
                  {idx > 0 && ', '}
                  <a key={idx} className={`text-purple-500`} href={`/${author}`}>
                    {author}
                  </a>
                </span>
            ))}
              <span> on {selectedChapter.date}</span>
            </span>
            <div className={`mdx pt-4`}>
              <MDXRemote components={MDX} {...selectedChapter.content} />
            </div>
            <div className={`flex w-full pt-4 justify-between`}>
              {selectedChapter.order > 1 && (
                <div className={`w-full flex`}>
                  <a
                    href={`/series/${series.details.url}/${selectedChapter.order - 1}`}
                    className={`bg-white text-purple-900 rounded px-4 py-2 font-semibold text-sm`}
                  >
                    &larr; Previous Chapter
                  </a>
                </div>
              )}
              {series.chapters.length > selectedChapter.order && (
                <div className={`w-full flex`}>
                  <a
                    href={`/series/${series.details.url}/${selectedChapter.order + 1}`}
                    className={`bg-white text-purple-900 rounded px-4 py-2 font-semibold text-sm`}
                  >
                    Next Chapter &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
