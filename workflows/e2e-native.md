---
description: Scaffold a React Native end-to-end test with Detox or Maestro, covering the standard scenarios plus the mobile-only ones — offline, backgrounding, and permission denial. Use when asked to add a native E2E test.
argument-hint: [feature] [screen]
---

# Generate Native E2E Test

**React Native only.** For web, use the e2e-web workflow.

## Step 1 — Inputs

Feature and screen from `$ARGUMENTS` or ask. Determine whether the project uses
Use `standards/project.json#stack.e2eRunner` and follow existing specs. If it is
`null`, inspect the repository and record the existing runner before writing.

## Step 2 — Scenarios

The seven from the web set:

1. Happy path
2. Loading
3. Empty
4. Search
5. Filter
6. Error
7. Selection

Plus the four that only exist on a device:

8. **Offline** — airplane mode: the offline state appears, and queued actions
   either recover or fail visibly on reconnect
9. **Background and resume** — state survives the app being backgrounded and
   restored; no duplicate fetch storm on resume
10. **Permission denial** — the user declines a permission and the app degrades
    gracefully instead of dead-ending
11. **Deep link** — entering the screen cold via its link resolves correctly and
    rejects a malformed one

Scenarios 8–11 are where native apps actually break. Do not skip them because
they are harder to write than the first seven.

## Rules

- Match elements through visible text and real accessibility label/role — the
  same props that make the screen usable with VoiceOver and TalkBack. Do not add
  or query test-only identifiers
- Stub network at the device boundary; never hit a real backend
- Reset app state between specs — a stale keychain entry or cached store will
  make specs pass in isolation and fail in sequence
- Never a fixed sleep; wait on a condition
- Run against a **release-configuration** build where the harness supports it —
  dev-build timing hides real races

## Output

A complete runnable spec. Then state which scenarios are covered, which were
skipped, and why — particularly if the app currently has no offline handling to
test, which is itself a finding worth reporting.
