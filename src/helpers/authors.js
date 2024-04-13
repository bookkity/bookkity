import {readDirectory, readSpecificFile} from "@/helpers/fs"
import path from "path"
import matter from "gray-matter"
import {serializeMdx} from "@/helpers/mdx"

const authorsPath = path.join(process.cwd(), "authors")

/**
 * @typedef {Object} Author
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} avatar
 * @property {string} content
 */

/**
 * @returns {Promise<Author[]>}
 */
export async function getAuthors() {
  const files = await readDirectory(authorsPath)
  const authors = await Promise.all(files.map(async file => getAuthor(file)))
  return authors.sort((a, b) => a.id > b.id ? 1 : -1)
}

/**
 * @returns {Promise<Author>}
 */
export async function getAuthor(author) {
  const file = path.join(authorsPath, author.endsWith('.md') ? author : `${author}.md`)
  const content = await readSpecificFile(file)
  const { content: raw, data: metadata } = matter(content)
  const serializedContent = await serializeMdx(raw)

  return {
    content: serializedContent,
    ...metadata
  }
}
