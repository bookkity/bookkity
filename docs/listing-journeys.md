# Listing navigation continuity

Measured on 2026-11-20 on the NixOS homelab. All builds, tests, and browser measurements ran there; the Mac only edited source and processed reports.

## Outcome

All 580 samples completed with correct destinations and no HTTP/page errors: 29 journeys × two viewports × five alternating baseline/candidate rounds. Each side has 270 in-app transitions and 20 deliberate direct loads. The direct loads are excluded from the unwanted document-reload count.

| Observation across 290 samples per side | Before | After |
| --- | ---: | ---: |
| Unwanted document reloads | 150 | 0 |
| Transient empty-card frames | 423 | 0 |
| Journeys containing transient empty cards | 57 | 0 |
| Wrong archive frames during direct search | 50 | 0 |
| Search-form node replacements | 180 | 0 |
| Header/control/footer layout-shift events | 332 | 0 |
| Maximum search-control vertical movement (px) | 96 | 0 |

Candidate gates also checked horizontal movement/width (at most 0.5 px), focus after typing, exact listing destination records, current search results, and complete sample coverage. All passed. No arbitrary timeout, opacity fade, or route cache conceals transitions.

This is **not a claim of zero CLS or zero compositor flashes on every device**. The probe samples DOM state at animation frames and streams it across document changes. Layout-shift entries include recent input; their sums are not CLS session-window scores. The candidate's remaining entries were cards moving to their new positions on category changes (three journey types, raw sums 0.40143 desktop / 0.41776 mobile). Controls stayed fixed. Different results necessarily change content and page height; deliberate scrolling is separate from document-relative control movement. Direct cold search still needs to load its worker/index and shows neutral placeholders until ready.

## Root causes and changes

- Raw anchors caused full document loads. All app JSX links and the MDX anchor renderer now use Next Link, including hash and external links. A lint rule prevents raw JSX anchors from returning. External destinations still leave the app normally.
- The mixed article/range route introduced a different component owner. The shared listing data producer now marks listing pages; `_app` preserves the same `PostListing` owner across articles, ranges, topics, and search.
- The previous search hook cleared records when a query changed. One committed-view presenter now retains current records while pending, then commits a current response atomically. Request IDs and route keys reject superseded responses; settled empty results remain distinct from never-loaded results.
- Static search initially rendered unrelated archive cards. A hydration snapshot gives server and first client render the same neutral initial state, including empty `/search`.
- Visible listing headings, descriptions, counts, and loading/error paragraphs moved controls or cards. Listings now match the production hierarchy: search, existing filters/topics, cards, pagination. Head metadata and JSON-LD remain. Announcements are visually hidden; retry feedback sits outside layout flow.
- Late icon CSS and a swapping Inter font moved initial content. FontAwesome styles are in initial CSS, and Next's built-in font loader self-hosts Inter with optional display. Existing empty footer space is content padding, so it cannot move a footer box into view.
- Stable URL card identity avoids replacing a retained card's subtree solely because its result rank changed.

The design comparison selected the shared listing owner and single committed view (24/25 versus 22/25); independent judgment agreed. The alternative contributed the non-animated initial placeholder. No general routing framework, server search, or new dependency was introduced.

## Environment and method

- Baseline: `3d2f1287e9decd5ebf710842fbc273889f6f035c`.
- Candidate: `2535df66709e6cb681a8ebeb8ffdd0c95248617e`; subsequent report-only commit does not change the measured implementation.
- Intel Core i7-8650U, four online cores, NixOS x86_64, Node 24.18.0, Chromium 145.0.7632.109, Playwright 1.64.1; separate Next production builds on loopback ports 3318 and 3316.
- Desktop 1280×800 and mobile viewport 390×844. Mobile is emulation, not a physical device. Identity API responses are mocked; search uses the actual local worker/index.
- Identical 24 temporary Java articles provide three listing pages and topic pagination, alongside real content (31 searchable records total). Fixtures exist only in disposable remote copies, never in production content. Candidate source parity checked 89 files with no differences.
- Baseline/candidate order alternates each round. Initial load averages: 1.01 / 0.90 / 0.65; final: 2.64 / 1.96 / 1.20. No concurrent build or benchmark ran during this comparison.
- Each journey starts from its required setup after fonts settle. `readyMs` ends when target content is verified; observation continues for another 100 ms. Direct loads include startup. Typing includes the intentional 300 ms debounce. Delayed-route and cold-index cases add 200 ms deliberately.
- Timings include browser automation/actionability and are localhost journey durations, not WAN latency, worker-only search time, or a substitute for the separate 1,000-record search benchmark.

