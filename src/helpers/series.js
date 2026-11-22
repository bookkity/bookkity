import path from 'path'
import matter from 'gray-matter'
import {readDirectory, readSpecificFile} from "@/helpers/fs"
import {serializeMdx} from "@/helpers/mdx"

const seriesPath = path.join(process.cwd(), "series")

/**
 * @typedef {Object} Series
 * @property {SeriesDetails} details
 * @property {Array<ChapterDetails>} chapters
 */

/**
 * @typedef {Object} SeriesDetails
 * @property {string} path
 * @property {string} url
 * @property {string} title
 * @property {string} description
 * @property {string[]} authors
 * @property {string} language
 * @property {string} image
 * @property {string[]} tags
 */

/**
 * @typedef {Object} ChapterDetails
 * @property {number} order
 * @property {string} shortTitle
 * @property {string} title
 * @property {string} date
 * @property {string} [image]
 * @property {boolean} listed
 * @property {boolean} published
 */

/**
 * @returns {Promise<Array<Series>>}
 */
export async function getSeries() {
  const seriesList = await readDirectory(seriesPath)

  const series = seriesList.map(async series => {
    const seriesDetails = matter(await readSpecificFile(path.join(seriesPath, series, '.mdx'))).data
    const chapters = (await readDirectory(path.join(seriesPath, series))).filter(file => file !== '.mdx')

    return {
      details: {
        path: series,
        ...seriesDetails
      },
      chapters: await Promise.all(chapters.map(async file =>
        matter(await readSpecificFile(path.join(seriesPath, series, file))).data))
    }
  })

  return Promise.all(series)
}

/** Load the selected body separately so chapter lists carry metadata only. */
export async function getChapter(seriesDirectory, order) {
  const directory = path.join(seriesPath, seriesDirectory)
  const files = (await readDirectory(directory)).filter(file => file !== '.mdx')
  for (const file of files) {
    const {content, data} = matter(await readSpecificFile(path.join(directory, file)))
    if (data.order === order) {
      return {...data, content: await serializeMdx(content, path.join(directory, file))}
    }
  }
  return null
}

