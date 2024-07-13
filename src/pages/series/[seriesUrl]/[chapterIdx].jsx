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
        <div className={`flex min-h-full`}>
          <div id={`chapter-border`} className={`flex flex-col max-w-80 b-1 b-r text-sm pr-4 border-1 border-r pt-8 pb-32 min-h-full`}>
            {series.chapters.map((chapter, idx) => {
              return (
                <div key={idx} className={`flex py-2 text-gray-700`}>
                  <div className={`flex`}>
                    <a
                      href={`/series/${series.details.url}/${chapter.order}`}
                      className={`hover:underline hover:text-gray-500 ${chapter.order === selectedChapter.order ? 'font-semibold' : ''}`}
                    >
                      {chapter.published !== true && (
                        <span className={`mr-1 text-gray-400`}>[DRAFT]</span>
                      )}
                      {chapter.title}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <div className={`flex flex-col pl-8 pt-8 w-full h-full`}>
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
                <a key={idx} className={`text-purple-500`} href={`/${author}`}>
                  {author}
                </a>
              ))}
              <span> on {selectedChapter.date}</span>
            </span>
            <div className={`pt-4`}>
              <MDXRemote components={MDX} {...selectedChapter.content} />
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
