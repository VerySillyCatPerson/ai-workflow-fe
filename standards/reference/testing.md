# Testing Principles

Framework-agnostic testing philosophy. For runner setup, render helpers, query
APIs, and accessibility assertions, see the `reference/testing-*.md` file for
your stack.

## Requirements

- Every feature or bug fix is covered by one or more specs
- Coverage follows the explicit mode and values in `standards/project.json`

## Write the minimum number of tests

- Write **only** the tests needed to cover the behavior properly
- Avoid redundant tests that assert the same thing in different ways
- Prefer fewer, higher-value tests over many low-value ones
- Coverage is a floor to clear, not a score to maximize. Tests written purely to
  move the number are a maintenance liability

## Always use the project's render wrapper

Never import `render` or the hook-rendering helper directly from the testing
library. Always use the project's wrapper — it supplies the providers (query
client, theme, i18n, auth, navigation) that make the test realistic. A test
rendered without providers either fails for the wrong reason or passes under
conditions that never occur in the app.

## Mocking

- **Do not mock** unless strictly necessary. Prefer real implementations
- Unnecessary mocks test the mock instead of the code, and hide regressions
- **Network:** intercept at the transport boundary with a request-mocking layer.
  Do not stub the fetch client module itself
- Define common handlers globally; use per-test overrides only for one-off cases
  (errors, 500s, edge cases). Never add test-specific scenarios to the global set
- **Modules that cannot run in the test environment** are a legitimate mock. Check
  the project's test setup first — they are often mocked globally already

## Test quality

- Test the unit under test, not its dependencies. Do not re-test child components
  that have their own specs
- Assert on **observable behavior** — what the user sees, what the mutation sends
  — never on internal state or private methods
- Cover error paths and edge cases, not just the happy path
- Find elements through real semantics and visible behavior: role, accessible
  name, label, text, or displayed value. Never add or query a test-only
  attribute. Use native HTML semantics first and ARIA only where semantics are
  insufficient; never add ARIA solely to make a test pass
- Interactions go through the library's user-event simulation, not raw event
  dispatch, so events fire in a realistic order

## Async

- Prefer the library's `findBy*` (query + wait) over a manual wait wrapped around
  a sync query
- After the first await resolves, the data is present — use sync queries for
  everything after it
- Never put side effects inside a retrying wait callback; it re-runs on every attempt
- One assertion per wait

## Snapshot policy

Follow `standards/project.json#testing.snapshotPolicy`. Behavior assertions stay
preferred. Under `allow-with-reason`, document the stable contract a snapshot
protects; broad component-tree snapshots are usually noise. Under `forbid`, use
focused behavior assertions instead.

## Avoid

- Assertions that cannot fail (`expect(container).toBeTruthy()`)
- Raw DOM/tree queries when the library offers an accessible query
- Inspecting mock call counts by hand instead of using the matcher
- Manual `act()` — the testing library handles it
- Arbitrary timed waits
- Tests that depend on execution order or share state between cases
