import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createRequire} from 'node:module'
import postcss from 'postcss'
import {buildMathStyles} from '../scripts/build-math-styles.mjs'

const require = createRequire(import.meta.url)

test('generated math CSS preserves all typography and resolves every WOFF2 face', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'math-styles-'))
  try {
    const output = await buildMathStyles(root)
    const generated = await fs.readFile(output, 'utf8')
    assert.match(generated, /Copyright/)
    const css = postcss.parse(generated)
    const source = postcss.parse(await fs.readFile(require.resolve('katex/dist/katex.min.css'), 'utf8'))
    const sources = []
    css.walkAtRules('font-face', face => face.walkDecls('src', src => sources.push(src.value)))
    assert.ok(sources.length > 0)
    for (const src of sources) {
      const match = src.match(/^url\("([^"]+\.woff2)"\) format\("woff2"\)$/)
      assert.ok(match, 'Each face has exactly one WOFF2 source')
      const font = await fs.readFile(path.resolve(path.dirname(output), match[1]))
      assert.equal(font.toString('ascii', 0, 4), 'wOF2', 'Every font URL resolves to a WOFF2 file')
    }
    // Compare typography, not formatting or generated asset paths.
    const typography = tree => {
      const rules = []
      tree.walkDecls(decl => {if (decl.prop !== 'src') rules.push([decl.parent.selector || decl.parent.name, decl.prop, decl.value])})
      return rules
    }
    assert.deepEqual(typography(css), typography(source))
    const before = await fs.stat(output)
    await buildMathStyles(root)
    assert.equal((await fs.stat(output)).mtimeMs, before.mtimeMs, 'Unchanged dependencies do not rewrite generated CSS')
  } finally { await fs.rm(root, {recursive: true, force: true}) }
})
