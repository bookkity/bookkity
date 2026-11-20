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
  const description = article?.description || `Read "${article?.title}" on Bookkity - A community blog about programming, software development, and technology.`
  const url = `https://bookkity.com/article/${article?.url}`
  const imageUrl = article?.image ? `https://bookkity.com/article${article.image}` : 'https://bookkity.com/images/boo.png'
  const authorNames = article?.authors?.join(', ') || 'Bookkity Team'

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={article?.title || title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={`Cover image for ${article?.title}`} />
        <meta property="og:site_name" content="Bookkity" />
        <meta property="og:locale" content={article?.language === 'en' ? 'en_US' : 'en_US'} />

        {/* Article specific OG tags */}
        {article?.date && <meta property="article:published_time" content={new Date(article.date).toISOString()} />}
        {article?.authors?.map(author => (
          <meta key={`og-author-${author}`} property="article:author" content={author} />
        ))}
        {article?.tags?.map(tag => (
          <meta key={`og-tag-${tag}`} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article?.title || title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={`Cover image for ${article?.title}`} />

        {/* Additional SEO Meta Tags */}
        <meta name="author" content={authorNames} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
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
