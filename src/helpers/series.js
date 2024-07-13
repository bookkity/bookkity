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
 * @property {string} url
 * @property {string} title
 * @property {string} description
 * @property {string} authors
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
      chapters: await Promise.all(chapters.map(async it => await readMdx(path.join(seriesPath, series, it))))
    }
  })

  return Promise.all(series)
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

