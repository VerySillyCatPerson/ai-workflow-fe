---
description: Carry a frontend feature request from acceptance criteria through implementation, tests, applicable visual verification, diff review, and a reviewable delivery. Use for feature work that spans more than one isolated file or stage.
argument-hint: [feature request]
---

# Deliver a Feature

Use the loaded framework and platform standards throughout. Keep a task record
with acceptance criteria, changed files, checks run, visual evidence, and open
issues; update it as work progresses rather than restarting at each stage.

## 1. Define the outcome

Read the request, affected code, project policy, and relevant contracts. State
observable acceptance criteria and the loading, empty, error, and success states
that apply. Resolve material ambiguity before dependent implementation.

## 2. Implement in scope

Run the precheck workflow steps. Use the code map as a navigation aid when it is
available, then read the source files. Follow the component or feature workflow
for the actual behavior and data shape. Record changed files and any contract
or integration decisions. Do not widen the task to unrelated cleanup.

## 3. Prove behavior

Add focused tests for new behavior and regressions following the installed
testing references. Run the applicable commands from trusted
`standards/execution.json`; do not invent command names. A failing check sends
the task back to the relevant code or test, then rerun the affected check.

## 4. Verify the experience

For visual, responsive, or animated changes, follow the verify workflow and
record route, states, viewports, console output, and comparison limits. For
nonvisual changes, state why visual verification did not apply. If required
tools are unavailable, mark the visual result unverified rather than passing it
by inference.

## 5. Review the whole change

Follow the review workflow on the task's full diff, including staged, unstaged,
and relevant untracked files. Address blockers and rerun checks affected by each
fix. Record remaining non-blocking findings and material limits.

## 6. Deliver

Report acceptance criteria met, files changed, tests and quality gates, visual
evidence or its absence, and open issues. If a PR was requested, follow the
draft-pr workflow after the branch is reviewable. Do not claim a gate ran when
it was skipped, and do not create a PR solely because this workflow reached its
last step.
