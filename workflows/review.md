---
description: Review staged changes against the project's loaded standards — types, component quality, styling, i18n, accessibility, error handling — with a go/no-go verdict. Use before committing or when asked to review changes or a diff.
allowed-tools: Bash(git diff:*), Bash(git status:*), Read, Grep
---

# Review Staged Changes

## Step 1 — Load context

Run `git diff --staged`. Read `standards/project.json`, then the framework and platform standards imported by
this project's agent instruction file — the styling and accessibility rules in particular
differ by platform, and reviewing web rules against React Native code produces
confidently wrong findings.

## Step 2 — Review

### Types
- `any`, assertions, and missing annotations against the configured TypeScript policy
- Type suppressions

### Component quality
- Over a configured review threshold — investigate cohesion; do not fail on size alone
- Data logic tangled into markup — should move to the framework's separation
  primitive
- Framework-specific correctness per the loaded standard (client/server
  boundaries, change detection, reactivity, memoization)

### Styling
- Raw hex values or magic numbers instead of design tokens
- Styling that conflicts with the mechanism declared in project policy
- Classes or styles duplicated where a shared unit belongs

### Internationalization
- Any user-facing string not going through the translation layer
- New keys missing from non-default locale files

### Accessibility
- Interactive elements without an accessible name
- Decorative graphics not hidden from assistive tech
- Non-semantic elements where a semantic one exists (web)
- Missing `accessibilityRole` / `accessibilityState` (native)

### Error handling
- Missing null/undefined paths on optional data
- Missing loading, empty, or error state — check all four from
  `standards/core/rules.md`
- Swallowed errors, or errors rendered raw

### Tests
- New behavior without tests where the project policy and risk require them
- Test-only selectors as an invariant violation; snapshots and coverage against project policy
- Tests that assert on internals rather than observable behavior

## Output

For each finding: **`file:line`**, what is wrong, and the fix. Mark clean
categories ✅ rather than omitting them — an absent category reads as "not checked".

End with a go/no-go for committing. Be direct: if it should not be committed,
say so and say which finding is the blocker.

## Anti-patterns

❌ Flagging style preferences the linter does not enforce
❌ Reviewing against web rules on a native codebase, or vice versa
❌ Treating this as a substitute for running the tests
