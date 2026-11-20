import {PAGE_SIZE} from "@/helpers/listing"
import {SITE_DESCRIPTION} from "@/helpers/seo"
import Layout from "@/components/Layout"
import SearchForm from "@/components/SearchForm"
import Link from "next/link"
import {useRouter} from "next/router"
import useSearch from "@/search/useSearch"
import {BROWSE_TOPICS, legacyTagDestination} from "@/helpers/tags"
import {useEffect, useMemo, useState} from "react"
import Seo from "@/components/Seo"
import {Toggle} from "@/components/ui/toggle"
import {RssIcon} from "lucide-react";

export default function PostListing({ previews, authors, tags, selectedTag = '', path, start, total, previous, next, searchMode = false }) {
  const router = useRouter()
  const query = searchMode && router.isReady && typeof router.query.q === 'string' ? router.query.q.trim().slice(0, 200) : ''
  const {status, results, retry} = useSearch(query)
  const searching = searchMode && Boolean(query)
  const visiblePreviews = searching ? results : previews
  useEffect(() => {
    if (path !== '/articles') return
    const migrateHash = () => {
      const destination = legacyTagDestination(window.location.hash, tags)
      if (destination) window.location.replace(destination + window.location.search)
    }
    migrateHash()
    window.addEventListener('hashchange', migrateHash)
    return () => window.removeEventListener('hashchange', migrateHash)
  }, [path, tags])

  const [languages, setLanguages] = useState({ value: ['pl', 'en'] })
  const [showSeries, setShowSeries] = useState(true)

  const filteredPreviews = useMemo(() => {
    return visiblePreviews
      .filter(it => showSeries ? true : it.type === 'article')
      .filter(it => languages.value.includes(it.language))
      .filter(it => !searching && selectedTag ? it.tags.includes(selectedTag) : true)
  }, [visiblePreviews, languages, selectedTag, showSeries, searching])

  const toggleLanguage = (lang) => {
    let updated = languages.value.includes(lang)
      ? languages.value.filter(l => l !== lang)
      : [...languages.value, lang]

    setLanguages({ value: [...updated] })
  }

  return (
    <>
      <Seo page={searchMode ? {kind: 'page', title: 'Search articles and tutorials', description: SITE_DESCRIPTION, path: '/search', noindex: true} : {kind: 'collection', noindex: Boolean(selectedTag && !total), title: `${selectedTag ? `${selectedTag} articles and tutorials` : 'Articles and tutorials'}${start ? ` - Page ${start / PAGE_SIZE + 1}` : ''}`, description: selectedTag ? `Explore ${selectedTag} articles and series chapters by the Bookkity community.` : SITE_DESCRIPTION, path, items: previews.map(p => ({title: p.title, path: p.url}))}} />
      <Layout>
        <h1 className="pt-8 text-3xl font-semibold">{selectedTag ? `${selectedTag} articles and tutorials` : "Articles and tutorials"}</h1>
        {selectedTag && <p className="pt-3 text-gray-600">Explore {selectedTag} articles and series chapters by the Bookkity community.</p>}
        {searching && <div role="status" aria-live="polite" className="pt-3 text-sm text-gray-600">
          {status === 'loading' && 'Searching…'}
          {status === 'ready' && (filteredPreviews.length ? `${filteredPreviews.length === 20 ? 'Top 20' : filteredPreviews.length} results for “${query}”.` : `No results for “${query}”.`)}
          {status === 'error' && <>Search couldn’t load. <button onClick={retry} className="underline">Try again</button> or reload this page.</>}
        </div>}
        {!searching && <p className="pt-3 text-sm text-gray-600">Showing {total ? start + 1 : 0}–{Math.min(start + previews.length, total)} of {total}. Filters apply to this page.</p>}
        <div className={`md:px-4 pt-6 md:pt-16`}>
          <div className={`flex items-center bg-white rounded-lg text-gray-500`}>
            <SearchForm query={query} />
            <div className={`pr-4 text-purple-400`}>
              <Link prefetch={false} title={"RSS"} href={'/rss.xml'}>
                <RssIcon />
              </Link>
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
          <div aria-label="Topics" className={`flex flex-wrap pt-4 md:pt-0 justify-center md:justify-start`}>
            {BROWSE_TOPICS.map((tag) => (
              <div key={tag.slug} className={`p-2 px-6 font-semibold ${tag.slug === selectedTag.toLowerCase() ? 'text-purple-800' : ''}`}>
                <Link prefetch={false} href={tag.path}>{tag.label}</Link>
              </div>
            ))}
          </div>
        </div>
        <div aria-label={searching ? 'Search results' : 'Articles'} className={`pt-5 px-4 flex flex-col sm:flex-row flex-wrap -mx-2`}>
          {!searching && filteredPreviews.length === 0 && (
            <p className={`text-gray-500 text-sm text-center sm:text-left`}>
              No articles found in this category <span className={`italic font-semibold`}>(yet!)</span>
            </p>
          )}
          {filteredPreviews.map((article, idx) => {
            return (
              <div className={`w-full md:w-1/2 xl:w-1/3 px-2 py-2 h-[338px]`} key={article.url} data-article-card={article.url}>
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
                    <Link href={article.url} prefetch={false}>
                      <img
                        src={article.image}
                        alt={article.title}
                        className={`rounded-t-2xl w-full h-56 object-cover`}
                      />
                    </Link>
                  </div>
                  <div className={`flex flex-1 items-center py-0`}>
                    <div className="flex -space-x-5 pl-3 pr-2 py-0">
                      {article.authors.map((author, idx) => (
                        <Link prefetch={false} key={`author-avatar-${author}`} href={`/${author}`} className="inline-block">
                          <img
                            src={`/author/${authors.find(a => a.name === author)?.avatar}`}
                            alt={author}
                            className="rounded-full h-12 w-12 min-w-12 border-2 border-white bg-white"
                          />
                        </Link>
                      ))}
                    </div>
                    <div className={`flex flex-col justify-center`}>
                      <Link href={article.url} prefetch={false}>
                        <h2 className={`text-md font-semibold leading-5 pr-1`}>
                          {article.title}
                        </h2>
                      </Link>
                      <p className={`text-xs text-gray-400 pt-1`}>
                        <time dateTime={article.date}>{new Date(article.date).toLocaleDateString('en-GB', {timeZone: 'UTC'})}</time> by
                        {article.authors.map((author, idx) => (
                          <Link prefetch={false} key={`author-url-${author}`} href={`/${author}`}>
                            {idx > 0 ? ',' : ''}&nbsp;<span className={`text-gray-700`}>{author}</span>
                          </Link>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {!searching && <nav aria-label="Pagination" className="flex justify-between gap-6 px-4 py-8">
          {previous && <Link prefetch={false} href={previous} rel="prev">← Previous</Link>}
          {next && <Link prefetch={false} href={next} rel="next">Next →</Link>}
        </nav>}
      </Layout>
    </>
  )
}
