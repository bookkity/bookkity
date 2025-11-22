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
  const title = `${selectedChapter.title} - ${series.details.title} | Bookkity`
  const description = series.details.description || `Read "${selectedChapter.title}" from the "${series.details.title}" series on Bookkity - A community blog about programming, software development, and technology.`
  const url = `https://bookkity.com/series/${series.details.url}/${selectedChapter.order}`
  const imageUrl = series.details.image ? `https://bookkity.com/series${series.details.image}` : 'https://bookkity.com/images/boo.png'
  const authorNames = series.details.authors?.join(', ') || 'Bookkity Team'

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={selectedChapter.title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={`Cover image for ${selectedChapter.title}`} />
        <meta property="og:site_name" content="Bookkity" />
        <meta property="og:locale" content={series.details.language === 'en' ? 'en_US' : 'en_US'} />

        {/* Article specific OG tags */}
        {selectedChapter.date && <meta property="article:published_time" content={new Date(selectedChapter.date).toISOString()} />}
        {series.details.authors?.map(author => (
          <meta key={`og-author-${author}`} property="article:author" content={author} />
        ))}
        {series.details.tags?.map(tag => (
          <meta key={`og-tag-${tag}`} property="article:tag" content={tag} />
        ))}
        <meta property="article:section" content={series.details.title} />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={selectedChapter.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={`Cover image for ${selectedChapter.title}`} />

        {/* Additional SEO Meta Tags */}
        <meta name="author" content={authorNames} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
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
          <div className={`flex flex-col md:pl-8 pt-4 md:pt-8 md:w-4/5 h-full`}>
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
