---
description: Generate a co-located unit test for a component or logic unit using the project's testing standard, including an accessibility assertion. Use when asked to write, generate, or add tests for a file.
argument-hint: [path/to/file]
---

# Generate Unit Test

## Step 1 — Read the loaded testing standard

Read `standards/project.json#stack.unitTestRunner`, then the installed testing
reference matching that value. If the value is `null`, inspect existing test
configuration and update project policy before choosing runner-specific APIs.
It defines the render wrapper, query API, async handling, and accessibility
mechanism. `standards/reference/testing.md` defines the philosophy. **Both override anything
you would otherwise assume.**

## Step 2 — Read the subject

Read the file at `$ARGUMENTS` (ask if not given). Identify its inputs, its
observable outputs, and its failure modes.

## Step 3 — Write the minimum useful set

Per `standards/reference/testing.md`: the fewest tests that cover the behavior properly. For a
typical component that is roughly:

1. Renders with required props; key elements present by role or accessible name
2. Each meaningful user interaction produces its observable result
3. Loading, empty, and error states
4. An accessibility assertion, using the platform's mechanism

For a logic unit (hook, composable, store, service):

1. Initial state
2. Each handler's effect on exposed state
3. Loading set during an async call and cleared after
4. Error path

Resist adding a fifth and sixth variation of the same assertion.

## Rules

- Use the project's render wrapper — never the testing library's `render` directly
- Query real semantics and visible behavior. Never add or query a test-only
  attribute, and never add ARIA solely to make a test pass
- User interactions through the library's user-event API, not raw event dispatch
- `findBy*` for async; sync queries after the first await resolves
- Mock only what genuinely cannot run in the test environment. Check the
  project's test setup first — it is often mocked globally already
- Network intercepted at the transport boundary, not by stubbing the client module
- Follow the configured snapshot policy; behavior assertions remain preferred
- Clean up mocks in `afterEach`

## Output

A complete, runnable test file at the co-located path the framework standard
specifies. Then state plainly which behaviors are covered and which are not —
do not imply coverage you did not write.

## Anti-patterns

❌ Test-only attributes or selectors
❌ Snapshots outside the configured snapshot policy
❌ Importing `render` from the testing library instead of the project wrapper
❌ Raw event dispatch where user-event works
❌ Multiple assertions inside one retrying wait
❌ Tests written purely to move the coverage number