[Raw scalar samples](listing-journeys.csv) contain all 580 runs, including null metrics where continuity is inapplicable. Frame/event details were retained in the homelab's `/tmp/bookkity-journeys-final.json`; that temporary file is not a durable repository artifact. The committed harness regenerates them.

## Every measured journey

Times below are median [minimum–maximum] milliseconds over five runs. Each row passed target-content verification on both sides; all candidate continuity gates passed.

| Journey | Viewport | Before, ms | After, ms |
| --- | --- | ---: | ---: |
| listing → page 2 | desktop | 410 [371–468] | 187 [178–270] |
| listing → page 2 | mobile | 380 [237–454] | 179 [172–183] |
| page 2 → page 3 | desktop | 431 [291–457] | 164 [158–186] |
| page 2 → page 3 | mobile | 275 [230–413] | 116 [75–172] |
| page 3 → page 2 | desktop | 450 [436–495] | 163 [154–190] |
| page 3 → page 2 | mobile | 328 [249–451] | 151 [107–178] |
| page 2 → listing | desktop | 436 [291–490] | 179 [167–202] |
| page 2 → listing | mobile | 425 [348–505] | 180 [166–197] |
| listing → search | desktop | 558 [499–582] | 478 [456–594] |
| listing → search | mobile | 508 [495–552] | 460 [448–470] |
| search → listing | desktop | 315 [299–343] | 115 [88–147] |
| search → listing | mobile | 288 [279–374] | 115 [70–121] |
| page 2 → search | desktop | 470 [431–489] | 473 [471–494] |
| page 2 → search | mobile | 474 [416–485] | 468 [461–479] |
| search → page 2 (Back) | desktop | 73 [38–111] | 72 [51–130] |
| search → page 2 (Back) | mobile | 74 [69–157] | 67 [54–108] |
| page 2 → search (Forward) | desktop | 205 [130–224] | 87 [46–89] |
| page 2 → search (Forward) | mobile | 125 [113–208] | 71 [49–103] |
| search → updated search | desktop | 364 [329–372] | 355 [351–430] |
| search → updated search | mobile | 365 [356–367] | 354 [352–361] |
| search → no results | desktop | 343 [335–348] | 342 [329–363] |
| search → no results | mobile | 339 [334–348] | 336 [333–342] |
| no results → search results | desktop | 357 [345–364] | 354 [351–365] |
| no results → search results | mobile | 358 [330–360] | 356 [352–360] |
| search → cleared listing | desktop | 363 [359–367] | 364 [355–368] |
| search → cleared listing | mobile | 364 [360–370] | 365 [364–371] |
| listing → empty topic | desktop | 360 [314–414] | 171 [161–183] |
| listing → empty topic | mobile | 293 [244–340] | 168 [159–170] |
| empty topic → listing | desktop | 413 [397–419] | 204 [172–227] |
| empty topic → listing | mobile | 404 [293–504] | 202 [89–212] |
| pending query → topic navigation | desktop | 798 [750–914] | 552 [496–569] |
| pending query → topic navigation | mobile | 858 [687–903] | 558 [540–562] |
| pending query → page navigation | desktop | 805 [772–909] | 668 [654–749] |
| pending query → page navigation | mobile | 805 [643–849] | 694 [596–761] |
| listing → topic | desktop | 377 [362–391] | 205 [93–244] |
| listing → topic | mobile | 381 [356–611] | 228 [207–238] |
| topic → topic page 2 | desktop | 438 [371–448] | 201 [179–210] |
| topic → topic page 2 | mobile | 444 [402–466] | 177 [168–275] |
| topic page 2 → topic | desktop | 465 [415–502] | 155 [104–182] |
| topic page 2 → topic | mobile | 449 [413–474] | 170 [154–180] |
| topic → search | desktop | 573 [547–756] | 445 [427–579] |
| topic → search | mobile | 536 [474–554] | 462 [444–569] |
| search → topic | desktop | 329 [275–404] | 114 [94–157] |
| search → topic | mobile | 368 [254–386] | 109 [95–162] |
| topic → listing | desktop | 490 [481–492] | 141 [133–156] |
| topic → listing | mobile | 458 [336–483] | 138 [70–147] |
| search → rapid Back/Forward | desktop | 27 [23–49] | 57 [53–80] |
| search → rapid Back/Forward | mobile | 33 [32–75] | 55 [54–138] |
| listing → delayed page 2 | desktop | 590 [562–640] | 489 [452–508] |
| listing → delayed page 2 | mobile | 575 [468–598] | 486 [443–529] |
| direct search load | desktop | 431 [407–494] | 277 [276–299] |
| direct search load | mobile | 415 [410–577] | 279 [276–286] |
| direct empty search load | desktop | 351 [343–432] | 239 [235–257] |
| direct empty search load | mobile | 351 [325–409] | 237 [234–247] |
| listing → delayed cold search | desktop | 703 [695–731] | 692 [667–721] |
| listing → delayed cold search | mobile | 698 [674–724] | 701 [683–730] |
| search error → retry | desktop | 145 [131–156] | 175 [154–181] |
| search error → retry | mobile | 143 [126–147] | 153 [125–174] |

