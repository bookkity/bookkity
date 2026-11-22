import {PAGE_SIZE} from "@/helpers/listing"
import {SITE_DESCRIPTION} from "@/helpers/seo"
import Layout from "@/components/Layout"
import SearchForm from "@/components/SearchForm"
import Link from "next/link"
import {useRouter} from "next/router"
import useListingResults from "@/search/useListingResults"
import {BROWSE_TOPICS, legacyTagDestination} from "@/helpers/tags"
import {useEffect, useState, useSyncExternalStore} from "react"
import Seo from "@/components/Seo"
import {Toggle} from "@/components/ui/toggle"
import {RssIcon} from "lucide-react";

const subscribeHydration = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export default function PostListing({ previews, authors, tags, selectedTag = '', path, start, total, previous, next, searchMode = false }) {
  const router = useRouter()
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot)
  const urlReady = hydrated && router.isReady
  const query = searchMode && urlReady && typeof router.query.q === 'string' ? router.query.q.trim().slice(0, 200) : ''
  const searching = searchMode && (!urlReady || Boolean(query))
  const target = searching ? {kind: 'search', query: urlReady ? query : null}
    : {kind: 'listing', key: path, records: previews}
  const {view, status, retry} = useListingResults(target)
  const visiblePreviews = view?.records
  useEffect(() => {
    if (path !== '/articles') return
    const migrateHash = () => {
      const destination = legacyTagDestination(window.location.hash, tags)
      if (destination) router.replace(destination + window.location.search, undefined, {scroll: false})
    }
    migrateHash()
    window.addEventListener('hashchange', migrateHash)
    return () => window.removeEventListener('hashchange', migrateHash)
  }, [path, tags, router])

  const [languages, setLanguages] = useState(['pl', 'en'])
  const [showSeries, setShowSeries] = useState(true)

  const filteredPreviews = (visiblePreviews || [])
    .filter(article => showSeries || article.type === 'article')
    .filter(article => languages.includes(article.language))

  const toggleLanguage = language => setLanguages(current => current.includes(language)
    ? current.filter(value => value !== language)
    : [...current, language])

  const title = selectedTag ? `${selectedTag} articles and tutorials` : 'Articles and tutorials'
  const page = searchMode
    ? {kind: 'page', title: 'Search articles and tutorials', description: SITE_DESCRIPTION, path: '/search', noindex: true}
    : {
      kind: 'collection', path, noindex: Boolean(selectedTag && !total),
      title: `${title}${start ? ` - Page ${start / PAGE_SIZE + 1}` : ''}`,
      description: selectedTag ? `Explore ${selectedTag} articles and series chapters by the Bookkity community.` : SITE_DESCRIPTION,
      items: previews.map(article => ({title: article.title, path: article.url})),
    }

  return (
    <>
      <Seo page={page} />
      <Layout>
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
                className={`${languages.includes('pl') ? 'bg-white' : 'bg-gray-100'}`}
                title={"Show articles in Polish"}
              >
                🇵🇱
              </Toggle>
              <Toggle
                onClick={() => toggleLanguage('en')}
                className={(languages.includes('en')) ? 'bg-white' : 'bg-gray-100'}
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
        {searching && <div role="status" aria-live="polite" className="sr-only">
          {status === 'loading' && 'Searching…'}
          {status === 'ready' && (filteredPreviews.length ? `${filteredPreviews.length === 20 ? 'Top 20' : filteredPreviews.length} results for “${query}”.` : `No results for “${query}”.`)}
        </div>}
        <div aria-busy={status === 'loading'} aria-label={searching ? 'Search results' : 'Articles'} className={`pt-5 px-4 flex flex-col sm:flex-row flex-wrap -mx-2`}>
          {status === 'error' && <p role="alert" className="fixed bottom-4 left-4 right-4 z-20 mx-auto max-w-lg rounded-lg bg-white px-4 py-3 shadow-lg text-gray-600">Search couldn’t load. <button onClick={retry} className="underline">Try again</button> or reload this page.</p>}
          {!view && status === 'loading' && [0, 1, 2].map(index => (
            <div aria-hidden="true" key={index} className={`w-full md:w-1/2 xl:w-1/3 px-2 py-2 h-[338px] ${index === 1 ? 'hidden md:block' : index === 2 ? 'hidden xl:block' : ''}`}>
              <div className="h-full rounded-lg bg-gray-200" />
            </div>
          ))}
          {searching && status === 'ready' && filteredPreviews.length === 0 && <p className="px-2 text-gray-500">No results for “{query}”.</p>}
          {!searching && filteredPreviews.length === 0 && (
            <p className={`text-gray-500 text-sm text-center sm:text-left`}>
              No articles found in this category <span className={`italic font-semibold`}>(yet!)</span>
            </p>
          )}
          {filteredPreviews.map(article => {
            return (
              <div className={`w-full md:w-1/2 xl:w-1/3 px-2 py-2 h-[338px]`} key={article.url} data-article-card={article.url}>
                <div
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
                      {article.authors.map(author => (
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
