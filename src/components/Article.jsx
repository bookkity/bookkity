import NextLink from "next/link"
import Layout from "@/components/Layout"
import {contentImage} from "@/helpers/seo"
import Seo from "@/components/Seo"
import {MDXRemote} from "next-mdx-remote"
import MDX from "@/components/mdx/MdxComponents"

export default function Article({ article, authorRecords }) {
  const description = article.description || `Read "${article.title}" on Bookkity.`
  const imageUrl = contentImage('article', article.image)

  return (
    <>
      <Seo page={{kind: 'post', title: article.title, description, path: `/articles/${article.url}`, image: imageUrl, language: article.language, date: article.date, authors: authorRecords, tags: article.tags, noindex: article.url.startsWith('_')}} />
      <Layout>
        <p className={`text-sm text-gray-500 pt-12`}>
          <NextLink prefetch={false} href={`/articles`} className={`hover:underline hover:decoration-gray-400`}>
            Articles
          </NextLink>
          &nbsp;/&nbsp;
          <span className={`font-semibold`}>
            {article.title}
          </span>
        </p>
        <h1 className={`pt-10 pb-0 font-semibold text-3xl`}>
          {article.title}
        </h1>
        <span className={'text-xs text-gray-500'}>

          by {article.authors.map((author, idx) => (
            <NextLink prefetch={false} key={`author-url-${author}`} href={`/${author}`}>
              {idx > 0 ? ',' : ''}&nbsp;<span className={`text-purple-700`}>{author}</span>
            </NextLink>
          ))} on {article.date}
        </span>
        <div className={'mdx pt-2'}>
          <MDXRemote components={MDX} {...article.content} />
        </div>
      </Layout>
    </>
  )
}
