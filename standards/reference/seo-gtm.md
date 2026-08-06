# SEO & Tag Management

Read before touching metadata, sharing previews, structured data, or tracking tags.
Web only.

## Metadata

Every indexable route needs unique metadata. Generate it from route data, never
hardcode it per page.

| Tag | Rule |
| --- | --- |
| `<title>` | Unique per page, 50–60 chars, specific first |
| `description` | Unique, 140–160 chars, written for a human |
| `<link rel="canonical">` | Absolute URL. Required anywhere query params vary |
| `robots` | `noindex` on staging, search results, and auth-gated pages |
| `hreflang` | Every locale variant, including `x-default` |

**Localized sites:** metadata is translated too. An English `<title>` on a Polish
page is a common and costly miss.

## Social previews

Open Graph and Twitter cards on anything shareable: `og:title`, `og:description`,
`og:image` (1200×630, absolute URL), `og:type`, `og:url`, `twitter:card`.

A missing `og:image` makes every share look broken. Verify with the platforms'
own debuggers — they cache aggressively, so test before launch, not after.

## Structured data

JSON-LD for content with a schema.org type: Article, Product, BreadcrumbList,
Organization, FAQ. Generate it from the same data that renders the page, so the
two cannot disagree — describing content that is not on the page is a manual-action risk.

Validate with the Rich Results test.

## Rendering and crawlability

- Content that should rank must be in the server-rendered HTML. Client-only
  content is crawled unreliably at best
- Real `<a href>` for navigation. A `div` with an onClick is invisible to crawlers
  — and to keyboard users, per `platform/web.md`
- Semantic headings in order, one `<h1>` per page
- `sitemap.xml` generated from routes, `robots.txt` correct per environment
- 301 for permanent moves; never chain redirects
- Descriptive URLs, no ids where a slug works
- Descriptive `alt` on content images — it serves screen readers and image search

**Core Web Vitals are a ranking factor.** `reference/performance-web.md` is part
of SEO, not adjacent to it.

## Tag management (GTM)

Tag managers are the most common way a well-optimized site becomes slow, because
they let non-engineers add scripts that bypass review.

- **Load GTM after interactive**, never blocking in `<head>`
- Audit what tags are live quarterly. Containers accumulate tags nobody owns
- Budget the container — it competes with your own JS for the main thread
- Never let a tag inject layout-shifting content
- CSP: prefer nonces over `unsafe-inline`. A tag manager is not a reason to open
  your CSP; see the security-headers workflow

### dataLayer

```ts
export function pushEvent(event: DataLayerEvent): void {
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
}
```

- **Typed events, defined in one module** — same discipline as
  `reference/observability.md`. Never a bare `dataLayer.push({...})` in a component
- Initialize `dataLayer` before the GTM snippet or the first events are lost
- SPA route changes must push a page-view event; GTM does not detect them
- Never push PII into `dataLayer` — it is readable by every tag in the container,
  including third-party ones you do not control

### Consent

- **No non-essential tag fires before consent.** GTM's consent mode, wired to the
  real consent state — not a cosmetic banner
- Consent choice persists and is revocable
- Verify what actually fires pre-consent, in the network tab. Assume nothing;
  this is the part that draws regulatory fines

## Avoid

- Duplicate titles and descriptions across routes
- Untranslated metadata on localized pages
- Client-only rendering of content meant to rank
- `div` navigation
- Blocking tag manager loads in `<head>`
- Untyped `dataLayer.push` at call sites
- PII in `dataLayer` or tag variables
- Tags firing before consent
- Structured data describing content not on the page
