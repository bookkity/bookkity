import path from 'path'
import matter from 'gray-matter'
import {readDirectory, readSpecificFile} from "@/helpers/fs"
import {serializeMdx} from "@/helpers/mdx"

const articlesPath = path.join(process.cwd(), "articles")

/**
 * @typedef {Object} Article
 * @property {String} url
 * @property {String} date
 * @property {String} author
 * @property {String} language
 * @property {String} title
 * @property {Array<String>} tags
 * @property {JSX.Element} content
 */

/**
 * @returns {Promise<Array<Article>>}
 */
export async function getArticles() {
  const articles = await readDirectory(articlesPath)
  return Promise.all(articles.map(async file => readArticleMdx(path.join(articlesPath, file))))
}

/**
 * @returns {Promise<Article>}
 */
async function readArticleMdx(file) {
  const content = await readSpecificFile(file)
  const { content: raw, data: metadata } = matter(content)
  const serializedContent = await serializeMdx(raw)

  return {
    content: serializedContent,
    ...metadata
  }
}

