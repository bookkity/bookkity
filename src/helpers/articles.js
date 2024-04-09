import path from 'path'
import matter from 'gray-matter'
import {readDirectory, readSpecificFile} from "@/helpers/fs"
import {serializeMdx} from "@/helpers/mdx"

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

