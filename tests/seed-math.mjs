// Disposable checkout only: a representative math page, not an editorial draft.
import fs from 'node:fs/promises'

const directory = 'series/9999-math-fixture'
await fs.mkdir(directory, {recursive: true})
await fs.writeFile(`${directory}/.mdx`, `---
url: "math-fixture"
title: "Math rendering fixture"
description: "Rendering checks"
authors: ["thatbakamono"]
language: "en"
image: "/0001/logo.jpg"
tags: []
---
`)
const terms = Array.from({length: 12}, (_, i) => `a_{${i}} x^{${i}}`).join(' + ')
const body = String.raw`Inline $x^2 + 1 = 2$ remains part of this sentence.

$$
x = 1
$$

$$
\begin{align}
p(x) &= ${terms} \\
q(x) &= ${terms}
\end{align}
$$

$$
\begin{pmatrix}1 & 2 \\ 3 & 4\end{pmatrix}
$$

$$
\sum_{i=0}^{100} i^2 = ${terms} \tag{12345}
$$

$$
\begin{cases}x^2 & x > 0 \\ 0 & x \le 0\end{cases}
$$
`
for (const order of [1, 2]) {
  await fs.writeFile(`${directory}/${order}.mdx`, `---\norder: ${order}\nshortTitle: "Math ${order}"\ntitle: "Math ${order}"\ndate: "2026-11-22"\npublished: false\nlisted: false\n---\n${body}`)
}
console.log('Created isolated /series/math-fixture/{1,2}')
