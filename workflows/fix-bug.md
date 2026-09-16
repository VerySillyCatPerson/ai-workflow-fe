---
description: Carry a frontend bug from reproduction through a scoped fix, regression coverage, applicable visual verification, quality gates, and whole-diff review. Use when asked to fix broken behavior or a UI regression.
argument-hint: [bug report]
---

# Fix a Bug

Keep one task record: trigger, expected behavior, observed behavior, affected
files, regression evidence, checks, and unresolved limits.

## 1. Reproduce and locate

Read the report and relevant code. Reproduce the failure with the available
test, browser, simulator, or a minimal deterministic case. If reproduction is
blocked, record why and identify the strongest available evidence. Establish
the expected behavior from the product contract or existing tests.

## 2. Fix the cause

Run the precheck workflow steps and use the loaded standards. Make the smallest
change that corrects the behavior. Add a regression test at the level that can
observe the failure; avoid a test that only mirrors the new implementation.

## 3. Verify and review

Run applicable commands from trusted `standards/execution.json`. Follow the
verify workflow when visible behavior changed. Review all task changes with the
review workflow, address blockers, and rerun checks affected by revisions.

## 4. Deliver

Report the trigger and before/after behavior, root cause supported by evidence,
regression coverage, gate results, visual evidence when applicable, and anything
not verified. Draft a PR only when requested and the branch is reviewable.
