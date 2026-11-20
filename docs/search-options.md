# Build-time metadata search

`/articles` and topic listings stay statically generated. `/` redirects to `/articles`. Their original search input navigates with Next's Pages Router to `/search?q=...` after a 300 ms typing debounce (Enter flushes it). Subsequent queries use shallow `replace`, without scrolling or adding one history entry per edit; Back returns to the listing. IME composition waits until committed, and leaving cancels pending input. No separate navigation item or search button is added. `/search` is statically generated and noindex, excluded from the sitemap. It uses the same `PostListing` component, cards, controls, and curated topic bar as `/articles`; an empty query shows the normal first listing page.

## Automatic content coverage

The Next configuration generates the index before compilation, including direct `next build` invocations. `npm run dev` also watches `articles/`, `series/`, and `authors/` and regenerates it after edits, additions, and deletions. Reload an already-open search page after development edits; each worker holds one content snapshot. No per-post search configuration or separate indexing command is needed. Production content changes require the normal rebuild/deployment.

The collector reads public articles and **all published chapters**, including chapters omitted from the home feed. It excludes article slugs beginning with `_` and unpublished chapters, matching the existing publication rules. It searches titles, chapter navigation titles, tags, optional frontmatter `keywords`, author handles/names, series titles, and descriptions. Missing descriptions get a short plain-text excerpt. Keywords are optional; authors do not need to add them to make content searchable.

An MDX syntax tree supplies the opening plain-text excerpt when a description is missing. Full bodies and separate code/heading fields are not indexed or shipped; body text is searchable only where it becomes the description excerpt. Body text remains build-only input for that excerpt and comparison tooling. Arbitrary body-only queries therefore no longer match; authors do not need a keyword-extraction pipeline or a maintained vocabulary. Future content follows the existing frontmatter contract, and duplicate search URLs fail the build.

## Build and browser boundary

`buildSearchIndex()` writes one content-hashed JSON asset containing public result records and `Fuse.createIndex(...).toJSON()`. Only metadata enters the index. Schema-v3 result records contain only card data: URL, display title, author handles, image path, date, content type, and language. Searchable descriptions, author names, series titles, tags, and keywords remain in the serialized index. Images remain separate assets, not embedded in JSON. The generated manifest points the bundled worker to that exact asset. Both files are generated, ignored by Git, and written before compilation. Obsolete generated JSON files are removed; a clean deployment does not accumulate historical corpora.

The browser creates **one custom Web Worker**, lazily on the first debounced non-empty query. The worker downloads the asset once, restores it with `Fuse.parseIndex`, and searches locally. The normal archive page does not fetch the corpus, and `/search` only embeds ordinary first-page listing props in `__NEXT_DATA__`, not the complete search corpus. The worker is terminated when the shared listing component unmounts. Request IDs prevent older responses from replacing newer searches. Failed downloads can be retried; an old tab spanning deployments may need a reload.

Fuse's public serialized index contains field values and norms, not its token-ranking statistics. Those statistics initialize once in the worker. This uses public Fuse APIs and does not patch private internals or create a worker pool.

Content-hashed JSON responses use one-year immutable caching. The search page and worker use Next's normal asset handling. There is no search API or runtime server computation per query. Result links disable viewport prefetching so displaying matches does not eagerly download their article payloads. Static transfer, asset requests, and build work still consume hosting resources; this is not a zero-quota claim.

## Matching and limits

Pinned Fuse 7.5.0 uses fuzzy **all-token** search, threshold `0.3`, location-independent matching, and diacritic folding. Titles, tags, and keywords rank above descriptions; author and series fields also contribute. Tokens may match across fields and in any order. `C++` and `C#` retain their suffixes. Extended operators are not exposed as query syntax, so pasted punctuation does not unexpectedly exclude documents or create OR branches.

Queries are bounded to 200 characters; results show the top 20. Empty/punctuation-only queries return no matches. Result text is rendered by React without HTML injection. Loading, no-results, failure/retry, direct URL loading, and back/forward states are supported.

