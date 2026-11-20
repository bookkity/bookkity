# SEO grounding

## Overview
Bookkity is a small filesystem-backed Next.js Pages Router blog. Its pages are statically generated from MDX frontmatter and serialized MDX bodies; there is no CMS, content API, sitemap, robots.txt, or JSON-LD today. Existing article and chapter pages have substantial hand-written social metadata, while most listing and author pages have only a title.

## Key concepts
- Article identity is frontmatter `url`; author identity in URLs and content references is `name` (a handle), not the numeric author `id`.
- Articles whose URL begins `_` remain reachable but have `noindex` and are removed from home, author lists, and RSS.
- Chapters distinguish `published` from `listed`. Published-but-unlisted chapter 1 of IntelliJ development is a real reachable article and appears in the series and author views; it is excluded only from home/RSS. An unpublished Reposilite chapter is also reachable and linked but has `noindex`.
- All content is local to a deployed build. A 12-hour sitemap cache refresh cannot discover content that has not been deployed.

## How it works
`getArticles`, `getAuthors`, and `getSeries` read local files, parse gray-matter frontmatter, and serialize MDX. Dynamic detail pages call these helpers from both `getStaticPaths` and `getStaticProps`; all use `fallback: false`. Home builds article/chapter previews and filters them in browser state. Tag choices are a fixed list of hash anchors (`#java`, `#kotlin`, etc.), so tags have no independently fetchable or indexable page and direct hash loads do not restore selection. Actual content tags also include KMP and Windows topics absent from this menu.

Article bylines and home cards link author handles to `/<author>`. Author pages list authored articles and series, but each series card links only to chapter 1, not each displayed chapter. The series index interpolates the entire authors array into one href; that breaks if multiple authors exist. Chapters link each author separately and link every chapter, including unpublished ones.

Article/chapter metadata duplicates the canonical host `https://bookkity.com`. RSS independently chooses production host or localhost and is written to `public/rss.xml` as a side effect of home `getStaticProps`. The call is not awaited although the current generator executes its write synchronously. `_app` adds a preview noindex meta tag, and `next.config.mjs` adds `X-Robots-Tag: noindex` to all Vercel preview responses. These protections must survive shared metadata changes.

## Where things live
- `src/pages/index.jsx`: initial static listing, client-only search/language/series/tag filtering, RSS generation trigger.
- `src/pages/article/[url].jsx`: article paths/content, canonical/social metadata and hidden-article noindex.
- `src/pages/[author].jsx`, `about.jsx`: author routes and directory.
- `src/pages/series.jsx`, `series/[seriesUrl]/[chapterIdx].jsx`: series directory, chapter routes/metadata/navigation.
- `src/pages/projects.jsx`, `project/[url].jsx`: project listing and internal detail routes. External projects are excluded from static detail paths and explicitly return 404.
- `src/pages/merch.jsx`, `merch/[id].jsx`: product listings/details.
- `src/helpers/{articles,authors,series,projects,merch,rss}.js`: content ownership.
- `src/pages/_document.jsx`: fixed HTML `lang=en`.

## Route audit
| Route | Present metadata | Gaps |
| --- | --- | --- |
| `/` | title | no description/canonical/social/schema; no h1; hash-only tags |
| `/article/:url` | description/canonical/OG/Twitter/published time/author/tags | no JSON-LD; author OG uses handles rather than profile URLs; locale always en_US; no visible tag links |
| `/:author` | title | no description/canonical/social/ProfilePage/Person; multiple h1s; chapter linkage incomplete |
| `/about` | title | no description/canonical/social/organization linkage; no h1 |
| `/series` | title | no description/canonical/social/collection schema; no h1; multi-author link issue |
| `/series/:url/:order` | description/canonical/OG/Twitter/published time/author/tags | no JSON-LD; locale always en_US; metadata ignores chapter image; no tag links |
| `/projects` | title/description | no canonical/social; client filter only |
| `/project/:id` | title/description | no canonical/social; FunnyTeam author points at nonexistent `/FunnyTeam` |
| `/merch` | title/description | no canonical/social |
| `/merch/:id` | title/description/partial OG | title says X Merch; relative OG image; no canonical/og:url/twitter |

