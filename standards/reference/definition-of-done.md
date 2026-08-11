# Definition of Done

Read before claiming a feature, fix, or task is complete.

**"Done" means a competent reviewer would agree, not that the code runs.** If any
item below is unmet, it is not done — say what remains rather than reporting
completion.

## Scope depends on project mode

Read `standards/project.json` for mode, thresholds, and deviations. Read validation
commands from trusted `standards/execution.json`.

| | `greenfield` | `legacy` |
| --- | --- | --- |
| Applies to | The whole repo | **Only code this change touches** |
| Coverage | Explicit mode and values from `standards/project.json` | Explicit mode and values from `standards/project.json` |
| Pre-existing violations | None exist | Out of scope — leave them |

On a `legacy` project, do **not** treat a grandfathered violation in a file you
edited as a blocker, and do not fix it opportunistically — that inflates the diff
and buries the real change. It belongs to Phase 4 of `adoption/rollout.md`.

**The four items marked 🔒 are never scoped down**, in either mode.

## Code

- [ ] Does what was asked — the whole scope, not the easy part
- [ ] No `any`, no `as` to silence, no `@ts-ignore` **in new code**
- [ ] 🔒 All four states handled: loading, empty, error, success
- [ ] Optional data has explicit undefined paths
- [ ] Configured size-threshold crossings reviewed for cohesion; data logic in the framework's primitive
- [ ] No `console.log`, no commented-out code, no stray `TODO` without owner
- [ ] Comments explain **why**, are short, and none are stale

## Quality gate

All five green locally. Not "should pass" — actually run:

- [ ] Lint
- [ ] Typecheck
- [ ] Tests follow the coverage mode and values in `standards/project.json`
- [ ] Production build
- [ ] Dependency audit reviewed
- [ ] `legacy` only: the suppression baseline did **not** grow

## Tests

- [ ] New behavior covered; bug fixes have a regression test that fails without the fix
- [ ] Error and edge paths, not just the happy path
- [ ] Accessibility assertion for new or changed UI
- [ ] Queries by role and accessible name

## Accessibility

- [ ] 🔒 Keyboard operable end to end
- [ ] 🔒 Accessible name on every interactive element
- [ ] Contrast and touch targets meet `core/rules.md`
- [ ] Verified with a screen reader if the UI is non-trivial

## Internationalization

*(Skip if the project is single-locale.)*

- [ ] No hardcoded user-facing strings
- [ ] Keys added to **every** locale file
- [ ] Dates, numbers, plurals via `Intl`

## Documentation

- [ ] Project `README` updated for any new feature, script, env var, or setup step
- [ ] Changed behavior updated **everywhere** it is described
- [ ] New env vars in `.env.example` — never in `.env`
- [ ] Public API has a one-line JSDoc
- [ ] No documentation now describing something that no longer works

## Verified, not assumed

- [ ] 🔒 **Actually ran it.** A green build is not a working feature
- [ ] Checked the real UI for anything visual, animated, or timing-dependent —
      run the verify workflow. A passing unit test does not confirm it looks right, and
      `reference/visual-verification.md` says when this is mandatory
- [ ] Checked one narrow viewport and one wide one (web) or one low-end device (native)
- [ ] Confirmed nothing adjacent regressed

## Reported honestly

- [ ] 🔒 Said what was **not** done, skipped, or left unverified
- [ ] Any failing test reported with its output, never quietly omitted
- [ ] Assumptions stated
- [ ] Distinguished "typechecks" from "works"

## Before commit

`core/guardrails.md` governs: **never commit unless explicitly asked**, never add
attribution trailers, show the diff and message and wait for approval.
