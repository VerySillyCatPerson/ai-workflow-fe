---
description: Full pull request review — intent, quality gates, framework-specific checks, and an approve / request-changes / comment decision. Use when reviewing a PR or asked whether a branch is ready to merge.
argument-hint: [PR number or branch]
---

# Review Pull Request

Protocol and decision rules: `standards/reference/git-pr.md`.

## Step 1 — Intent before diff

Read the title and description first. Confirm:

- The diff does what the description claims
- Scope is one logical concern
- Screenshots or recordings are present for any user-visible change
- Size is within the PR cap in `standards/core/rules.md`, or the exception is justified

If the description is missing or contradicts the diff, record an intent gap and
continue reviewing what can be established from the code and tests. Do not
invent product intent or approve until that gap is resolved.

## Step 2 — Quality gates

Confirm the pipeline status before reading code: lint, typecheck, tests at the
configured coverage policy, production build, and dependency audit. Record red,
missing, or unavailable gates as findings, then inspect the diff for other
material defects. A red required gate blocks approval but does not make the
remaining code review disappear.

## Step 3 — Standards review

Read the framework and platform standards imported by the project's agent instruction file,
then check:

**Accessibility** — accessible name on every interactive element; no non-semantic
click targets (web); `accessibilityRole` and `accessibilityLabel` present
(native); contrast and touch targets per `standards/core/rules.md`. Flag any renamed or
removed accessible name, since those silently break assistive tech and automation.

**Design system** — nothing bespoke that the component library already provides;
tokens rather than raw values; the styling mechanism the standard prescribes.

**Component quality** — investigate configured size-threshold crossings; data logic in the separation
primitive, not the component; framework-specific correctness per the standard.

**Internationalization** — no hardcoded user-facing strings; new keys in all locales.

**Error handling** — all four states from `standards/core/rules.md`.

**Tests** — new behavior covered; accessibility assertion present; queries by role
and accessible name; loading, empty, and error paths tested.

## Step 4 — Decide

Apply the decision table in `standards/reference/git-pr.md`. Cite `file:line` for every blocker.
Prefix non-blocking suggestions with `nit:` so the author can tell them apart.
Report the reviewed files and commits, gate evidence, blockers, non-blocking
findings, and any area that could not be checked. After author revisions,
recheck affected gates and changed files before changing the decision.

## Anti-patterns

❌ Approving a red pipeline
❌ Requesting changes over preferences the linter does not enforce
❌ Reviewing a mega-PR instead of asking for a split
❌ Approving without the checklist because it "looks simple"
❌ Blocking on a nit — if it is not a blocker, say so explicitly