## Gotchas and minimal implementation constraints
- Preserve existing paths for articles/authors/chapters; add `/tags/:tag` rather than relocating old content.
- Tag slugs need explicit handling for mixed case and spaces (`Windows Internals`, `API Sets`); avoid silently colliding different labels. Generate only tags with visible content so empty fixed categories do not create thin landing pages.
- Keep `published` and `listed` semantics distinct. Sitemap should exclude noindex content but include published/unlisted chapters; listing surfaces can still require `listed`.
- Current article image frontmatter begins `/`, while series image strings vary. Existing article metadata happens to produce a correct `/article/000x/...` path; home creates duplicate slashes. Chapter 2 has its own image and should use it in metadata. Normalize asset joining without treating leading `/000x` as a site-root asset.
- Current home avatar construction assumes all avatars are `.jpg`, but error56 uses `.png`; resolve from author records when touching the linkage.
- All current article languages are English. Support accurate schema/OG language from content; avoid inventing hreflang without actual translations.
- Minimal JSON-LD can share stable `https://bookkity.com/#organization`, `/#website`, `/<handle>#person`, and page-local `#article`/`#webpage` IDs. These fragments identify entities; they are unrelated to hash routing.
- Do not invent lastModified dates, author real names, publisher legal details, product reviews/ratings, or SearchAction URLs that do not exist.
- No tests or test script are configured. `npm run build` and lint are existing validation surfaces; add focused behavior checks for generated URL/schema/sitemap invariants if needed.

## Selected implementation

Route-owned metadata with one `Seo` component and pure `seo.js` graph builder was selected over a normalized site-wide content catalog. Independent design scoring was 24/25 versus 23/25: both met the routing and cache constraints, while the catalog added a second content representation. Adopted the alternative's discriminated SEO input and explicit `max-age=0`. No route registry, router package, CMS migration, or application-wide TypeScript conversion.

Callers pass `{kind, title, description, path, ...contentFacts}` to `Seo`; `pageGraph(PageSeo): Graph` owns entity IDs and relationships. `collectTags(articles, series)` owns tag paths and collision checks. `sitemapPaths(content)` enumerates indexable routes; `renderSitemap(paths)` owns XML escaping. This keeps filesystem loading in existing helpers and schema vocabulary out of pages.

Implemented units:

1. Add schema-dts and a scoped TypeScript checker, preserving the JavaScript application.
2. Replace hash filtering with static, nonempty tag collections derived from content; reuse the listing UI.
3. Consolidate canonical/social metadata and typed Organization, WebSite, WebPage, BlogPosting, ProfilePage/Person and collection graphs. Escape JSON-LD script content; preserve preview/draft noindex.
4. Generate `/sitemap.xml` using `src/pages/sitemap.xml.js`; advertise it in robots.txt. Include published/unlisted chapters, exclude drafts and external project targets; omit unsupported lastmod dates.
5. Add topic links, individual author and chapter links, correct profile avatars and missing page headings. Unknown project credits remain text rather than broken profile links.

## Cache contract

The sitemap filename is a static route name. Its raw XML response uses native Pages Router `getServerSideProps`, because `getStaticProps` produces HTML. Headers are `application/xml; charset=utf-8` and `public, max-age=0, s-maxage=43200, stale-while-revalidate=60`.

A compatible shared cache serves it fresh for 12 hours, then refreshes on demand, with a 60-second stale-while-revalidate allowance. This is not framework-owned XML ISR or a timer. Bare `next start` regenerates on requests; actual edge caching must be verified on the deployment. Filesystem content changes require a new deployment regardless of TTL. Preview `X-Robots-Tag: noindex` remains unchanged; robots.txt allows crawling so noindex can be observed.

## Sources

