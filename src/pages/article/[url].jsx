import Layout from "@/components/Layout"
import {getArticles} from "@/lib/mdx"
import Head from "next/head"
import {MDXRemote} from "next-mdx-remote"
import MDX from "@/components/mdx/MDX"

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
        <h1 className={`pt-10 pb-3 font-semibold text-3xl`}>{article.title}</h1>
        <div className={'mdx'}>
          <MDXRemote components={MDX} {...article.content} />
        </div>

      </Layout>
    </>
  )
}
