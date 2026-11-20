# Dependency audit — 2026-11-20

All tracked dependency manifests were inventoried: `package.json` and `package-lock.json` are the project's only package manifest and lockfile. The OSV audit includes every locked production, development, nested and optional-platform npm package, including packages not installed on this host. No severity or reachability exclusions were applied.

The application and dependency lifecycle scripts were not run before updating the dependency graph. The original lockfile was scanned as data. Resolution and installation used `--ignore-scripts`. Application validation started only after the updated lockfile passed OSV.

## Findings and remediation

The original graph contained 449 distinct package/version pairs in 510 locations. OSV reported three advisories on Next.js 15.5.28:

- [GHSA-7qx7-33qx-rqx2](https://osv.dev/vulnerability/GHSA-7qx7-33qx-rqx2): SVG rejection bypass in image optimization.
- [GHSA-f3mh-rxg3-f5g2](https://osv.dev/vulnerability/GHSA-f3mh-rxg3-f5g2): HttpOnly cookie exposure through an internal Edge runtime response header.
- [GHSA-pc58-hwjq-p385](https://osv.dev/vulnerability/GHSA-pc58-hwjq-p385): cross-client response injection and disclosure when forwarding fetched responses.

All three are fixed by Next.js 16.4.6. The final graph has 714 distinct package/version pairs in 732 locations, with **zero OSV findings** and **zero npm audit vulnerabilities**. Raw reports include query timestamps and the SHA-256 of the scanned lockfile. OSV API errors fail the audit; paginated results are followed.

Every original direct dependency was advanced to its npm `latest` release where a newer release existed. Transitive dependencies were refreshed to the newest versions allowed by their parents; older transitive majors are not blindly overridden. PostCSS and KaTeX overrides retain patched versions. KaTeX CSS/fonts are now bundled from the audited npm dependency instead of fetched from a CDN.

ESLint was added to preserve `npm run lint` after Next 16 removed `next lint`. ESLint 9.39.5 is the compatibility exception: the current Next lint plugins do not declare ESLint 10 support. npm marks ESLint 9 unsupported; OSV and npm currently report no vulnerability for it. Upgrade it when those plugins support ESLint 10. Existing source patterns are reported as warnings by four explicitly configured rules, avoiding unrelated behavior changes in this upgrade.

## Compatibility and verification

- Pages Router and existing `getStaticProps`/`getStaticPaths` remain in place; no App Router migration.
- Next 16, React 19, Font Awesome 7, Tailwind 4 and matching tailwind-merge upgrades.
- Tailwind's PostCSS plugin, CSS imports/references, legacy theme configuration, container sizing, renamed utilities and font layering were adapted.
- Production build passed: 26 generated pages, including all MDX articles and series chapters. Existing large-page-data warnings remain.
- Browser checks passed on all 24 content routes: HTTP 200 and no page exceptions or hydration errors. Verified MDX tab selection, Hangul composition/backspace, popup dismissal/persistence, and merch overflow at 390px and 1440px. External requests were blocked to avoid analytics writes; remote identity-service behavior and remote font availability were not tested.
- `npm ls --all` passed without invalid peers.
- `npm run lint` passed with 28 warnings on existing source patterns.
- `git diff --check` passed.

Runtime requires Node >=20.9. Tailwind 4 requires Safari 16.4+, Chrome 111+, Firefox 128+; support for older browsers is not preserved. Browser checks do not prove pixel-identical rendering or every possible interaction, and no pre-upgrade application execution was performed.

## Repeat

```sh
npm ci --ignore-scripts
npm run audit:osv
npm audit
npm run lint
npm run build
```

The OSV script requires Python 3 and network access to `api.osv.dev`, uses the documented [batch query API](https://google.github.io/osv.dev/post-v1-querybatch/), and exits nonzero on findings or request failures.

Browser validation uses `scripts/check-browser.cjs`, a separately installed `playwright-core`, and Chromium. Start the production app on `127.0.0.1:3417`, set `NODE_PATH` to the test driver's `node_modules` and `CHROMIUM_PATH` to Chromium, then run the script. The driver is test tooling, not an application dependency.

This is a timestamped audit of this repository's npm graph against disclosed OSV/npm records. It does not attest to a deployment, host OS, or advisories absent from those databases.
