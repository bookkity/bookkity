import {useEffect} from "react"
import axios from "axios"


export default function IdentityContextProvider({ children }) {

  const checkEndpoint = (identity) => {
    axios
      .post(`https://api.bookkity.com/api/check/${window.location.pathname}`, {}, {
        headers: {
          'x-identity': identity
        }
      })
      .catch(error => console.error('Error checking endpoint', error))
  }

  useEffect(() => {
    const storedIdentity = localStorage.getItem('identity')

    if (storedIdentity) {
      checkEndpoint(storedIdentity)
      return
    }

    axios
      .post('https://api.bookkity.com/api/user')
      .then(response => {
        localStorage.setItem('identity', response.data.uid)
        checkEndpoint(response.data.uid)
      })
      .catch(error => console.error('Error fetching user', error))
  }, []);

  return children
}
