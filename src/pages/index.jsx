import Layout from "@/components/Layout"
import {Input} from "@/components/shadcn/Input"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faSearch} from "@fortawesome/free-solid-svg-icons"
import {useEffect, useState} from "react"
import {getArticles} from "@/lib/mdx"
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

  const filteredArticles = articles
    .filter(article => selectedTag ? article.tags.includes(selectedTag) : true)
    .filter(article => search ? article.title.toLowerCase().includes(search.toLowerCase()) : true)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <>
      <Head>
        <title>Bookkity</title>
      </Head>
      <Layout>
        <div className={`px-4 pt-16`}>
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
        <div className={`flex text-lg pt-6`}>
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
        <div className={`pt-6 px-4`}>
          {filteredArticles.map((article, idx) => {
            return (
              <a href={`/article/${article.url}`} key={idx}>
                <div key={`article-${idx}`} className={`py-6 bg-white rounded-lg w-1/3 px-6 cursor-pointer hover:scale-[1.02] hover:duration-200`}>
                  <p className={`text-xs font-semibold text-gray-400`}>{article.date}</p>
                  <h2 className={`text-2xl font-semibold pt-1`}>{article.title}</h2>
                  <p className={`text-gray-500`}>{article.description}</p>
                </div>
              </a>
            )
          })}
        </div>
      </Layout>
    </>
  )
}
