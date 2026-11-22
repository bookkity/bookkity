# Math rendering

Display equations use the existing server-rendered KaTeX HTML and MathML. The MDX
transform wraps each display block in `MathBlock` and groups a numbered formula
separately from its tag, so operators retain their spacing and numbers cannot
overlap the formula.

Wide equations scroll at their normal font size. A 1rem opacity mask fades the ink at each edge
with hidden content, leaving the page background continuous. ResizeObserver updates the fades and keyboard focusability;
short equations add no tab stop. The fades do not intercept input or animate.
Forced-colors mode preserves the focus outline and native scrolling.

Chapter lists carry frontmatter only. Only the selected chapter's body is
serialized. Invalid TeX fails serialization with the source filename instead of
publishing KaTeX error markup.

## Font delivery

Next's build/dev configuration generates `src/generated/katex.css` from the
installed KaTeX stylesheet, preserving its license, typography, all font faces
and `font-display: block`. Only WOFF2 sources remain. Next owns font hashing,
self-hosting and immutable caching; browsers request only faces the page uses.
No font list or article metadata needs maintaining when content changes.

The small stylesheet stays globally available so client navigation has the math
styles ready. Conditional inline styles would duplicate CSS in article payloads;
font preloads chosen heuristically could download unused faces. Neither is needed
for demand loading. Removing legacy formats reduces build assets, not the WOFF2
bytes already transferred by modern browsers. Cold fonts can still briefly be
invisible under KaTeX's existing `font-display: block` policy.

## Regression checks

The WOFF2-only build was checked on the homelab with 17 unit tests, lint,
production build, clean dev startup and 15 math views. Its font inventory dropped
from 60 files (1,076,572 bytes) to 20 files (259,792 bytes). Fresh listings still
requested zero KaTeX fonts; the isolated Fourier draft still requested four faces
(53,388 bytes). Five client transitions with delayed font responses showed no
unstyled math frames. This is not a claim of zero cold-font layout movement or
faster typesetting.

Run application builds and browser checks in the test environment. In a disposable
checkout, `node tests/seed-math.mjs` creates two synthetic unpublished chapters.
After `npm run build` and `npm start`, run:

```sh
node --test tests/*.test.mjs
node tests/math-browser.mjs http://127.0.0.1:3000
```

Set `CHROMIUM_EXECUTABLE` when Chromium is supplied by the environment. Optional
`MATH_REPORT` and `MATH_SCREENSHOTS` paths save evidence. Additional chapter paths
can follow the origin argument. Never add editorial drafts to the branch for QA.

Verified on 2026-11-22 in Linux Chromium: 16 unit tests, lint with zero warnings,
SEO types, production build, and 15 math views at 320/390/768/1024/1440px. Checks
covered keyboard scrolling, start/middle/end fades, resize, numbering, MathML,
font inheritance, 200% text, RTL math direction and forced colors. Production
regressions covered 32 indexable routes, 14 navigation transitions within one
document, and 128 images. No browser page errors were recorded.

PR #33 at `d78475557e456d5c4f015d9fb8fcfef220b8bded` was tested only in the disposable
copy, with a temporary alias for its incorrect roots-of-unity image path. Its
content and that alias are not included here. Safari and screen-reader speech
were not tested.

The invalid-TeX regression initially failed with `Missing expected rejection.`
After the diagnostic gate, it passes. Existing Next.js large-page-data notices
are separate from ESLint warnings; this change does not eliminate all MDX payload
size concerns.
