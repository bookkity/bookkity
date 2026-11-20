export const searchCases = [
  ['api sets', '/articles/api-sets'], ['sets api', '/articles/api-sets'],
  ['windows loader', '/articles/api-sets'], ['ApiSetMap', '/articles/api-sets'],
  ['thatbakamono', '/articles/api-sets'], ['hello world', '/articles/hello-world'],
  ['kotlin js compiler', '/articles/kotlin-multiplatform-a-practical-use-case-of-js-target'],
  ['multiplatfrom', '/articles/kotlin-multiplatform-a-practical-use-case-of-js-target'],
  ['dzikoysk kotlin', '/articles/kotlin-multiplatform-a-practical-use-case-of-js-target'],
  ['functional java', '/articles/toward-functional-paradigm-fundamental-concepts-in-java'],
  ['javs functional', '/articles/toward-functional-paradigm-fundamental-concepts-in-java'],
  ['pure functions', '/articles/toward-functional-paradigm-fundamental-concepts-in-java'],
  ['IntelliJ inspections', '/series/intellij-plugin-development/2'],
  ['quick fixes', '/series/intellij-plugin-development/2'],
  ['reposilite', '/series/reposilite-3x-backstage/1'],
  ['!reposilite', '/series/reposilite-3x-backstage/1'],
  ['^ApiSetMap', '/articles/api-sets'],
  ['=reposilite', '/series/reposilite-3x-backstage/1'],
  ['java | qzxvnonexistent', null],
  ['java qzxvnonexistent', null], ['qzxvnonexistent', null], ['', null], ['!^|', null],
]

// Metadata search deliberately excludes queries requiring arbitrary body text.
// Keep the original suite above for an honest full-body comparison.
export const metadataCases = searchCases.filter(([query]) => ![
  'ApiSetMap', '^ApiSetMap',
].includes(query))
