# Blog search

The archive input opens `/search?q=...` after a 300 ms debounce. Enter submits immediately; IME input waits for composition to finish. Later edits replace the query through shallow routing. Back returns to the previous listing. There is no separate search button or navigation item.

Search, article listings, and topic listings share `PostListing`, cards, filters, and the curated topic bar. `getListingProps` marks listing pages so `_app` preserves their component identity across routes, including the mixed article/pagination route. `useListingResults` keeps current cards while a query is pending and commits the latest response. Request IDs reject stale replies. Direct search loads use neutral placeholders until hydration and search finish. Empty queries show the first archive page; failures expose retry.

## Index generation

`next.config.mjs` runs `buildSearchIndex` before compilation. It collects public articles and all published chapters, including chapters omitted from the home feed. Development also watches articles, series, and authors for additions, edits, and deletions. Reload an open search page after development changes because each worker holds one index snapshot. Production changes require a rebuild.

Search fields are title, tags, author handles/names, series title, chapter short title, description, and optional keywords. Missing descriptions use the first 180 characters of plain text extracted from MDX. Full bodies, code, and headings are not separate search fields. Authors need no keyword registry. Duplicate URLs fail the build.

The generator writes a content-hashed JSON file under `public/search-assets` and a manifest under `src/generated`. Both are ignored by Git. It removes obsolete generated assets. The JSON contains Fuse's serialized index and only the fields needed to render result cards. Images remain separate files.

## Browser behavior

The first nonempty search creates a custom worker. It downloads the index once and restores it with `Fuse.parseIndex`. Ordinary listings do not fetch it, and `__NEXT_DATA__` contains only the current listing props. The worker persists between listings and terminates when the listing component unmounts. An old tab spanning deployments may need a reload if its index URL is no longer available.

Content-hashed index files use one-year immutable caching. There is no search API or server work per query. Static asset transfer and builds still consume hosting resources. Next Link result links disable viewport prefetching.

Fuse 7.5.0 searches all query tokens with threshold `0.3`, ignores location and diacritics, and weights titles/tags/keywords above descriptions. Tokens can match across fields. C++ and C# keep their suffixes; punctuation does not expose extended query operators. Queries are limited to 200 characters and results to 20. Empty or punctuation-only queries yield no matches.

The whole index downloads at once. Size and CPU cost grow with content. The [historical search comparison](search-benchmark.md) records the metadata tradeoff and its synthetic-corpus limits. [Listing measurements](listing-journeys.md) cover navigation continuity.

## Checks

Run on the homelab:

```sh
node --test tests/*.test.mjs
npm run benchmark:search
CHROMIUM_EXECUTABLE=/path/to/chromium node tests/search-browser.mjs http://127.0.0.1:3320
CHROMIUM_EXECUTABLE=/path/to/chromium node tests/search-dev.mjs
```

The browser suite checks debounce, IME, focus, history, route cancellation, filters, direct loads, retry, stale replies, and index fetching. The development test adds and deletes a temporary article without restarting Next. Tests for SEO and legacy paths are listed in [seo-audit.md](seo-audit.md).

References: [Fuse prebuilt indexes](https://www.fusejs.io/performance.html), [token search](https://www.fusejs.io/token-search.html), [Next Pages navigation](https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating).
