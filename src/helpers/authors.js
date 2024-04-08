import {readDirectory, readSpecificFile} from "@/helpers/fs"
import path from "path"

const authorsPath = path.join(process.cwd(), "authors")

export async function getAuthors() {
  const authors = await readDirectory(authorsPath)
  return Promise.all(authors.map(async file => getAuthor(file)))
}

export async function getAuthor(author) {
  const file = path.join(authorsPath, `${author}.json`)
  const content = await readSpecificFile(file)

  return JSON.parse(content.toString())
}
