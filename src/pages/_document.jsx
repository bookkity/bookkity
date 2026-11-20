import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className={`min-h-100vh max-w-full`}>
        <Main/>
        <NextScript/>
      </body>
    </Html>
  )
}
