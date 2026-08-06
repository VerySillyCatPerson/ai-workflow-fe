---
description: Audit HTTP security headers in a server-rendered web app's config and output a corrected header block. Applies to Next.js, Nuxt, and Angular SSR only. Use when asked to check security headers or harden the server config.
---

# Security Headers Audit

**Requires a server that emits response headers** — Next.js, Nuxt, Angular SSR,
or a reverse proxy in front of a static build. A pure client-side SPA with no
server has nothing to configure here; a React Native app has no HTTP response at
all. In those cases say so and stop.

## Step 1 — Locate the config

Framework config (`next.config.*`, `nuxt.config.*`, server bootstrap), middleware,
and any reverse proxy or CDN config. Headers set at the edge count — check there
before reporting one as missing.

## Step 2 — Audit

| Header | Requirement |
| --- | --- |
| `Content-Security-Policy` | Restricts `script-src`, `style-src`, `img-src`, `connect-src`, `frame-ancestors`. **Missing entirely is the highest-risk finding.** |
| `Strict-Transport-Security` | `max-age` ≥ 31536000, with `includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN`, unless CSP `frame-ancestors` covers it |
| `Referrer-Policy` | `strict-origin-when-cross-origin` or stricter |
| `Permissions-Policy` | Unused features disabled |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` or `same-site` unless deliberately public |

### High-risk misconfigurations

- `script-src 'unsafe-inline'` — permits XSS via injected inline script
- `script-src 'unsafe-eval'` — permits injection through dynamic evaluation
- `default-src *` or `script-src *` — the policy is decorative
- `default-src 'self'` with no explicit `script-src` — `default-src` is only a
  fallback; set `script-src` deliberately
- HSTS under one year, or missing `includeSubDomains`
- Headers applied only to `/api/*` or asset paths while page routes go bare

### Framework-specific

- Overly broad remote image host patterns (a wildcard hostname)
- Client-exposed env vars leaking internal hostnames, service URLs, or credentials
- Dev-only relaxations (a loosened CSP for HMR) leaking into the production branch

## Output

Per header: **✅ correct / ⚠️ misconfigured / ❌ missing**, the current value, the
risk in concrete terms, and the fix.

End with an overall rating — Secure / Needs attention / Critical gaps — and a
copy-paste-ready header block for this project's config format.

If the app uses inline scripts or styles that would break under a strict CSP,
say so and describe the nonce or hash migration rather than recommending
`unsafe-inline`.
