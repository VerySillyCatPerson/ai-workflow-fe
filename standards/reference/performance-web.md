# Performance: Web

Read before optimization work, or when a bundle or render budget is at risk.

**Measure first.** Optimization without a measurement is guessing, and reflexive
memoization usually costs more than it saves. Profile, find the actual cost, then
fix that.

## Budgets

Enforce in CI, not by intention. A budget nobody checks is a wish.

| Metric | Budget |
| --- | --- |
| LCP | < 2.5s (p75, field data) |
| INP | < 200ms (p75) |
| CLS | < 0.1 (p75) |
| TTFB | < 800ms |
| Initial JS, gzipped | < 170KB |
| Any single route chunk | < 100KB |

Field data (real users) over lab data. Lab numbers on a fast machine hide what
users on a mid-range phone experience.

## JavaScript

- **Route-level code splitting by default.** A user on one page should not
  download the whole app
- Lazy-load anything below the fold or behind interaction: modals, editors,
  charts, date pickers
- Audit before adding a dependency: check its size and whether it tree-shakes.
  A 40KB date library for one `format()` call is a bad trade
- Prefer platform APIs — `Intl`, `URL`, `structuredClone` — over a package
- Run a bundle analyzer when size moves. Duplicate copies of the same library at
  different versions are common and invisible without one

## Rendering

- Measure before memoizing. Reflexive `memo`/`useMemo`/`useCallback` adds
  complexity and its own cost
- Virtualize long lists
- Stable keys from data identity — never an array index for reorderable lists
- Keep state as local as possible; a store update re-renders every subscriber
- Debounce expensive handlers (search, resize, scroll); throttle scroll listeners
- Avoid layout thrash: batch reads before writes

## Images and media

Usually the largest payload on the page, and the easiest win.

- Modern formats (AVIF, WebP) with fallback
- Correct dimensions with `srcset` — never ship a 2000px image into a 300px slot
- **Always set `width` and `height`** (or an aspect ratio box). Missing dimensions
  are the most common cause of CLS
- `loading="lazy"` below the fold; eagerly load the LCP image and preload it
- Never lazy-load the LCP image — it directly delays your worst metric
- Self-host fonts, subset them, `font-display: swap`, preload the critical one

## Network

- Preconnect to critical third-party origins
- Prefetch the likely next route on intent (hover, viewport)
- Compression on (Brotli), immutable cache headers on hashed assets
- Audit third-party scripts — analytics and tag managers are frequently the
  largest blocking cost on a page. See `reference/seo-gtm.md`

## Server rendering

- Stream where the framework supports it; do not block the shell on slow data
- Keep the client bundle small — server-render what does not need interactivity
- Cache at the edge where the data allows

## CI

- Bundle size check that **fails** the build over budget
- Lighthouse CI on key routes
- Track the trend. A 3KB regression per PR is invisible per-PR and fatal per-quarter

## Avoid

- Optimizing without a profile
- Memoizing everything by default
- Importing a whole library for one function
- Blocking third-party scripts in `<head>`
- Images with no dimensions
- Lazy-loading above-the-fold content
- Measuring only on a fast laptop on fast wifi
