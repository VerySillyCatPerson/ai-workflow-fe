---
description: Render the affected UI and look at it — start the app, capture before/after screenshots, check the console, and report what actually changed. Use after any visual change, or when asked to verify, check, or confirm that UI works.
argument-hint: [route or component]
---

# Visual Verification

Standard: `standards/reference/visual-verification.md`. This closes the loop
`standards/reference/definition-of-done.md` opens — *a green build is not a working feature*.

## Step 1 — Is verification required?

Check the table in the standard. Pure logic, type, or doc changes do not need
this; anything visual, responsive, or animated does.

If required and the environment makes it impossible (no browser, no simulator),
**stop and report the change as unverified.** That is a legitimate outcome. A
substitute (a passing unit test, reading the CSS) is not.

## Step 2 — Pick the tool the project already has

In order: **Playwright installed → Cypress installed → ephemeral Playwright.**

Never add a second browser-automation tool. If neither exists, run Playwright
ephemerally and remove it afterwards — **never leave it in `package.json`.**
Adding a dependency needs the user's approval (`standards/core/guardrails.md`); using one
transiently does not.

React Native: simulator screenshot or Maestro. There is no ephemeral path.

## Step 3 — Capture the baseline

For a change to **existing** UI, the before state is where the value is:

```bash
git stash              # baseline
# start dev server, capture
git stash pop          # your change
# capture again
```

Skip only for genuinely new UI with no previous state.

## Step 4 — Capture

- Start the dev server (production preview if the change is perf-sensitive)
- Navigate to the route from `$ARGUMENTS`, or infer it from the diff and say
  which route you chose
- Default viewport, plus **320px and wide** for any layout work
- All states that changed — loading, empty, and error too, not just success
- Collect console output

## Step 5 — Actually look

**Read the screenshots back.** A captured file nobody opened verifies nothing.

Check: does it match the intent, is anything overlapping or clipped, is spacing
plausible, is text readable at both widths, is the console clean.

## Step 6 — Report

- What you captured, at what viewports, on which route
- **What changed versus the baseline — including anything unintended.** Unrelated
  layout shift elsewhere on the page is the most valuable thing this catches
- Console errors, or explicitly that it was clean
- Anything you could not verify, named plainly

Then clean up: stop the dev server, remove any ephemeral tooling, and confirm
`package.json` and lockfile are unchanged.

## Anti-patterns

❌ Capturing screenshots and never reading them back
❌ Inferring appearance from the code instead of rendering it
❌ Leaving Playwright or Cypress in `package.json`
❌ A single "after" shot on a change to existing UI
❌ Verifying only the success state
❌ Reporting "verified" when the environment blocked it — report unverified
