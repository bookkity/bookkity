import Layout from "@/components/Layout"
import {Input} from "@/components/shadcn/Input"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faSearch} from "@fortawesome/free-solid-svg-icons"
import {useEffect, useMemo, useState} from "react"
import {getArticles} from "@/helpers/articles"
import Head from "next/head"

const tags = [
  { name: 'All', tag: '' },
  { name: 'JVM', tag: 'jvm' },
  { name: 'Java', tag: 'java' },
  { name: 'Kotlin', tag: 'kotlin' },
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

  const filteredArticles = useMemo(() => {
    return articles
      .filter(article => selectedTag ? article.tags.includes(selectedTag) : true)
      .filter(article => search ? article.title.toLowerCase().includes(search.toLowerCase()) : true)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [articles, selectedTag, search])

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
        <div className={`flex text-lg pt-6 md:px-0`}>
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
        <div className={`pt-6 px-4 flex gap-4`}>
          {!search && filteredArticles.length === 0 && (
            <p className={`text-gray-500 text-sm`}>
              No articles found in this category <span className={`italic font-semibold`}>(yet!)</span>
            </p>
          )}
          {filteredArticles.map((article, idx) => {
            return (
              <div className={`md:w-1/3`} key={idx}>
                <a href={`/article/${article.url}`} >
                  <div key={`article-${idx}`} className={`bg-white rounded-lg cursor-pointer hover:scale-[1.02] hover:duration-200`}>
                    <img src={`/article/${article.image}`} alt={article.title} className={`rounded-t-2xl w-full h-32 object-cover`} />
                    <div className={`flex items-center`}>
                      <div className={`px-3 py-3`}>
                        <img src={`/author/${article.author}.jpg`} alt={'Bookkity'} className={`rounded-full h-12 w-12`}/>
                      </div>
                      <div className={`flex flex-col justify-center`}>
                        <h2 className={`text-xl font-semibold`}>{article.title}</h2>
                        <p className={`text-xs text-gray-400`}>
                          {article.date} by <span className={`text-gray-700`}>{article.author}</span>
                        </p>
                      </div>
                    </div>
                    <p className={`text-gray-500`}>{article.description}</p>
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      </Layout>
    </>
  )
}
