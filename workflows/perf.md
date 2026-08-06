---
description: Audit bundle size, render cost, images, and runtime performance against the project's budgets, then produce a prioritized fix list. Use when asked about performance, bundle size, slowness, jank, or Core Web Vitals.
argument-hint: [route, screen, or component to focus on]
---

# Performance Audit

## Step 1 — Load the standard

Read `standards/reference/performance-web.md` or `standards/reference/performance-native.md` per the
project's platform. They carry the budgets and the platform-specific failure
modes. Auditing native code against web rules produces wrong findings.

## Step 2 — Measure before diagnosing

**Do not report a performance problem you have not measured.** Guessing produces
plausible-sounding advice that wastes effort on the wrong thing.

- **Web:** bundle analyzer output, Lighthouse on the target route, field data if
  available. Field beats lab — a fast laptop hides what users experience
- **Native:** release build on a low-end device. Dev builds and simulators hide
  almost every real problem

If you cannot run a measurement, say so explicitly and mark every finding as
**unverified** rather than presenting inference as fact.

## Step 3 — Audit

**Web:**
- Bundle vs budget; the largest chunks; duplicate copies of a library at
  different versions
- Route-level splitting; heavy components loaded eagerly that could be deferred
- Images: format, dimensions set, `srcset`, lazy-loading — and confirm the LCP
  image is **not** lazy-loaded
- Fonts: self-hosted, subset, `font-display`, preloaded
- Third-party and tag-manager scripts blocking in `<head>`
  (see `standards/reference/seo-gtm.md`)
- Unvirtualized long lists; unstable keys; layout thrash
- Reflexive memoization adding cost without benefit

**Native:**
- `map()` in a `ScrollView`; missing `keyExtractor` or `getItemLayout`; inline
  `renderItem`
- JS-thread animations that should be on the UI thread
- Inline style objects in render
- Startup work that could be deferred past first paint
- Unsized or uncached remote images
- Requests without timeouts; no offline state

## Step 4 — Report

Per finding: **`file:line`**, the measured cost (or "unverified"), why it costs
what it does, and the fix.

Order by **impact per unit of effort** — a one-line `loading="lazy"` fix that
saves 400KB outranks a refactor saving 20ms. Say which findings are measured and
which are inferred.

End with:
- Current vs budget for each metric in the standard
- Whether CI enforces the budget. If not, **that is the highest-value fix** —
  a budget nobody checks is a wish, and the next regression lands unnoticed

## Anti-patterns

❌ Reporting a problem you did not measure
❌ Recommending memoization without a profile
❌ Optimizing render cost while a 2MB image sits above the fold
❌ Profiling in dev, on a simulator, or on a fast machine only
❌ Presenting inference as measurement
