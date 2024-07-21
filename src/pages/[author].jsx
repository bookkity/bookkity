import {getArticles} from "@/helpers/articles"
import Layout from "@/components/Layout"
import Head from "next/head"
import {getAuthor, getAuthors} from "@/helpers/authors"

export async function getStaticProps({ params: { author } }) {
  const articles = await getArticles()
  const authorInfo = await getAuthor(author)

  return {
    props: {
      author: {
        ...authorInfo,
        name: author,
      },
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


export default function Author({ author, articles }) {
  const title = `Bookkity - ${author.displayname}`

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
              {author.displayname}
            </span>
        </p>
        <div className={'flex px-1'}>
          <div className={'flex flex-col pt-12 max-w-64'}>
            <img src={`/author/${author.avatar}`} alt={author.displayname} className={`rounded-full w-64`}/>
            <h1 className={`pt-10 pb-3 font-semibold text-3xl`}>
              {author.displayname}
            </h1>
            <p className={'text-sm'}>{author.description}</p>
          </div>
          <div className={`flex flex-col w-full pl-12 pt-12`}>
            <div>
              <h1 className={`text-xl font-bold`}>
                Articles
              </h1>
            </div>
            <div className={`flex flex-col pt-3 pb-6`}>
              {articles && articles.map((article, idx) => {
                return (
                  <a key={idx} href={`/article/${article.url}`} className={'mb-2'} >
                    <div className={`flex items-center w-full bg-white max-h-16 rounded-lg`}>
                      <p className={`text-sm pl-4 pr-4 border-r-gray-100 border-r-2`}>{article.date}</p>
                      <h2 className={`text-xl font px-4 py-1`}>{article.title}</h2>
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
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
