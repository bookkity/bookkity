# Search benchmark: homelab

All-token matching at threshold `0.3` passed all 23 relevance cases. It is the selected configuration; this report makes no before/after application-speedup claim. Exact matching misses typos, any-token matching accepts incomplete queries, and extended syntax changes the meaning of pasted punctuation.

Measured on 2026-11-20 on the NixOS homelab, Intel Core i7-8650U, four online cores (`nproc=4`), Node 24.18.0, Fuse 7.5.0, Chromium 145.0.7632.109. No Mac timings are used below. Initial load averages were `2.08, 1.05, 0.53` after build/browser work; final averages were `1.16, 1.05, 0.61`. Process inspection showed the benchmark using one CPU, with no competing high-CPU workload. Configurations and synthetic sizes alternate between rounds to limit drift.

The declared claim was to select natural-query relevance for this corpus and characterize latency, not promise flawless future ranking or a speedup. The scripts time consumed results and check expected URLs/empty results. Five runs per configuration are reported as median (minimum–maximum). Raw samples and failure cases are in [search-benchmark.csv](search-benchmark.csv).

## Matching coverage

The real corpus contains seven public posts/chapters. Cases cover title and body terms, reordered words, author-plus-topic queries, misspellings, impossible tokens, empty input, and operator-shaped punctuation. Separate fixture tests cover optional keywords, chapter navigation titles, C++/C#, diacritics, newly added content, and publication rules.

| Matcher | 0 (exact tolerance) | 0.2 | 0.3 | 0.4 | 0.6 (Fuse default tolerance) |
| --- | ---: | ---: | ---: | ---: | ---: |
| fuzzy | 13/23 | 20/23 | 22/23 | 22/23 | 18/23 |
| token-all | 21/23 | 22/23 | 23/23 | 23/23 | 20/23 |
| token-any | 20/23 | 21/23 | 21/23 | 21/23 | 20/23 |
| extended | 17/23 | 18/23 | 19/23 | 19/23 | 17/23 |

All 20 configurations used the same field weights, location-independent matching and diacritic handling. Token-all `0.4` also passes, but the stricter `0.3` passes the same cases with less fuzzy work. The default `0.6` admits false positives for deliberately nonexistent words. Structured `$and`/`$or` queries are not exposed by this free-text input; extended operator behavior was evaluated as an alternative, not enabled alongside token matching.

## Node measurements

Initialization restores the prebuilt index and constructs token statistics. Query batches contain all 23 cases, including empty/no-result cases. Collection, index generation, JSON parsing, network, and rendering are outside these timings. These are batch times, not single-query latencies.

| Corpus | Initialization ms | 23-query batch ms | JSON bytes | gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Real: 7 | 2.3 (2.2–2.6) | 130.7 (129.3–137.9) | 54,179 | 18,076 |
| Synthetic: 250 | 85.6 (80.9–86.2) | 4801.7 (4681.9–4951.9) | 1,918,563 | 590,895 |
| Synthetic: 1000 | 339.1 (329.7–364.7) | 19347.6 (18312.7–19699.1) | 7,674,725 | 2,357,188 |

The synthetic sets repeat the real documents with unique URLs; they test capacity and expected-result presence, not relevance on hundreds of independently authored posts. gzip sizes are calculated estimates, not observed CDN transfer. There were zero execution errors across the matcher runs and zero correctness failures in the scale probes; mismatched matcher rankings are counted in the relevance table.

A separate, unreported timing run profiled two passes through the 1,000-record fixture. Roughly 92% of sampled CPU time was in Fuse’s Bitap search and wrappers (`fuse.mjs` lines 402, 572 and 592 in pinned 7.5.0). This is CPU-bound text scanning on one worker/core, not a saturated request generator or disk/network bandwidth measurement. Prebuilding the field index does not remove fuzzy-search work.

## Browser path

The production build and Chromium both ran on the homelab. Timings start at form submission and end at the matching result’s DOM mutation. Fresh browser contexts alternate real and synthetic corpora over five rounds; the static shell is already loaded. Cold real queries fetch the worker/index over localhost. Synthetic JSON is fulfilled by the test harness, so its timing does not represent an Internet download.

| Path | Milliseconds, median (range) |
| --- | ---: |
| Real cold worker + `ApiSetMap` result | 68.5 (67.0–71.2) |
| Real warm worker + `quick fixes` result | 17.8 (15.2–24.2) |
| Same warm query inside browser worker only | 6.9 (6.5–8.6) |
| Synthetic 1,000-record cold worker + `ApiSetMap` result | 1143.5 (1130.0–1168.4) |

The warmed worker-only call is 38.8% of the warmed end-to-end median. It uses the actual browser worker and validates its result, but excludes message delivery and rendering; this ratio of medians is an approximate cost breakdown, not a causal speedup estimate. Node batch timings are not substituted for browser latency.

Behavior checks passed for direct URLs, client navigation, back/forward, a failed asset download and retry, superseding queries, explicit stale responses, and a different browser locale/timezone. Archives do not fetch the search corpus; successful repeated queries fetch it once; result links do not eagerly prefetch article page data. No uncaught browser errors occurred. The static search shell has no corpus in `__NEXT_DATA__`, is noindex, and uses the generated immutable asset URL.

## Practical boundary

The current asset is about 18 KB gzipped. New content needs no index registry or tuning step, and a development add/delete test confirmed automatic discovery without restarting Next. However, this design downloads the full corpus, and the 1,000-record probe has a noticeable cold start and substantially larger transfer. It is viable for this blog, not evidence of unlimited scale, mobile performance, deployed CDN behavior, or perfect future relevance. No search-function invocations are added; static hosting traffic and build work still count.

Reproduce with the commands in [search-options.md](search-options.md). The full production build, 11 unit tests, schema checks, browser tests, 32-route SEO audit and legacy route/asset/RSS audit passed on the homelab.
