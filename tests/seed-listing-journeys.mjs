// Use only an isolated measurement copy: node tests/seed-listing-journeys.mjs /tmp/copy
import fs from 'node:fs/promises'
import path from 'node:path'
const root = process.argv[2]
if (!root) throw new Error('Pass an isolated source copy; do not seed the working checkout.')
if (path.resolve(root) === process.cwd()) throw new Error('Seed a separate source copy, not this checkout.')
for (let i = 1; i <= 24; i++) {
  await fs.writeFile(path.join(root, 'articles', `journey-fixture-${i}.mdx`), `---
title: "Journey fixture ${i}"
url: journey-fixture-${i}
authors: [dzikoysk]
tags: [java]
language: en
date: "2020-01-${String(i).padStart(2, '0')}"
image: "/0000/progress-bar.jpg"
description: "Pagination journey fixture ${i}"
---
Fixture content for pagination measurement only.
`, {flag: 'wx'})
}
