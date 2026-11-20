# Search and homepage recommendation

Keep `/articles` and topic pagination statically generated. The homepage currently redirects to `/articles`; its controls make it an interactive archive, not a reason to render every request on the server. Its source content only changes with deployments. A future editorial homepage can also be static.

The current input filters titles/tags on the current ten-card page. It is labeled accordingly, but it is not global search. The following is a proposal, not installed search functionality.

## Smallest viable global search

Generate a versioned static JSON index of canonical URL, title, description, author handles, language and tags. Include public articles and all published chapters, even those absent from the home feed. Exclude hidden articles/unpublished chapters. Fetch the index only when search is used; keep it in browser memory across keystrokes. Normalize query tokens and rank title matches first. React should render result text without raw HTML injection.

This needs no search library or backend. It searches metadata only: text found solely in an article body will not match. Add a lazy Fuse.js dependency only if fuzzy/typo-tolerant metadata search is wanted; adding Fuse alone does not give full-text content coverage.

Caller shape:

```jsx
<form action="/search" role="search">
  <input name="q" aria-label="Search all articles" />
</form>
```

```js
// Proposed contracts, not implementation.
async function loadSearchIndex() { throw Error('not implemented') }
function searchMetadata(documents, query) { throw Error('not implemented') }
// SearchDocument: {url, title, description, authors, tags, language, type}
```

A static `/search` shell reads `q` after router readiness and computes results in the browser. Mark the shell noindex for every query, leave it out of the sitemap, and retain ordinary archive/topic navigation without JavaScript. Query strings give shareable searches; do not generate indexable pages for every query or canonicalize them to the unrelated archive. Keep loading, empty and failure states explicit.

## Full-text option: Pagefind

For searches inside long technical articles, Pagefind is the better fit. It indexes rendered HTML at build time and serves a chunked static search bundle, queried in the browser. Load it only on search interaction. No hosted search account or runtime search function is needed.

Integrate after Next emits post HTML, using an explicit public-content allowlist and canonical result URLs. Pagefind's Node API can accept `{url, content}` HTML records. Scope `data-pagefind-body` to the article region; exclude navigation, archives, profiles and drafts rather than assuming robots noindex controls Pagefind. Excerpts/highlights require safe rendering.

Verify the build order and final Vercel artifact: a successful local index in `public/pagefind` is not proof that deployment packaging includes it. Do not switch to static export, because the XML sitemap remains a response route. Verify real article-body queries, draft exclusion, published/unlisted chapters, deployed index loading and accurate canonical result URLs before shipping.

## Synthesis decision

Independent candidates compared the metadata index and Pagefind integration. The judge agreed on metadata search as the smallest default, with Pagefind selected when body coverage is required. Retained Pagefind's explicit public-content allowlist and deployment-artifact verification as requirements for either integration. Rejected always-SSR because it introduces request-time work without fresher source content here.

## Choice and quota boundary

Default for the present title/tag-style search requirement: the metadata JSON approach. If “search the blog” means full article prose, choose Pagefind directly rather than building a home-grown full-text engine. Both preserve the same static archive and separate search-page design. Always-SSR and a hosted search service add infrastructure without a requirement for live or private data here.

Neither choice adds search-function invocations per query. Neither is zero-quota hosting: static requests/transfer and build work still count. The browser downloads the whole metadata index with the first option; Pagefind loads index chunks. Actual transfer sizes and behavior need measurement on this corpus; no byte budget, speed improvement or free-plan guarantee is claimed. Existing identity requests to `api.bookkity.com` are independent and their infrastructure was not audited.

Implementation gates: search across different archive pages; direct query URL loading; body-only matches if Pagefind is chosen; stable ranking; draft exclusion; noindex; no per-keystroke server requests; published index available in deployment; safe result rendering. No search package, new search route or dynamic rendering was added during this investigation.

## Sources

- [Pagefind static search](https://pagefind.app/), [build-time execution](https://pagefind.app/docs/running-pagefind/), [Node API](https://pagefind.app/docs/node-api/), [content selection](https://pagefind.app/docs/indexing/)
- [Fuse.js fuzzy search](https://www.fusejs.io/)
- [Vercel resource accounting for static and dynamic content](https://vercel.com/docs/pricing/how-does-vercel-calculate-usage-of-resources)

## Follow-up: build-generated Fuse index with a client worker

The proposed Fuse approach fits this architecture and is the preferred refinement if fuzzy matching and worker isolation are wanted now. Build a versioned artifact containing public search records plus `Fuse.createIndex(keys, records).toJSON()`. Lazy-load a single browser Web Worker on search interaction. Inside it, fetch the artifact once and initialize normal Fuse with `Fuse.parseIndex(serializedIndex)`. Keep the exact Fuse version, key configuration and record order consistent across build and runtime. A worker script is shipped as a static asset; the browser creates its own worker instance.

The documented `FuseWorker` class takes documents/options/worker options and creates indexes for its shards in the browser. It does not document a prebuilt-index constructor argument. A small dedicated worker using standard Fuse therefore matches the build-precomputation requirement more directly than that parallel pool. Do not promise indexing speed or startup savings without measuring generated bytes and runtime behavior on this corpus.

Use Next's existing router for `/search?q=...`: normal navigation into the static search page, then shallow query updates within it. Debounced typing can replace the current URL; explicit submitted searches can push history entries. Back/forward restores the URL query and reruns local matching. Carry request IDs and discard stale results; terminate the worker when its owner unmounts. No second router, hash routes, SSR per query or search API is required.

Prebuilding does not eliminate data transfer or runtime search CPU. Ship records plus index together to prevent stale-version mismatches; the index contains searchable values and is not encryption. Full article-body search is possible by indexing cleaned text, but it increases the corpus delivered to the browser. Metadata-only search remains smaller in scope; Pagefind remains an alternative if a larger prose corpus calls for a chunked search bundle.

References: [Fuse prebuilt indexes](https://www.fusejs.io/performance.html), [current Fuse worker API](https://www.fusejs.io/web-workers.html), [Next Pages Router shallow navigation](https://nextjs.org/docs/pages/building-your-application/routing/linking-and-navigating). The supplied npmx URL could not be retrieved by the web tool; API details were verified against upstream documentation instead. No Fuse dependency or search implementation has been installed in this PR yet.
