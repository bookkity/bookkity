import test from 'node:test'
import assert from 'node:assert/strict'
import {serializeMdx} from '../src/helpers/mdx.js'

test('valid inline and numbered display math retain accessible math output', async () => {
  const result = await serializeMdx(String.raw`Inline $x^2$.

$$
\begin{align}
x &= 1 + 2 \\
y &= \frac{1}{2}
\end{align}
$$`)
  assert.match(result.compiledSource, /katex-mathml/)
  assert.match(result.compiledSource, /katex-tag/)
  assert.doesNotMatch(result.compiledSource, /katex-error/)
})

test('invalid TeX fails serialization instead of publishing error markup', async () => {
  for (const source of [String.raw`$\unknownBookkityCommand{x}$`, '$$\n\\frac{1}{\n$$']) {
    await assert.rejects(() => serializeMdx(source), /KaTeX|math|ParseError/i)
  }
})


test('invalid math identifies its source file', async () => {
  await assert.rejects(
    () => serializeMdx(String.raw`$\unknownBookkityCommand{x}$`, 'articles/example.mdx'),
    /articles\/example\.mdx/
  )
})
