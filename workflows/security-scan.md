---
name: security-scan
description: Scan frontend source for security vulnerabilities — injection sinks, secrets in client code, insecure storage, server/client boundary leaks, unsafe navigation, and vulnerable dependencies. Use when asked to run a security audit, scan for vulnerabilities or secrets, or review code before a security-sensitive release.
---

# Frontend Security Scan

## Step 0 — Determine the platform

The threat models differ fundamentally. Read the platform standard imported by
the project's agent instruction file, or infer from the source.

- **Web:** the attacker controls the browser and can inject script into the page
- **Native:** the attacker has the **binary**, can extract anything in the bundle,
  and can read app storage on a rooted or jailbroken device

Report all findings per category — do not stop at the first.

---

## Web

**Injection sinks**
- `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]` — flag every instance and
  trace whether the value is user-controlled
- `eval()`, `new Function()`, string-form `setTimeout`/`setInterval`
- Direct `innerHTML =` or `document.write()`
- User values interpolated into HTML strings

**Secrets in client code**
- Hardcoded keys, tokens, passwords, connection strings
- Public env vars whose names contain `KEY`, `SECRET`, `TOKEN`, `PASSWORD`,
  `AUTH`, or `PRIVATE` — everything client-visible is public by definition
- Credentials passed into client components via props or context

**Storage**
- Auth tokens in `localStorage`/`sessionStorage` — script-readable
- Personal data in web storage
- Tokens in non-`httpOnly` cookies set via `document.cookie`

**Server/client boundary**
- `'use client'` files importing server-only modules, DB clients, or `fs`
- Sensitive fields serialized into client props — passwords, internal ids, full
  user records. These land in the page payload and are readable
- Sensitive objects logged to the console

**Navigation**
- User values in `href`, `src`, `iframe`, or a redirect without scheme validation
- `target="_blank"` on URLs carrying sensitive query parameters

---

## Native

**Bundle extraction** — the highest-value finding class
- Any API key, secret, credential, or signing material present in JS, in native
  config, or injected at build time. **All of it is extractable from the binary**
- Endpoints or internal hostnames that reveal infrastructure

**Storage**
- Tokens, credentials, or personal data in `AsyncStorage` — **unencrypted
  plaintext on disk**. Must use the platform keystore
- Sensitive data in unencrypted local databases or cache files
- Secrets in logs — device logs are readable by other tooling

**Deep links**
- Handlers that act on link parameters without validation
- Routes reachable by link that should require authentication
- Parameters flowing into requests or navigation unvalidated

**Transport and platform**
- Cleartext traffic permitted in the platform config
- Disabled certificate validation left in from debugging
- Overly broad permissions in the manifest or Info.plist
- Sensitive screens without screenshot/recording protection where warranted

---

## Dependencies

Run the project's audit command. Summarize critical and high findings with the
affected package and the fix. Note which are dev-only and cannot reach a shipped
artifact — but for native, remember that build-time dependencies can still
inject code into the binary.

---

## Output

Group by category. Per finding: **`file:line`**, the code, **what an attacker
could actually do with it**, and the fix.

End with a severity table (Critical / High / Medium / Low) and a prioritized
list. Rank by exploitability, not by how easy the fix is.

State clearly what this scan does **not** cover: server-side vulnerabilities,
auth logic correctness, business-logic flaws, and anything requiring runtime
analysis. A clean result here is not a clean security posture.

## Anti-patterns

❌ Sanitizing HTML with a regex — use a real sanitizer
❌ JWTs in `localStorage` (web) or `AsyncStorage` (native)
❌ `typeof window !== 'undefined'` treated as a security boundary
❌ Obfuscating a secret in a native bundle and calling it protected
