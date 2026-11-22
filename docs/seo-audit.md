# Blog routes and SEO

Bookkity uses the Next.js Pages Router. Local article, series, and author files supply static page content. Search runs in a browser worker, described in [search-options.md](search-options.md).

## Routes

| Route | Behavior |
| --- | --- |
| `/` and `/article` | Permanent redirect to `/articles` |
| `/article/<slug>` | Permanent redirect to `/articles/<slug>` |
| `/articles` | First ten article and listed-chapter previews |
| `/articles/10-20` | Next ten previews, with aligned ranges thereafter |
| `/tag/<slug>` | First page of articles and published chapters with that tag |
| `/tag/<slug>/10-20` | Paginated topic listing |
| Listing paths ending in `/0-10` | Permanent redirect to the base listing |
| `/articles/<slug>` | Article detail |
| `/<author>` | Author profile and content links |
| `/series/<slug>/<order>` | Chapter detail |
| `/search?q=...` | Static search page, noindex |

Malformed ranges, unknown tags, and out-of-range pages return 404. Redirects preserve query strings. Legacy home tag fragments migrate in the browser because fragments never reach the server. Article image URLs still use `/article/...`; the redirect does not move nested assets. RSS retains old item GUIDs to avoid republishing existing entries.

The topic bar keeps the original All, JVM, Java, Kotlin, Rust, DevOps, and Hardware choices. Content tags can add other collections. Empty curated topics show an empty listing with noindex and stay outside the sitemap.

## Publication and metadata

Article slugs starting with `_` and unpublished chapters remain reachable with noindex. They stay outside the sitemap and search index. Published chapters can be absent from the home feed when `listed` is false, but remain in search, author pages, and relevant topic collections.

`Seo` owns canonical, social, robots, and JSON-LD tags. `src/helpers/seo.js` builds schema-dts-checked graphs. Stable IDs connect the organization (`/#organization`), website (`/#website`), author (`/<handle>#person`), and page (`#webpage`, `#article`, or `#list`). These fragments identify schema entities, not client routes. JSON-LD escapes `<` before insertion into a script element.

Listings have no visible static title or description. Their head metadata and collection schema remain. Vercel preview responses retain noindex headers and meta tags. Dates come from content; the graph does not invent modification dates, ratings, offers, or author identities.

## Sitemap

`src/pages/sitemap.xml.js` sends XML through `getServerSideProps`. `sitemapPaths` shares publication and pagination rules with the pages. XML values use entity escaping. `robots.txt` advertises the production sitemap.

The response uses `application/xml; charset=utf-8` and `public, max-age=0, s-maxage=43200, stale-while-revalidate=60`. A compatible shared cache keeps it fresh for 12 hours and refreshes on demand with a 60-second stale allowance. Bare `next start` regenerates it per request. This is HTTP caching, not HTML ISR or a scheduled refresh. Content updates still require a deployment.

## Images

`ContentImage` uses Next Image with optimization disabled, retaining public asset URLs. The build reads image dimensions with Sharp and generates `src/generated/image-sizes.json`. Development refreshes it when public assets change. Markdown images and literal MDX image tags share this component; percentage widths remain CSS widths. External images need explicit dimensions.

Images show a shared animated SVG data URL while pending. `blurDataURL` supplies the default placeholder, passed directly to Next's data-URL placeholder mode so a second blur filter does not obscure the shimmer. The page stylesheet replaces it with a static gradient for reduced motion. A source change resets Next's loading state. Intrinsic aspect ratios reserve image space, including percentage-width MDX images; numeric width overrides scale the corresponding height.

`tests/image-layout-browser.mjs` blocks image responses until fonts and hydration settle, then samples image/text boxes each animation frame while releasing the images. The homelab production run on 2026-11-22 covered all 37 non-search static pages at 1280×844 and 390×844, with 280 pending image loads. It recorded zero box movement, layout-shift entries, or errors. The pre-shimmer branch also passed this isolated image-load check, so it did not reproduce the reported shifts. This is one deterministic pass per viewport, not a whole-page CLS score or a guarantee across browsers, fonts, and network conditions.

`tests/image-placeholder-browser.mjs` verifies animation with pixel comparisons, reduced motion, placeholder removal, cold gallery changes, and failed-image sizing. `tests/images-browser.mjs` checks image loading, dimensions, MDX proportions, popup persistence, and absence of optimizer requests. Search remains covered by the search browser suite. Run the scripts against a production server on the homelab with `CHROMIUM_EXECUTABLE` set. `npm run lint` rejects warnings.

## Verification

Run these against a production build on the homelab:

```sh
node --test tests/*.test.mjs
npm run check:seo
node tests/seo-http.mjs http://127.0.0.1:3320
node tests/legacy-routes-http.mjs http://127.0.0.1:3320
```

The HTTP suites check generated metadata, sitemap headers, publication rules, pagination, redirects, old routes, asset bytes, and RSS identities. [Listing journey measurements](listing-journeys.md) cover browser transitions.

Deployed CDN caching and Google indexing need deployment checks. The document language remains `en`; translated content would need a separate language solution. Existing large MDX page-data warnings remain.

References: [Next XML sitemaps](https://nextjs.org/learn/seo/xml-sitemaps), [Pages response caching](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props), [Google article schema](https://developers.google.com/search/docs/appearance/structured-data/article), [schema-dts](https://github.com/google/schema-dts).
