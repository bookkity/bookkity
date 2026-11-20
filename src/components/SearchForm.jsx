import {useRouter} from 'next/router'
import {Input} from '@/components/ui/input'

export default function SearchForm({query = ''}) {
  const router = useRouter()
  return (
    <form role="search" action="/search" method="get" className="flex gap-3 items-center w-full" onSubmit={event => {
      event.preventDefault()
      const q = new FormData(event.currentTarget).get('q').trim().slice(0, 200)
      router.push({pathname: '/search', query: q ? {q} : {}}, undefined, {shallow: router.pathname === '/search'})
    }}>
      <Input key={query} name="q" type="search" maxLength={200} defaultValue={query}
        aria-label="Search all articles and chapters" placeholder="Search all articles and chapters"
        className="w-full bg-white h-14 rounded-lg text-lg" />
      <button type="submit" className="rounded-lg bg-purple-900 text-white px-4 py-3">Search</button>
    </form>
  )
}
