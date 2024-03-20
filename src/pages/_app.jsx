import "@/styles/globals.css"
import '@/components/mdx/MDX.css'
import IdentityContextProvider from "@/helpers/identity"

export default function App({ Component, pageProps }) {
  return (
    <IdentityContextProvider>
      <Component {...pageProps} />
    </IdentityContextProvider>
  )
}
