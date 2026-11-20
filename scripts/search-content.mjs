import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm)
export function searchText(source) {
  const parts = []
  function visit(node) {
    if (['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(node.type)) return
    if (['script', 'style'].includes(node.name)) return
    if (['text', 'inlineCode', 'code'].includes(node.type)) parts.push(node.value)
    else if (node.type === 'image' && node.alt) parts.push(node.alt)
    else node.children?.forEach(visit)
  }
  visit(parser.parse(source))
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}
const read = async file => matter(await fs.readFile(file, 'utf8'))
const files = async directory => (await fs.readdir(directory, {withFileTypes: true})).filter(f => f.isFile() && /\.mdx?$/.test(f.name)).map(f => f.name).sort()
function list(value) {
  if (value === undefined) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value) && value.every(v => typeof v === 'string')) return value
  throw new Error('Search metadata must be a string or string array')
}

export async function collectSearchRecords(root = process.cwd()) {
  const authors = new Map()
  for (const file of await files(path.join(root, 'authors'))) {
    const {data} = await read(path.join(root, 'authors', file))
    authors.set(path.parse(file).name, data.name)
  }
  const records = []
  function add(data, raw, url, type, series = '') {
    if (!data.title || !data.authors || !url.startsWith('/')) throw new Error(`Incomplete searchable content: ${url}`)
    const body = searchText(raw)
    records.push({url, type, title: data.title, description: data.description || body.slice(0, 180),
      authorHandles: list(data.authors),
      image: `/${type === 'article' ? 'article' : 'series'}/${(data.image || '').replace(/^\/+/, '')}`,
      date: data.date || '', displayTitle: series ? `${series}: ${data.shortTitle || data.title}` : data.title,
      authors: [...new Set(list(data.authors).flatMap(handle => [handle, authors.get(handle) || handle]))],
      tags: list(data.tags), keywords: [...list(data.keywords), ...list(data.shortTitle)], series, language: data.language || 'en', body})
  }
  for (const file of await files(path.join(root, 'articles'))) {
    const {data, content} = await read(path.join(root, 'articles', file))
    if (typeof data.url !== 'string') throw new Error(`Missing article URL: ${file}`)
    if (!data.url.startsWith('_')) add(data, content, `/articles/${encodeURIComponent(data.url)}`, 'article')
  }
  for (const dir of (await fs.readdir(path.join(root, 'series'), {withFileTypes:true})).filter(d => d.isDirectory())) {
    const folder = path.join(root, 'series', dir.name)
    const {data: series} = await read(path.join(folder, '.mdx'))
    for (const file of (await files(folder)).filter(f => f !== '.mdx')) {
      const {data, content} = await read(path.join(folder, file))
      if (data.published !== true) continue
      if (!series.url || !Number.isInteger(data.order)) throw new Error(`Missing chapter route: ${file}`)
      add({...series, ...data, tags: [...list(series.tags), ...list(data.tags)], keywords: [...list(series.keywords), ...list(data.keywords)]},
        content, `/series/${encodeURIComponent(series.url)}/${data.order}`, 'chapter', series.title)
    }
  }
  records.sort((a,b) => a.url.localeCompare(b.url))
  if (new Set(records.map(r=>r.url)).size !== records.length) throw new Error('Duplicate search URL')
  return records
}
