import Layout from "@/components/Layout"
import {Input} from "@/components/ui/input"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faSearch} from "@fortawesome/free-solid-svg-icons"
import {useMemo, useState} from "react"
import {getArticles} from "@/helpers/articles"
import Head from "next/head"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Toggle} from "@/components/ui/toggle"

const tags = [
  { name: 'All', tag: '' },
  { name: 'JVM', tag: 'jvm' },
  { name: 'Java', tag: 'java' },
  { name: 'Kotlin', tag: 'kotlin' },
  { name: 'DevOps', tag: 'devops' },
  { name: 'Hardware', tag: 'hardware' },
]

export async function getStaticProps() {
  const articles = await getArticles()

  return {
    props: {
      articles
    }
  }
}

export default function Home({ articles }) {
  const [selectedTag, setSelectedTag] = useState('')
  const [search, setSearch] = useState('')
  const [languages, setLanguages] = useState({ value: ['pl', 'en'] })

  const filteredArticles = useMemo(() => {
    return articles
      .filter(article => languages.value.includes(article.language))
      .filter(article => selectedTag ? article.tags.includes(selectedTag) : true)
      .filter(article => search ? article.title.toLowerCase().includes(search.toLowerCase()) : true)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [articles, languages, selectedTag, search])

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
        <div className={`md:px-4 pt-8 md:pt-16`}>
          <div className={`flex items-center bg-white rounded-lg text-gray-500`}>
            <div className={`px-5 pt-1`}>
              <FontAwesomeIcon icon={faSearch} size="lg" />
            </div>
            <Input
              className={`w-full bg-white border-none shadow-none h-14 rounded-lg text-xl focus-visible:outline-none focus-visible:ring-0 placeholder:focus-visible:text-white`}
              placeholder={`Search articles`}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className={`flex max-w-full flex-wrap justify-center sm:justify-start text-lg pt-6 md:px-0`}>
          <div className={'px-4 pt-0.5'}>
            <Toggle
              onClick={() => toggleLanguage('pl')}
              className={`mr-2 ${languages.value.includes('pl') ? 'bg-white' : 'bg-gray-100'}`}
            >
              🇵🇱
            </Toggle>
            <Toggle
              onClick={() => toggleLanguage('en')}
              className={(languages.value.includes('en')) ? 'bg-white' : 'bg-gray-100'}
            >
              🌎
            </Toggle>
          </div>
          {tags.map((tag) => (
            <div key={tag.name} className={`p-2 px-6 font-semibold ${tag.tag === selectedTag ? 'text-purple-800' : ''}`}>
              <a href={`#${tag.tag}`} onClick={() => setSelectedTag(tag.tag)}>{tag.name}</a>
            </div>
          ))}
        </div>
        {search && (
          <>
            <div className={`pt-6 px-4`}>
              <p className={`text-gray-500`}>
                {filteredArticles.length} results for <span className={`italic font-semibold`}>"{search}"</span>
              </p>
            </div>
          </>
        )}
        <div className={`pt-6 px-4 flex flex-col sm:flex-row gap-4`}>
          {!search && filteredArticles.length === 0 && (
            <p className={`text-gray-500 text-sm text-center sm:text-left`}>
              No articles found in this category <span className={`italic font-semibold`}>(yet!)</span>
            </p>
          )}
          {filteredArticles.map((article, idx) => {
            return (
              <div className={`w-full sm:w-1/2 md:w-1/3`} key={idx}>
                <div key={`article-${idx}`} className={`bg-white rounded-lg cursor-pointer hover:scale-[1.02] hover:duration-200`}>
                  <a href={`/article/${article.url}`} >
                    <img
                      src={`/article/${article.image}`}
                      alt={article.title}
                      className={`rounded-t-2xl w-full h-56 object-cover`}
                    />
                  </a>
                  <div className={`flex items-center py-2`}>
                    <div className={`px-3 py-3`}>
                      <a href={`/${article.author}`}>
                        <img
                          src={`/author/${article.author}.jpg`}
                          alt={'Bookkity'}
                          className={`rounded-full h-12 w-12 min-w-12`}
                        />
                      </a>
                    </div>
                    <div className={`flex flex-col justify-center`}>
                      <a href={`/article/${article.url}`}>
                        <h2 className={`text-lg font-semibold leading-5`}>{article.title}</h2>
                      </a>
                      <p className={`text-xs text-gray-400 pt-1`}>
                        {article.date} by
                        <a href={`/${article.author}`}>
                          &nbsp;<span className={`text-gray-700`}>{article.author}</span>
                        </a>
                      </p>
                    </div>
                  </div>
                  <p className={`text-gray-500`}>{article.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Layout>
    </>
  )
}
