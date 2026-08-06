---
description: Scaffold a browser E2E test covering the seven standard scenarios — happy path, loading, empty, search, filter, error, selection. Web only. Use when asked to add an E2E, Cypress, or Playwright test.
argument-hint: [feature] [route]
---

# Generate Browser E2E Test

**Web only.** For React Native, use the e2e-native workflow.

## Step 1 — Inputs

Feature name and route from `$ARGUMENTS` or ask. Check whether the project uses
Use `standards/project.json#stack.e2eRunner` and follow existing specs. If it is
`null`, inspect the repository and record the existing runner before writing.

## Step 2 — Scenarios

1. **Happy path** — page loads, key content renders
2. **Loading** — indicator appears before data resolves
3. **Empty** — empty-state message when the response has no records
4. **Search** — typing filters the results
5. **Filter** — changing a filter updates the results
6. **Error** — forced 500 shows the error state and a retry affordance
7. **Selection** — selecting an item updates the visible selection state

Scenarios 3 and 6 must assert **different** UI. If the empty and error states are
indistinguishable, that is a bug in the app — report it rather than writing a
spec that passes either way.

## Rules

- Intercept every network call. A spec that touches a real backend is not a test,
  it is a monitor
- Fixtures for response data, kept beside the spec
- Select through real semantics and visible behavior; never a test-only attribute
- Parameterize the locale segment in URLs rather than hardcoding one
- Each block independent; no shared state or ordering dependency
- Common intercepts and navigation in `beforeEach`
- Assert on user-visible outcomes, not on request internals

## Output

A complete, runnable spec with all seven scenarios implemented — not stubbed with
TODOs. Then state which scenarios you could not implement and why, if any.

## Anti-patterns

❌ Test-only attribute selectors
❌ A hardcoded locale prefix in the URL
❌ Real API responses
❌ Fixed waits instead of waiting on the intercept
❌ One giant block covering all seven scenarios in sequence
