import fs from 'node:fs/promises'
import path from 'node:path'
import {createRequire} from 'node:module'
import postcss from 'postcss'

const require = createRequire(import.meta.url)

// Keep KaTeX's metrics and complete font coverage; Next hashes and serves the files.
export async function buildMathStyles(root = process.cwd()) {
  const source = require.resolve('katex/dist/katex.min.css')
  const output = path.join(root, 'src/generated/katex.css')
  const css = postcss.parse(await fs.readFile(source, 'utf8'), {from: source})
  css.walkAtRules('font-face', face => {
    const src = face.nodes.find(node => node.prop === 'src')
    const woff2 = src?.value.match(/url\(["']?([^"')]+\.woff2)["']?\)\s*format\(["']woff2["']\)/)
    if (!woff2) throw new Error('KaTeX font face is missing a WOFF2 source')
    const font = path.resolve(path.dirname(source), woff2[1])
    const url = path.relative(path.dirname(output), font).split(path.sep).join('/')
    src.value = `url("${url}") format("woff2")`
  })
  const license = await fs.readFile(require.resolve('katex/LICENSE'), 'utf8')
  const generated = `/*! KaTeX — ${license.replaceAll('*/', '* /')} */\n${css.toString()}`
  if (await fs.readFile(output, 'utf8').catch(() => null) !== generated) {
    await fs.mkdir(path.dirname(output), {recursive: true})
    await fs.writeFile(output, generated)
  }
  return output
}
