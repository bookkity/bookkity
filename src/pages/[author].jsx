import {getArticles} from "@/helpers/articles"
import Layout from "@/components/Layout"
import Head from "next/head"
import {getAuthor} from "@/helpers/authors"

export async function getStaticProps({ params: { author } }) {
  const articles = await getArticles()
  const authorInfo = await getAuthor(author)

  return {
    props: {
      author: {
        ...authorInfo,
        name: author,
      },
      articles: articles.filter(article => article.author === author)
    }
  }
}

export async function getStaticPaths() {
  const articles = await getArticles()

  return ({
    paths: articles.map(article => ({
      params: {
        author: article.author
      }
    })),
    fallback: false
  })
}


export default function Author({ author, articles }) {
  console.log(author)
  return (
    <>
      <Head>
        <title>Bookkity - {author.name}</title>
      </Head>
      <Layout>
        <p className={`text-sm text-gray-500 pt-12 px-1`}>
          <a href={`/`} className={`hover:underline hover:decoration-gray-400`}>
            Author
          </a>
          &nbsp;/&nbsp;
          <span className={`font-semibold`}>
              {author.name}
            </span>
        </p>
        <div className={'flex px-1'}>
          <div className={'flex flex-col pt-12 max-w-64'}>
            <img src={`/author/${author.name}.jpg`} alt={author.name} className={`rounded-full w-64`}/>
            <h1 className={`pt-10 pb-3 font-semibold text-3xl`}>{author.name}</h1>
            <p className={'text-sm'}>{author.description}</p>
          </div>
          <div className={`flex flex-col w-full pl-12 pt-12`}>
            <div>
              <h1 className={`text-xl font-bold`}>Articles</h1>
            </div>
            <div className={`flex flex-col py-6`}>
              {articles && articles.map((article, idx) => {
                return (
                  <a key={idx} href={`/article/${article.url}`} >
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