A separate, untimed screenshot check captured desktop and mobile listing, pending search (with a 1.5-second index delay), and ready results. The inspected pending screenshots retain the existing cards and control positions; the ready screenshots replace only the result set. These spot checks supplement the DOM measurements, rather than prove every compositor frame.

## Regression checks

The seeded production copy passed the existing search browser suite (debounce, IME, focus, history, leaving during pending input, filters, retry, real/synthetic worker cases), SEO checks for 60 indexable routes, and a 14-destination navigation traversal with one initial document load and no page errors. That traversal includes article and MDX hash links, author links, topics, series chapters, projects, merch, and About.

The final unseeded production build also passed: 12 unit tests, schema type checking, lint (0 errors; 22 existing warnings), 32 indexable routes, seven permanent legacy mappings with query preservation, 18 unchanged routes, 67 byte-identical assets, slash aliases, and RSS identity checks. The same 14-destination browser traversal passed on unseeded content. The development watcher added and removed searchable content without a server restart.

## Reproduction

On the homelab, prepare two isolated copies at the recorded revisions with dependencies installed. In each copy, run `node tests/seed-listing-journeys.mjs /absolute/path/to/that/copy` from outside that directory, then build and start separate production servers. The baseline copy needs the candidate's measurement scripts, without modifying its app source. Do not run competing builds during measurement.

```sh
CHROMIUM_EXECUTABLE=/path/to/chromium \
BASELINE_SHA=3d2f1287e9decd5ebf710842fbc273889f6f035c \
CANDIDATE_SHA=2535df66709e6cb681a8ebeb8ffdd0c95248617e \
JOURNEY_OUTPUT=/tmp/bookkity-journeys.json \
node tests/listing-journeys.mjs http://127.0.0.1:3318 http://127.0.0.1:3316 5
```

The script exits unsuccessfully for missing samples, incorrect destinations, HTTP/page errors, or failed candidate continuity gates. `node tests/navigation-browser.mjs <origin>` separately checks app-link document continuity. Existing SEO, legacy-route, search, and development-index tests cover behavior beyond the listing journey matrix.
