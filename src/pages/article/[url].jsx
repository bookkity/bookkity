import Layout from "@/components/Layout"
import {getArticles} from "@/helpers/articles"
import Head from "next/head"
import {MDXRemote} from "next-mdx-remote"
import MDX from "@/components/mdx/MdxComponents"

export async function getStaticProps({ params: { url } }) {
  const articles = await getArticles()

  return {
    props: {
      article: articles.find(article => article.url === url)
    }
  }
}

export async function getStaticPaths() {
  const articles = await getArticles()

  return ({
    paths: articles.map(article => ({
      params: {
        url: article.url
      }
    })),
    fallback: false
  })
}


export default function Article({ article }) {
  const title = `Bookkity` + (article ? ` - ${article.title}` : '')

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Layout>
        <p className={`text-sm text-gray-500 pt-12`}>
          <a href={`/`} className={`hover:underline hover:decoration-gray-400`}>
            Articles
          </a>
          &nbsp;/&nbsp;
          <span className={`font-semibold`}>
            {article.title}
          </span>
        </p>
        <h1 className={`pt-10 pb-0 font-semibold text-3xl`}>
          {article.title}
        </h1>
        <span className={'text-xs text-gray-500'}>
          {/*by <a className={`text-purple-500`} href={`/${article.author}`}>{article.author}</a> on {article.date}*/}
          by {article.authors.map((author, idx) => (
            <a key={`author-url-${author}`} href={`/${author}`}>
              {idx > 0 ? ',' : ''}&nbsp;<span className={`text-purple-700`}>{author}</span>
            </a>
          ))} on {article.date}
        </span>
        <div className={'mdx pt-2'}>
          <MDXRemote components={MDX} {...article.content} />
        </div>
      </Layout>
    </>
  )
}
