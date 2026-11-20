import {useEffect, useRef, useState} from 'react'

// One committed view spans static listings and asynchronous search. Pending work
// keeps that view; null means no content has ever been committed (direct search).
export default function useListingResults(target) {
  const listing = target.kind === 'listing'
  const query = listing ? null : target.query
  const key = listing ? `listing:${target.key}` : query === null ? 'awaiting-url' : `search:${query}`
  const worker = useRef(null)
  const request = useRef(0)
  const [state, setState] = useState(() => ({key, attempt: 0, status: listing ? 'ready' : 'loading',
    view: listing ? {key, records: target.records} : null}))

  // Commit already-available route data before paint, not in a later effect.
  if (state.key !== key || (listing && state.view?.records !== target.records)) {
    setState({...state, key, status: listing ? 'ready' : 'loading',
      view: listing ? {key, records: target.records} : state.view})
  }

  useEffect(() => () => {
    request.current++
    worker.current?.terminate()
    worker.current = null
  }, [])
  useEffect(() => {
    const id = ++request.current
    if (!query) return
    const fail = () => {
      if (id !== request.current) return
      worker.current?.terminate()
      worker.current = null
      setState(current => current.key === key ? {...current, status: 'error'} : current)
    }
    try {
      worker.current ||= new Worker(new URL('./search.worker.js', import.meta.url), {type: 'module'})
      worker.current.onmessage = ({data}) => {
        if (data.id !== request.current) return
        if (data.error) return fail()
        setState(current => current.key === key
          ? {...current, status: 'ready', view: {key, records: data.results}}
          : current)
      }
      worker.current.onerror = fail
      worker.current.postMessage({id, query})
    } catch {
      fail()
    }
    return () => { request.current = id + 1 }
  }, [key, query, state.attempt])

  return {
    view: state.view, status: state.status,
    retry: () => setState(current => ({...current, status: 'loading', attempt: current.attempt + 1})),
  }
}
