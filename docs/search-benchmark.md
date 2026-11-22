# Metadata search benchmark: homelab

These measurements describe schema v2 at `e3c024e`, before the listing-UI restoration. Schema v3 keeps the same searchable fields and matcher but replaces result display records with article-card metadata. The figures below are retained as historical measurements, not asserted as current payload sizes or browser timings.

Metadata-only search is substantially smaller and faster on the tested corpus. It preserves all 21 metadata-query expectations and intentionally loses two historical code-only queries. The improvement comes from searching a narrower set of fields; full-text coverage is no longer promised.

Both actual production builds ran on the NixOS homelab: Intel Core i7-8650U, four online cores, Node 24.18.0, Fuse 7.5.0, Chromium 145.0.7632.109. The preserved full-body implementation is `12da8c7`. No Mac measurements are used. Five alternating runs per side use identical documents, query order and matching options; results are consumed and validated. Initial/final load averages were `0.7, 0.46, 0.37` / `0.95, 0.62, 0.45`; process snapshots showed one benchmark CPU and no competing high-CPU workload.

## Browser results at 1,000 records

Milliseconds, median (minimum–maximum). Both sides use the same queries: cold `api sets`, then warm `quick fixes`. The search shell is already loaded; timing ends at the matching result DOM update. Synthetic JSON is supplied by the harness, so these timings exclude realistic Internet transfer. They include the actual bundled worker and Next/React result path.

| Measurement | Full bodies | Metadata only |
| --- | ---: | ---: |
| Cold worker + first result | 1113.8 (1087.1–1129.5) | 139.9 (135.7–158.5) |
| Warm subsequent result | 659.6 (650.8–673.1) | 51.2 (49.5–64.4) |
| Repeated warm query inside worker only | 619.2 (605.7–658.0) | 41.9 (41.7–45.4) |

The paired medians improve by 8.0× cold and 12.9× warm. The warmed worker-only call is 81.8% of the metadata warm end-to-end median. It repeats the query and benefits from Fuse's last-searcher cache; it excludes message delivery/rendering, so this ratio is an approximate cost breakdown, not an exact causal attribution.

## Asset sizes

| Representation | Records | Raw JSON bytes | Calculated gzip bytes |
| --- | ---: | ---: | ---: |
| fullBody | 7 | 54,179 | 18,076 |
| metadata | 7 | 5,958 | 1,508 |
| metadataHeadings | 7 | 6,737 | 1,815 |
| fullBody | 1,000 | 7,679,725 | 2,357,172 |
| metadata | 1,000 | 796,912 | 13,168 |
| metadataHeadings | 1,000 | 898,853 | 16,524 |

**Compression caveat:** the 1,000-record fixture repeats seven real documents with unique URLs. Repeated metadata compresses exceptionally well; its 13,168-byte gzip result is not an estimate for 1,000 distinct articles. Raw size is the safer comparison for this fixture. The actual seven-document production asset is 5,958 bytes raw / 1,508 bytes calculated gzip. Deployed CDN encoding and Internet latency were not measured.

At 1,000 records, removing only the body field while preserving old display records produces 885,337 raw bytes. Projecting only URL/title/description/authors/series saves another 88,425 bytes, reaching 796,912. The combined raw reduction is 89.6%; most of it comes from excluding bodies, not display compaction.

## CPU work and headings alternative

Node initialization restores the index and builds token statistics. The batch contains the same 21 metadata cases, including empty/no-result cases. It excludes collection, serialization, JSON parsing, network and UI; these are batch times, not per-query browser percentiles.

| Representation, 1,000 records | Initialization ms | 21-query batch ms |
| --- | ---: | ---: |
| fullBody | 341.3 (332.2–366.7) | 18089.0 (17128.2–18136.0) |
| metadata | 16.4 (16.1–17.5) | 1030.9 (1015.3–1057.0) |
| metadataHeadings | 21.4 (21.0–23.1) | 1317.7 (1292.5–1328.5) |

The optional headings candidate adds a deduplicated, joined heading field capped at 1,024 characters, at weight 1. It costs 12.8% more raw bytes and 27.8% more batch CPU time than metadata alone. A separate coverage probe confirms that it recovers `immutable objects`, a Java section-title query missed by metadata. It does not recover `ApiSetMap`. Headings are therefore a credible future scope extension, but are left out of the requested minimal metadata index. The headings candidate was measured in Node only, not as a shipped browser variant.

A separate, unreported timing run profiled five passes through the 1,000-record metadata fixture. About 84% of sampled CPU remained in Fuse Bitap search/wrappers (pinned `fuse.mjs` lines 402, 572 and 592). Scanning still uses one worker/core; there is simply far less text to scan. The large timing gaps exceed the run-to-run ranges. No disk/network-throughput claim is derived from the CPU benchmark.

## Coverage and behavior

- All three representations pass the 21 metadata expectations. At 1,000 records, each timed variant consumed 1,600 result records with zero correctness failures over five runs.
- The historical 23-case suite is retained. Full bodies pass 23/23; metadata and metadata+headings pass 21/23. Lost cases are `ApiSetMap` and `^ApiSetMap`, whose identifier occurs only in code/body text.
- `windows loader` remains covered by tags; `pure functions` remains covered by the description excerpt. No metadata was edited to rescue benchmark queries.
- Fixture tests verify explicit description, tags, authors, optional keywords, chapter short title, series, Unicode/diacritics, and automatic new-content discovery. A deep-body/code/heading fixture is intentionally absent from the metadata asset.
- The homelab production build, all 11 unit tests, schema checking and lint passed (zero errors / 26 existing warnings). Development add/delete discovery, browser history/direct URLs/retry/stale responses, lazy one-time fetching and disabled result prefetch passed. No uncaught browser errors occurred.
- SEO checks passed for 32 indexable routes; legacy checks retained seven redirects, 18 routes, 67 byte-identical assets and RSS identities. Tested source/content parity is checked before delivery.

## Reproduction and evidence

Run `node scripts/benchmark-search-representations.mjs /path/to/full-body-checkout` with the baseline at `12da8c7` and its dependencies installed. Add `--coverage-only` for the separate heading probe. For paired browser runs, start both production builds on separate loopback ports and set `SEARCH_BASELINE_ROOT`, `SEARCH_BASELINE_ORIGIN` and, if needed, `CHROMIUM_EXECUTABLE` before invoking `tests/search-browser.mjs` against the metadata origin.

Raw five-run samples: [search-benchmark.csv](search-benchmark.csv). The superseded full-body report remains in Git history at `1fc6ea6`. [Implementation and download lifecycle](search-options.md). New content requires normal builds, not a maintained keyword registry; metadata size can still grow with authored descriptions/tags/keywords, and mobile or distinct 1,000-article performance is not established by this repeated fixture.
