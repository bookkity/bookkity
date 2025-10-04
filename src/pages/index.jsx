import Layout from "@/components/Layout"
import {Input} from "@/components/ui/input"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faSearch} from "@fortawesome/free-solid-svg-icons"
import {useMemo, useState} from "react"
import {getArticles} from "@/helpers/articles"
import Head from "next/head"
import {Toggle} from "@/components/ui/toggle"
import generateRssFeed from "@/helpers/rss";
import {RssIcon} from "lucide-react";
import {getSeries} from "@/helpers/series";

const tags = [
  { name: 'All', tag: '' },
  { name: 'JVM', tag: 'jvm' },
  { name: 'Java', tag: 'java' },
  { name: 'Kotlin', tag: 'kotlin' },
  { name: 'Rust', tag: 'rust' },
  { name: 'DevOps', tag: 'devops' },
  { name: 'Hardware', tag: 'hardware' },
]

export async function getStaticProps() {
  const allArticles = await getArticles()
  const allSeries = await getSeries()
  generateRssFeed(allArticles)

  return {
    props: {
      allArticles,
      allSeries
    }
  }
}

/**
 * @typedef {Object} Preview
 * @property {'article' | 'chapter'} type
 * @property {string} title
 * @property {Array<string>} tags
 * @property {Array<string>} authors
 * @property {string} language
 * @property {string} image
 * @property {string} url
 * @property {Date} date
 * @property {Article | { chapter: ChapterDetails, series: SeriesDetails }} data
 */

/**
 * @param article {Article}
 * @param search {string}
 * @returns {boolean}
 */
const satisfiesSearch = (article, search) => {
  search = search.toLowerCase()
  if (article.title.toLowerCase().includes(search)) return true
  if (article.tags.some(it => it.toLowerCase().includes(search))) return true
  return false
}

/**
 * @param allArticles {Array<Article>}
 * @param allSeries {Array<Series>}
 */
