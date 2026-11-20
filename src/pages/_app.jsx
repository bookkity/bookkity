import "katex/dist/katex.min.css";
import "@/styles/globals.css"
import '@/components/mdx/MdxComponents.css'

import IdentityContextProvider from "@/helpers/identity"
import Head from "next/head"

export default function App({ Component, pageProps }) {
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
        <Component {...pageProps} />
      </IdentityContextProvider>
    </>
  )
}
