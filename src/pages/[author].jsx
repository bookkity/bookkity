import {getArticles} from "@/helpers/articles"
import Layout from "@/components/Layout"
import Head from "next/head"
import {getAuthor, getAuthors} from "@/helpers/authors"
import {getSeries} from "@/helpers/series";

export async function getStaticProps({ params: { author } }) {
  const articles = await getArticles()
  const allSeries = await getSeries()
  const authorInfo = await getAuthor(author)

  return {
    props: {
      author: {
        ...authorInfo,
        name: author,
      },
      series:
        allSeries
            .filter(series => series.details.authors.includes(author))
            .map(series => ({
              ...series.details,
              chapters: series.chapters
                  .filter(chapter => chapter.published)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
            })),
      articles:
          articles
              .filter(article => article.author === author)
              .sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  }
}

export async function getStaticPaths() {
  const authors = await getAuthors()

  return ({
    paths: authors.map(author => ({
      params: {
        author: author.name
      }
    })),
    fallback: false
  })
}


export default function Author({ author, series, articles }) {
  const title = `Bookkity - ${author.name}`

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Layout>
        <p className={`text-sm text-gray-500 pt-12 px-1`}>
          <a href={`/about`} className={`hover:underline hover:decoration-gray-400`}>
            Authors
          </a>
          &nbsp;/&nbsp;
          <span className={`font-semibold`}>
              {author.name}
            </span>
        </p>
        <div className={'flex flex-col md:flex-row items-center md:justify-start px-1'}>
          <div className={'flex flex-col justify-center items-center md:items-start pt-6 md:pt-12 w-full md:max-w-64'}>
            <img src={`/author/${author.avatar}`} alt={author.name} className={`rounded-full w-64`}/>
            <h1 className={`pt-10 pb-3 font-semibold text-3xl`}>
              {author.name}
            </h1>
            <p className={'text-sm'}>{author.description}</p>
          </div>
          <div className={`flex flex-col w-full`}>
            <div className={`flex flex-col w-full md:pl-12 pt-6 md:pt-12`}>
              <div>
                <h1 className={`text-xl font-bold`}>
                  Series
                </h1>
              </div>
              <div className={`flex flex-col pt-3 pb-6`}>
                {series && series.map((series, idx) => {
                  return (
                    <a key={idx} href={`/series/${series.url}/1`} className={'mb-2'}>
                      <div className={`flex flex-col justify-center w-full bg-white rounded-lg px-2 py-3`}>
                        <h2 className={`text-xl font px-4 py-1`}>{series.title}</h2>
                        {series.chapters.map((chapter, idx) => (
                          <p key={idx} className={`text-sm text-gray-400 pl-4 pr-2`}>
                            {chapter.published !== true && (
                              <span className={`mr-1 text-gray-400 text-xs`}>[UNPUBLISHED]</span>
                            )}
                            {idx + 1}.&nbsp;
                            {chapter.title}
                          </p>
                        ))}
                        {/*<p className={`text-xs text-gray-400`}>*/}
                        {/*  {article.date} by <span className={`text-gray-700`}>{article.author}</span>*/}
                        {/*</p>*/}
                      </div>
                    </a>
                  )
                })}
                {series.length === 0 && (
                  <p className={`text-gray-500 text-sm`}>
                    No series found for this author <span className={`italic font-semibold`}>(yet!)</span>
                  </p>
                )}
              </div>
            </div>
            <div className={`flex flex-col w-full md:pl-12 pt-0`}>
              <div>
                <h1 className={`text-xl font-bold`}>
                  Articles
                </h1>
              </div>
              <div className={`flex flex-col pt-3 pb-6`}>
                {articles && articles.map((article, idx) => {
                  return (
                    <a key={idx} href={`/article/${article.url}`} className={'mb-2'}>
                      <div className={`flex items-center w-full bg-white max-h-16 rounded-lg`}>
                        <p
                          className={`text-sm pl-4 pr-4 border-r-gray-100 border-r-2`}>{article.date}</p>
                        <h2 className={`text-md font px-4 py-1`}>{article.title}</h2>
                        {/*<p className={`text-xs text-gray-400`}>*/}
                        {/*  {article.date} by <span className={`text-gray-700`}>{article.author}</span>*/}
                        {/*</p>*/}
                        <div className={'mdx'}>
                          {/*<MDXRemote components={MDX} {...article.content} />*/}
                        </div>
                      </div>
                    </a>
                  )
                })}
                {articles.length === 0 && (
                  <p className={`text-gray-500 text-sm`}>
                    No articles found for this author <span className={`italic font-semibold`}>(yet!)</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
