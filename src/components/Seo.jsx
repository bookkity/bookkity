import Head from 'next/head'
import {absoluteUrl, pageGraph, serializeJsonLd} from '@/helpers/seo'

/** @param {{page: import('../helpers/seo').PageSeo}} props */
export default function Seo({page}) {
  const url = absoluteUrl(page.path)
  const image = page.image ? absoluteUrl(page.image) : absoluteUrl('/images/boo.png')
  const title = page.title === 'Bookkity' ? page.title : `${page.title} | Bookkity`
  const noindex = page.noindex || process.env.NEXT_PUBLIC_PREVIEW_NOINDEX === 'true'
  return <Head>
    <title>{title}</title>
    <meta name="description" content={page.description} key="description" />
    <link rel="canonical" href={url} key="canonical" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={page.description} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content={page.kind === 'post' ? 'article' : 'website'} />
    <meta property="og:site_name" content="Bookkity" />
    <meta property="og:image" content={image} />
    <meta property="og:image:alt" content={page.title} />
    {page.language && <meta property="og:locale" content={page.language === 'pl' ? 'pl_PL' : 'en_US'} />}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={page.description} />
    <meta name="twitter:image" content={image} />
    {noindex && <meta name="robots" content="noindex" key="robots" />}
    {page.kind === 'post' && <meta property="article:published_time" content={page.date} />}
    {page.kind === 'post' && page.authors.map(author => <meta key={`author-${author.name}`} property="article:author" content={absoluteUrl(`/${encodeURIComponent(author.name)}`)} />)}
    {page.kind === 'post' && page.tags.map(tag => <meta key={`tag-${tag}`} property="article:tag" content={tag} />)}
    <script key="schema" type="application/ld+json" dangerouslySetInnerHTML={{__html: serializeJsonLd(pageGraph({...page, noindex}))}} />
  </Head>
}
