import {readDirectory, readSpecificFile} from "@/helpers/fs"
import path from "path"
import matter from "gray-matter"
import {serializeMdx} from "@/helpers/mdx"

const authorsPath = path.join(process.cwd(), "authors")

export async function getAuthors() {
  const authors = await readDirectory(authorsPath)
  return Promise.all(authors.map(async file => getAuthor(file)))
}

export async function getAuthor(author) {
  const file = path.join(authorsPath, `${author}.md`)
  const content = await readSpecificFile(file)
  const { content: raw, data: metadata } = matter(content)
  const serializedContent = await serializeMdx(raw)

  return {
    content: serializedContent,
    ...metadata
  }
}
