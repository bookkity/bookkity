import Link from 'next/link'
import {useRouter} from 'next/router'
import Layout from '@/components/Layout'
import Seo from '@/components/Seo'
import SearchForm from '@/components/SearchForm'
import useSearch from '@/search/useSearch'

export default function Search() {
  const router = useRouter()
  const query = router.isReady && typeof router.query.q === 'string' ? router.query.q.trim().slice(0, 200) : ''
  const {status, results, retry} = useSearch(query)
  return (
    <>
      <Seo page={{kind: 'page', title: 'Search', description: 'Search Bookkity articles and series chapters.', path: '/search', noindex: true}} />
      <Layout>
        <h1 className="pt-8 pb-6 text-3xl font-semibold">Search</h1>
        <SearchForm query={query} />
        <noscript>Enable JavaScript to search, or browse <Link href="/articles">articles</Link> and <Link href="/series">series</Link>.</noscript>
        <div role="status" aria-live="polite" className="py-6">
          {status === 'idle' && 'Search by title, topic, author, or words inside an article.'}
          {status === 'loading' && 'Searching…'}
          {status === 'ready' && (results.length ? `Showing ${results.length === 20 ? 'the top 20' : results.length} results for “${query}”.` : `No results for “${query}”.`)}
          {status === 'error' && <>Search couldn’t load. <button onClick={retry} className="underline">Try again</button> or reload this page.</>}
        </div>
        <ol className="space-y-4 pb-8" aria-label="Search results">
          {results.map(result => (
            <li key={result.url} className="bg-white rounded-lg p-5">
              <h2 className="font-semibold text-xl"><Link href={result.url} prefetch={false}>{result.title}</Link></h2>
              <p className="pt-2 text-gray-600">{result.description}</p>
              <p className="pt-2 text-sm text-gray-500">{result.authors.join(', ')}{result.series && ` · ${result.series}`}</p>
            </li>
          ))}
        </ol>
      </Layout>
    </>
  )
}
