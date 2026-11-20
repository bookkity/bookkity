import "katex/dist/katex.min.css";
import "@fortawesome/fontawesome-svg-core/styles.css"
import {config} from "@fortawesome/fontawesome-svg-core"
import {Inter} from "next/font/google"
import "@/styles/globals.css"
import '@/components/mdx/MdxComponents.css'

import IdentityContextProvider from "@/helpers/identity"
import Head from "next/head"
import PostListing from "@/components/PostListing"

config.autoAddCss = false
const inter = Inter({subsets: ['latin', 'latin-ext'], display: 'optional', variable: '--font-inter'})

export default function App({ Component, pageProps }) {
  // Listing data has one persistent owner, including the mixed article/range route.
  const Page = pageProps.listingPage ? PostListing : Component
  return (
    <>
      <Head>
        <link rel="icon" href="/images/boo.png"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        {process.env.NEXT_PUBLIC_PREVIEW_NOINDEX === 'true' && (
          <meta key="robots" name="robots" content="noindex" />
        )}
      </Head>
      <div className={inter.variable}>
        <IdentityContextProvider>
          <Page {...pageProps} />
        </IdentityContextProvider>
      </div>
    </>
  )
}
