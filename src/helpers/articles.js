import path from 'path'
import matter from 'gray-matter'
import {readDirectory, readSpecificFile} from "@/helpers/fs"
import {serializeMdx} from "@/helpers/mdx"
import {getAuthor} from "@/helpers/authors";

const articlesPath = path.join(process.cwd(), "articles")

/**
 * @typedef {Object} Article
 * @property {String} url
 * @property {String} date
 * @property {Author} author
 * @property {String} language
 * @property {String} title
 * @property {String} image
 * @property {Array<String>} tags
 * @property {JSX.Element} content
 */

/**
 * @returns {Promise<Array<Article>>}
 */
export async function getArticles() {
  const articles = await readDirectory(articlesPath)
  return Promise.all(articles
      .map(async file => {
        return readArticleMdx(path.join(articlesPath, file))
            .then(async article => {
                article.author = await getAuthor(article.author);

                console.log(article.author.name)
                return article;
            });
      })
  )
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

