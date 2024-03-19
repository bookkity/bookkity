import "@/styles/globals.css"
import '@/components/mdx/MDX.css'
import {createContext, useEffect, useState} from "react"
import axios from "axios"

const IdentityContext = createContext()

export default function App({ Component, pageProps }) {
  const [identity, setIdentity] = useState(null)

  const checkEndpoint = (identity) => {
    axios
      .post(`https://api.bookkity.com/api/check/${window.location.pathname}`, {}, {
        headers: {
          'x-identity': identity
        }
      })
      .then(() => { /* console.log('Valid') */ })
      .catch(error => console.error('Error checking endpoint', error))
  }

  useEffect(() => {
    const storedIdentity = localStorage.getItem('identity')

    if (storedIdentity) {
      setIdentity(storedIdentity)
      checkEndpoint(storedIdentity)
      return
    }

    axios
      .post('https://api.bookkity.com/api/user')
      .then(response => {
        localStorage.setItem('identity', response.data.uid)
        setIdentity(response.data.uid)
        checkEndpoint(response.data.uid)
      })
      .catch(error => console.error('Error fetching user', error))
  }, []);

  return (
    <IdentityContext.Provider value={{ identity }}>
      <Component {...pageProps} />
    </IdentityContext.Provider>
  )
}
