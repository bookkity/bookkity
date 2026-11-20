import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faSearch} from '@fortawesome/free-solid-svg-icons'
import {Input} from '@/components/ui/input'

export default function SearchForm({query = ''}) {
  const router = useRouter()
  const [input, setInput] = useState({query, value: query, sent: null})
  if (input.query !== query) {
    // Preserve newer typing only when acknowledging our own URL update.
    setInput({query, value: query === input.sent ? input.value : query, sent: null})
  }
  const setValue = value => setInput(current => ({...current, value}))
  const timer = useRef(null)
  const composing = useRef(false)
  const currentRouter = useRef(router)
  useEffect(() => { currentRouter.current = router }, [router])
  const cancel = () => clearTimeout(timer.current)

  useEffect(() => {
    const isSearch = url => new URL(url, window.location.origin).pathname === '/search'
    const leave = url => { if (!isSearch(url)) cancel() }
    const arrived = url => {
      if (!isSearch(url)) setInput({query: '', value: '', sent: null})
    }
    router.events.on('routeChangeStart', leave)
    router.events.on('routeChangeComplete', arrived)
    return () => {
      cancel()
      router.events.off('routeChangeStart', leave)
      router.events.off('routeChangeComplete', arrived)
    }
  }, [router.events])

  const navigate = input => {
    cancel()
    const q = input.trim().slice(0, 200)
    const active = currentRouter.current
    if (q === (typeof active.query.q === 'string' ? active.query.q : '') && active.pathname === '/search') return
    if (!q && active.pathname !== '/search') return
    setInput(current => ({...current, sent: q}))
    const inSearch = active.pathname === '/search'
    active[inSearch ? 'replace' : 'push']({pathname: '/search', query: q ? {q} : {}}, undefined,
      {shallow: inSearch, scroll: false}).catch(error => { if (!error.cancelled) window.location.assign(q ? `/search?q=${encodeURIComponent(q)}` : '/search') })
  }
  const change = input => {
    setValue(input)
    cancel()
    if (!composing.current) timer.current = setTimeout(() => navigate(input), 300)
  }

  return (
    <form role="search" action="/search" method="get" className="flex items-center w-full" onSubmit={event => {
      event.preventDefault()
      if (!composing.current) {
        const input = new FormData(event.currentTarget).get('q')
        setValue(input)
        navigate(input)
      }
    }}>
      <div className="pl-4"><div className="h-5 w-5"><FontAwesomeIcon icon={faSearch} /></div></div>
      <Input name="q" type="search" maxLength={200} value={input.value}
        onChange={event => change(event.target.value)}
        onCompositionStart={() => { composing.current = true; cancel() }}
        onCompositionEnd={event => { composing.current = false; change(event.currentTarget.value) }}
        aria-label="Search all articles and chapters" placeholder="Browse articles & series"
        className="w-full bg-white border-none shadow-none h-14 rounded-lg text-xl focus-visible:outline-hidden focus-visible:ring-0 placeholder:focus-visible:text-white" />
    </form>
  )
}
