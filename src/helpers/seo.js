// @ts-check
import {authorPath} from './author-path.js'
export const SITE_URL = 'https://bookkity.com'
export const SITE_DESCRIPTION = 'Articles and tutorials about programming, software development, and technology from the Bookkity community.'
/** @param {string} path */
export function absoluteUrl(path) { return new URL(path, SITE_URL).href }
/** @param {string} section @param {string | undefined} image */
export function contentImage(section, image) {
  return image ? absoluteUrl(`/${section}/${image.replace(/^\/+/, '')}`) : absoluteUrl('/images/boo.png')
}
/** @typedef {{name:string, description?:string, avatar?:string}} Author */
/** @typedef {{title:string, path:string}} ListedPage */
/** @typedef {{title:string, description:string, path:string, image?:string, language?:string, noindex?:boolean} & (
 * {kind:'page'} | {kind:'collection', items:ListedPage[]} | {kind:'profile', person:Author} |
 * {kind:'post', date:string, authors:Author[], tags:string[]})} PageSeo */
/** @param {Author} author @returns {import('schema-dts').Person} */
function person(author) {
  const url = absoluteUrl(authorPath(author.name))
  return { '@type': 'Person', '@id': `${url}#person`, name: author.name, url,
    description: author.description, image: author.avatar ? contentImage('author', author.avatar) : undefined }
}
/** @param {PageSeo} page @returns {import('schema-dts').Graph} */
export function pageGraph(page) {
  const url = absoluteUrl(page.path)
  const organization = `${SITE_URL}/#organization`
  const website = `${SITE_URL}/#website`
  /** @type {import('schema-dts').Thing[]} */
  const nodes = [
    { '@type': 'Organization', '@id': organization, name: 'Bookkity', url: `${SITE_URL}/`, logo: absoluteUrl('/images/boo.png') },
    { '@type': 'WebSite', '@id': website, name: 'Bookkity', url: `${SITE_URL}/`, publisher: { '@id': organization } },
    { '@type': page.kind === 'profile' ? 'ProfilePage' : page.kind === 'collection' ? 'CollectionPage' : 'WebPage',
      '@id': `${url}#webpage`, url, name: page.title, description: page.description,
      inLanguage: page.language, isPartOf: { '@id': website },
      ...(page.kind === 'profile' ? { mainEntity: { '@id': `${absoluteUrl(authorPath(page.person.name))}#person` } } : {}),
      ...(page.kind === 'collection' ? { mainEntity: { '@id': `${url}#list` } } : {}),
      ...(page.kind === 'post' && !page.noindex ? { mainEntity: { '@id': `${url}#article` } } : {}) }
  ]
  if (page.kind === 'profile') nodes.push(person(page.person))
  if (page.kind === 'collection') nodes.push({ '@type': 'ItemList', '@id': `${url}#list`,
    itemListElement: page.items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title, url: absoluteUrl(item.path) })) })
  if (page.kind === 'post' && !page.noindex) {
    nodes.push(...page.authors.map(person))
    nodes.push({ '@type': 'BlogPosting', '@id': `${url}#article`, url, headline: page.title,
      description: page.description, image: page.image || absoluteUrl('/images/boo.png'),
      datePublished: page.date, inLanguage: page.language, keywords: page.tags,
      mainEntityOfPage: { '@id': `${url}#webpage` }, publisher: { '@id': organization },
      author: page.authors.map(author => ({ '@id': `${absoluteUrl(authorPath(author.name))}#person` })) })
  }
  return { '@context': 'https://schema.org', '@graph': nodes }
}
/** @param {import('schema-dts').Graph} graph */
export function serializeJsonLd(graph) { return JSON.stringify(graph).replace(/</g, '\\u003c') }