- [Next.js Pages Router XML sitemap example](https://nextjs.org/learn/seo/xml-sitemaps)
- [Pages Router server-side response caching](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props)
- [getStaticProps and revalidate](https://nextjs.org/docs/pages/api-reference/functions/get-static-props)
- [Google article structured-data guidance and author URLs](https://developers.google.com/search/docs/appearance/structured-data/article)
- [schema-dts typed graphs](https://github.com/google/schema-dts)

## Remaining editorial and deployment work

- Tag introductions are factual starting copy. Add distinctive editorial introductions as topics grow; do not create empty categories.
- Existing MDX body headings and fixed document `lang=en` remain. Current articles are English; future Polish content should receive a document-language solution, not invented translations/hreflang.
- No fabricated modification dates, author real names, product offers, ratings or SearchAction.
- Existing oversized MDX page-data build warnings remain; loader/payload optimization is outside this change.
- Submit the production sitemap in Search Console and inspect representative rich results after deployment. Local tests do not prove Google indexing or ranking.

## Initial verification results (before pagination)

- `npm run check:seo`: passed; graph constructors are checked against schema-dts.
- `node --test tests/seo.test.mjs`: 3 tests passed (tag paths/collisions, sitemap publication/XML rules, graph identity/safe serialization).
- `npm run lint`: 0 errors, 27 warnings; baseline had 0 errors, 28 warnings.
- `npx next build --webpack`: passed. The baseline default Turbopack build failed inside the execution sandbox when binding a worker port; webpack was used for production verification.
- `node tests/seo-http.mjs` against `next start`: passed for 32 indexable routes, including raw HTML canonicals/JSON-LD/headings, all sitemap entries matching build routes, draft exclusions/noindex, unknown tag 404, robots discovery, XML MIME and exact cache header.
- Preview configuration was evaluated with `VERCEL_ENV=preview`: build flag and wildcard X-Robots-Tag assertions passed. No live preview or production edge-cache verification is claimed.
- The branch retains its existing separate noindex prerequisite commit; it is not replaced or squashed into this work.
- Independent final review identified collection schema ordering differing from visible cards. Both now derive from the same public, newest-first list, and the HTTP check verifies ItemList order against rendered links.

## Review follow-up: URLs, pagination and XML encoding

The initial route-preservation scope above was superseded by the requested URL migration. Current post pages use `/articles/<slug>`; the general listing is `/articles`; topics use `/tag/<topic>`. Root `/`, `/article`, old single-segment `/article/<slug>` and `/tags/<topic>` permanently redirect. Nested `/article/<folder>/<file>` assets remain untouched.

Ranges contain ten entries with an exclusive end: `10-20` selects entries 11–20. `/articles/0-10` and `/tag/<topic>/0-10` redirect to their base first pages. Later nonempty pages have self-canonicals and ordinary previous/next anchors. Malformed, unaligned, unsafe or empty later ranges return 404. Numeric `digits-digits` post slugs are reserved and rejected during static generation. Filters explicitly apply to the current page.

A second design comparison selected a single native `/articles/[url]` dispatcher over rewriting to a separate internal listing URL (25/25 versus 20/25). Existing content loaders feed one pure `createPreviews` ordering and `listingPage` range/slice helper. Both listings and sitemap use `listingPaths`; listing props contain only selected card metadata. The alternative's safe-integer checks and bounded props were retained. This avoids duplicate internal URLs and preserves the Pages Router.

First-page redirects live in `next.config.mjs`: a build experiment confirmed Next rejects `getStaticProps` redirects for explicitly prerendered static paths. Aliases are not generated or included in the sitemap.

The sitemap interpolates URL values into XML text nodes, so it requires URL encoding followed by XML entity escaping. `isomorphic-dompurify` sanitizes HTML and is not a replacement for this encoding. A regression test verifies preservation of URL data containing ampersands, quotes and a script-shaped value. No dependency was added.

References: [Google pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [Next.js permanent 308 redirects](https://nextjs.org/docs/pages/api-reference/config/next-config-js/redirects), [sitemap XML entity escaping](https://www.sitemaps.org/protocol.html#escaping).

Follow-up verification: 7 unit tests passed, including 0/1/10/11/21-item boundaries, stable tie ordering, range rejection and sitemap page inventory. HTTP checks passed on the real 32-route content and on a temporary build with 21 additional uniquely named posts (57 indexable routes), requiring actual second and third pages for both `/articles` and `/tag/java`. The temporary posts were removed. The fixture run asserted canonical/schema/card order, bounded slices, navigation, sitemap inclusion, 308 aliases, malformed-range 404s and unchanged image responses. Lint remains 0 errors / 27 warnings; schema checking passed.

Final real-content rebuild and HTTP verification passed again after fixture removal: 32 indexable routes. Independent review found no blocking code issues and independently reran all seven unit tests.

## Legacy-structure verification

`tests/legacy-routes-http.mjs` reconstructs the pre-SEO inventory from commit `fd3742a` (override with `LEGACY_REF`) and checks the built site. Passed: 7 permanent mappings with query-string preservation, 18 unchanged page routes, and 67 byte-identical original public assets. Trailing-slash aliases resolve within two redirects; missing old posts still end at 404. RSS links point at current article URLs.

The deeper audit identified RSS IDs implicitly changing with URLs. Article GUIDs now retain their old `/article/<slug>` values while their links use `/articles/<slug>`, preventing the migration from intentionally changing item identities. HTTP checks assert this distinction.

Known legacy home fragments such as `/#java` are mapped to their topic route by a small client effect after the root redirect, preserving query strings. Fragments cannot be redirected by the server because they are not sent in HTTP requests. Unknown/empty categories stay on the listing. The original app did not restore filters from directly loaded fragments either; this is bookmark compatibility improvement, not a claim that a previously working deep-link feature was removed. Fragment resolution is unit-tested; a real-browser navigation test was not performed.

Latest checks: production webpack build, all 8 unit tests, 32-route SEO HTTP suite and the full legacy route/asset/RSS suite passed. Lint remains 0 errors / 27 warnings. Search/homepage options are recorded in [search-options.md](search-options.md); search implementation remains a separate decision.
