import "katex/dist/katex.min.css";
import "@/styles/globals.css"
import '@/components/mdx/MdxComponents.css'

import IdentityContextProvider from "@/helpers/identity"
import Head from "next/head"
import PostListing from "@/components/PostListing"

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
      <IdentityContextProvider>
        <Page {...pageProps} />
      </IdentityContextProvider>
    </>
  )
}