This is a metadata index, downloaded as a whole. More content requires no manual registry, but download size and search cost grow with the corpus. A worker protects the UI thread; it does not remove that cost. The [homelab benchmark](search-benchmark.md) compares the metadata representation against the former full-body index, including lost body-query coverage and cold/warm results at 1,000 records.

## Verification

- `node --test tests/*.test.mjs`: serialization, natural-query relevance, MDX extraction, automatic new-content discovery, publication rules, URL encoding, cleanup, and collisions, alongside existing SEO tests.
- `npm run benchmark:search`: the current metadata query suite across matcher settings.
- `node scripts/benchmark-search-representations.mjs /path/to/full-body-checkout`: five alternating full-body/metadata/headings comparisons. The baseline is commit `12da8c7`, with dependencies installed.
- Set `SEARCH_BASELINE_ROOT` and `SEARCH_BASELINE_ORIGIN` when running the browser test to compare both production builds in alternating rounds. Both builds must serve on separate ports; the baseline checkout must remain unchanged.
- `node tests/search-browser.mjs http://127.0.0.1:3100`: real worker and route behavior, static headers, retry/history, and browser timings against a production build. Install Chromium using `npx playwright install chromium`, or point `CHROMIUM_EXECUTABLE` at an installed Chromium.
- `node tests/search-dev.mjs`: adds and deletes a temporary post while the development server runs, verifying the updated worker results without a restart.
- `node tests/seo-http.mjs` and `node tests/legacy-routes-http.mjs`: sitemap, metadata, redirects, and existing routes/assets against the same production server.

## Design decision and sources

Independent designs compared pre-compilation MDX collection with post-build HTML collection. The initial design used MDX collection plus a single generated artifact: it fits Next's deployment packaging without an additional post-build pass or search service. The development launcher owns its watcher and Next child. A custom worker can restore the public prebuilt index; Fuse's native worker pool constructs its own shards from documents. A chunked static engine such as Pagefind remains a future option if measured corpus growth makes whole-index transfer unsuitable.

References: [Fuse prebuilt indexes](https://www.fusejs.io/performance.html), [token search](https://www.fusejs.io/token-search.html), [extended matching](https://www.fusejs.io/extended-search.html), [worker API](https://www.fusejs.io/web-workers.html), [Next Pages Router navigation](https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating).

The keyword follow-up compared two independent designs; both selected metadata-only search without a mining algorithm. The judge selected the design that separates field-removal savings from display-record compaction. A bounded, joined headings field was evaluated only in benchmark tooling; it was not introduced as a runtime mode.

## Restored listing UI

The homepage's original navigation was curated: All, JVM, Java, Kotlin, Rust, DevOps, Hardware. It was distinct from the richer article/series frontmatter taxonomy. The curated labels and order are restored, while content tags keep their crawlable topic routes. Empty curated topics return an empty listing with noindex and remain outside the sitemap until content exists.

Browser regression checks cover automatic debouncing, IME composition, focus across the initial route transition, clearing, Back/Forward, leaving during a pending debounce, shared article/chapter card markup, series filtering, the absence of the added navigation item/button, and empty topic routes. Timing samples captured by the browser script use Enter to bypass the intentional debounce delay.

## Stable listing transitions

`getListingProps` marks listing pages, and `_app` gives all of them the same `PostListing` owner, including numeric ranges served by the mixed article/range route. This preserves the input, filters, and worker across pagination, topics, and search. `useListingResults` owns one committed card set: pending work retains it, a current reply replaces it atomically, and superseded replies cannot replace a newer route. This is one displayed view, not a cache of every query or page.

Static search cannot know its request query at build time. A hydration snapshot keeps its server and first client render consistent, including empty `/search`; a direct load starts with neutral, non-animated placeholders instead of unrelated archive cards. An already-open listing keeps its actual cards while search loads. Status announcements do not alter control geometry, and retry feedback is outside document flow.

Listings retain SEO head metadata and JSON-LD but have no visible static title, description, or count paragraph. App and MDX links use Next Link; lint prevents new raw JSX anchors. Inter uses Next's font loading with optional display to avoid a late font swap, and icon styles are included in initial CSS. An empty footer spacer was replaced by equivalent content padding. Detailed journey evidence is in [listing-journeys.md](listing-journeys.md).
