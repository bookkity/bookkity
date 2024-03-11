import path from 'path'
import { readdir, readFile } from 'fs'
import { promisify } from 'util'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypePrism from '@mapbox/rehype-prism'
import matter from 'gray-matter'
import rehypeSlug from "rehype-slug"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

const readDirectory = promisify(readdir)
const readSpecificFile = promisify(readFile)

const articlesPath = path.join(process.cwd(), "articles")

export async function getArticles() {
  const articles = await readDirectory(articlesPath)
  return Promise.all(articles.map(async file => readMdx(path.join(articlesPath, file))))
}

export async function readMdx(file) {
  const content = await readSpecificFile(file)
  const { content: raw, data: metadata } = matter(content)
  const serializedContent = await serializeMdx(raw)

  return {
    content: serializedContent,
    ...metadata
  }
}

function serializeMdx(mdx) {
  return serialize(mdx, {
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
      ],
      rehypePlugins: [
        // rehypePrism,
        rehypeSlug,
        [rehypePrettyCode, { theme: "min-light"}],
        // rehypeAutolinkHeadings
      ]
    }
  })
}
