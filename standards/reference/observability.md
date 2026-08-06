# Observability

Read before adding error reporting, analytics, logging, or feature flags.

**You cannot fix what you cannot see, and you cannot see anything if every signal
is noise.** The goal is a small number of high-signal events, not maximum coverage.

## Error reporting

- One reporting service, initialized once at the app root
- **Every error reaches it or is deliberately swallowed with a comment saying
  why.** A silent catch is a defect you will never hear about
- Attach context: route, feature, user id (never PII), release version, and a
  breadcrumb trail
- Set a stable `fingerprint` so occurrences group. Errors that carry an id or
  timestamp in the message fragment into thousands of one-off issues
- Source maps uploaded on release — a stack trace into minified code is worthless
- Error boundaries per feature route report and render a recovery UI
- Filter the known noise: cancelled requests, browser extensions, offline errors

**Never send to a reporting service:** passwords, tokens, payment details, full
request or response bodies, or personal data. Scrub before send, not after.

## Logging

- No `console.log` in committed code
- Structured logs (`{ event, context }`), never string concatenation
- Levels used honestly: `error` is actionable, `warn` is suspicious, `info` is
  lifecycle. If everything is an error, nothing is
- **Never log secrets or personal data.** On web these land in the user's devtools;
  in native builds they land in device logs readable by other tooling

## Analytics

- **One typed event catalogue in one module.** Never a bare string at the call site
- Event names are stable — renaming one breaks every historical dashboard

```ts
export const events = {
  checkoutStarted: (p: { cartValue: number; itemCount: number }) => track('checkout_started', p),
  checkoutCompleted: (p: { orderId: string; value: number }) => track('checkout_completed', p),
} as const
```

- Consistent naming: `object_action`, snake_case, past tense
- Track outcomes, not clicks. `checkout_completed` answers a question;
  `button_clicked` does not
- **Consent first.** No analytics before the user has consented where consent is
  required. This is a legal obligation, not a preference
- Never put PII in event properties — ids, not emails

## Feature flags

- One flag module; never read the SDK directly from a component
- A default for every flag covering SDK failure. **Default to the safe path** —
  usually the old behavior
- Flags are temporary. Record who owns each and when it is removed; a permanent
  flag is a permanent branch of untested code
- Never gate on a flag inside a loop or render-hot path
- Clean up the losing branch after a rollout completes

## Real user monitoring

- Report the web vitals from `reference/performance-web.md` as field data
- Segment by device class and connection — an average hides the users having the
  worst time, and they are the ones who leave
- Alert on a **trend**, not a threshold crossed once

## Health

- A release version visible in the app (footer, settings) — support cannot help
  without knowing what the user is running
- Surface degraded backend state to users rather than failing silently

## Avoid

- Silent `catch`
- `console.log` shipped to production
- Analytics strings inline at call sites
- Tracking before consent
- PII in events, logs, or error reports
- Flags with no owner or removal date
- Alerting on everything — an alert nobody acts on trains people to ignore alerts
