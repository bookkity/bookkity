import {useEffect, useRef, useState} from 'react'

export default function useSearch(query) {
  const worker = useRef(null)
  const request = useRef(0)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({query: '', status: 'idle', results: []})
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
      setState({query, status: 'error', results: []})
    }
    try {
      worker.current ||= new Worker(new URL('./search.worker.js', import.meta.url), {type: 'module'})
      worker.current.onmessage = ({data}) => {
        if (data.id !== request.current) return
        if (data.error) return fail()
        setState({query, status: 'ready', results: data.results})
      }
      worker.current.onerror = fail
      worker.current.postMessage({id, query})
    } catch {
      fail()
    }
    return () => { request.current = id + 1 }
  }, [query, attempt])
  return {
    ...(query ? state.query === query ? state : {status: 'loading', results: []} : {status: 'idle', results: []}),
    retry: () => {
      setState({query, status: 'loading', results: []})
      setAttempt(value => value + 1)
    },
  }
}