export default function Home({ allArticles, allSeries }) {
  const [selectedTag, setSelectedTag] = useState('')
  const [search, setSearch] = useState('')
  const [languages, setLanguages] = useState({ value: ['pl', 'en'] })
  const [showSeries, setShowSeries] = useState(true)

  /** @type {Array<Preview>} */
  const articlePreviews = allArticles.map(article => {
    return {
      type: 'article',
      title: article.title,
      tags: article.tags,
      authors: Array.of(article.author),
      language: article.language,
      image: `/article/${article.image}`,
      url: `/article/${article.url}`,
      date: new Date(article.date),
      data: article
    }
  })

  /** @type {Array<Preview>} */
  const chapterPreviews = allSeries.flatMap(series => {
    return series.chapters
      .filter(chapter => chapter.published && chapter.listed)
      .map(chapter => {
        return {
          type: 'chapter',
          title: `${series.details.title}: ${chapter.shortTitle}`,
          tags: series.details.tags,
          authors: series.details.authors,
          language: series.details.language,
          image: chapter.image ? `/series/${chapter.image}` : `/series/${series.details.image}`,
          url: `/series/${series.details.url}/${chapter.order}`,
          date: new Date(chapter.date),
          data: {
            chapter: chapter,
            series: series.details
          }
        }
      })
  })

  const previews = articlePreviews.concat(chapterPreviews)

  const filteredPreviews = useMemo(() => {
    return previews
      .filter(it => !it.url.startsWith("/article/_"))
      .filter(it => showSeries ? true : it.type === 'article')
      .filter(it => languages.value.includes(it.language))
      .filter(it => selectedTag ? it.tags.includes(selectedTag) : true)
      .filter(it => search ? satisfiesSearch(it, search) : true)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [previews, languages, selectedTag, search])

  const toggleLanguage = (lang) => {
    let updated = languages.value.includes(lang)
      ? languages.value.filter(l => l !== lang)
      : [...languages.value, lang]

    setLanguages({ value: [...updated] })
  }

  return (
    <>
      <Head>
        <title>Bookkity</title>
      </Head>
      <Layout>
        <div className={`md:px-4 pt-6 md:pt-16`}>
          <div className={`flex items-center bg-white rounded-lg text-gray-500`}>
            <div className={`pl-4`}>
              <div className={`h-5 w-5`}>
                <FontAwesomeIcon icon={faSearch}/>
              </div>
            </div>
            <Input
              className={`w-full bg-white border-none shadow-none h-14 rounded-lg text-xl focus-visible:outline-none focus-visible:ring-0 placeholder:focus-visible:text-white`}
              placeholder={`Browse articles & series`}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className={`pr-4 text-purple-400`}>
              <a title={"RSS"} href={'/rss.xml'}>
                <RssIcon />
              </a>
            </div>
          </div>
        </div>
        <div className={
          `flex flex-nowrap flex-col md:flex-row 
          max-w-full justify-center sm:justify-start
           text-lg pt-6 md:px-0`
        }>
          <div className={'px-4 pt-0.5 min-w-44'}>
            <div className={`flex justify-center gap-2`}>
              <Toggle
                onClick={() => toggleLanguage('pl')}
                className={`${languages.value.includes('pl') ? 'bg-white' : 'bg-gray-100'}`}
                title={"Show articles in Polish"}
              >
                🇵🇱
              </Toggle>
              <Toggle
                onClick={() => toggleLanguage('en')}
                className={(languages.value.includes('en')) ? 'bg-white' : 'bg-gray-100'}
                title={"Show articles in English"}
              >
                🌎
              </Toggle>
              <Toggle
                onClick={() => setShowSeries(!showSeries)}
                className={(showSeries) ? 'bg-white px-3.5 font-bold' : 'bg-gray-100 px-3.5 font-bold'}
                title={"Show new chapters in series or display only articles"}
              >
                Series
              </Toggle>
            </div>
          </div>
          <div className={`flex flex-wrap pt-4 md:pt-0 justify-center md:justify-start`}>
            {tags.map((tag) => (
              <div key={tag.name} className={`p-2 px-6 font-semibold ${tag.tag === selectedTag ? 'text-purple-800' : ''}`}>
                <a href={`#${tag.tag}`} onClick={() => setSelectedTag(tag.tag)}>{tag.name}</a>
              </div>
            ))}
          </div>
        </div>
        {search && (
          <>
            <div className={`pt-6 px-4`}>
              <p className={`text-gray-500`}>
                {filteredPreviews.length} results for <span className={`italic font-semibold`}>"{search}"</span>
              </p>
            </div>
          </>
        )}
        <div className={`pt-5 px-4 flex flex-col sm:flex-row flex-wrap -mx-2`}>
          {!search && filteredPreviews.length === 0 && (
            <p className={`text-gray-500 text-sm text-center sm:text-left`}>
              No articles found in this category <span className={`italic font-semibold`}>(yet!)</span>
            </p>
          )}
          {filteredPreviews.map((article, idx) => {
            return (
              <div className={`w-full md:w-1/2 xl:w-1/3 px-2 py-2 h-[338px]`} key={idx}>
                <div
                  key={`article-${idx}`}
                  className={`flex flex-col h-full flex-1 bg-white rounded-lg cursor-pointer hover:scale-[1.02] hover:duration-200`}
                >
                  <div className={`relative bg-gray-100`}>
                    <div className={`absolute left-1 -bottom-2 py-0.5 px-4 bg-white text-xs rounded-t-md`}>
                      {article.type === 'article'
                        ? <p className={`text-purple-900 font-semibold`}>Article</p>
                        : <p className={`text-gray-600 font-semibold`}>Chapter</p>
                      }
                    </div>
                    <a href={article.url}>
                      <img
                        src={article.image}
                        alt={article.title}
                        className={`rounded-t-2xl w-full h-56 object-cover`}
                      />
                    </a>
                  </div>
                  <div className={`flex flex-1 items-center py-2`}>
                    <div className={`px-3 py-3`}>
                      {article.authors.map((author, idx) => (
                        <a key={`author-avatar-${author}`} href={`/${author}`}>
                        <img
                            src={`/author/${author}.jpg`}
                            alt={'Bookkity'}
                            className={`rounded-full h-12 w-12 min-w-12`}
                          />
                        </a>
                      ))}
                    </div>
                    <div className={`flex flex-col justify-center`}>
                      <a href={article.url}>
                        <h2 className={`text-md font-semibold leading-5 pr-1`}>
                          {article.title}
                        </h2>
                      </a>
                      <p className={`text-xs text-gray-400 pt-1`}>
                        {article.date.toLocaleDateString()} by
                        {article.authors.map((author, idx) => (
                          <a key={`author-url-${author}`} href={`/${author}`}>
                            &nbsp;<span className={`text-gray-700`}>{author}</span>
                          </a>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Layout>
    </>
  )
}
