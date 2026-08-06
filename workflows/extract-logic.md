---
description: Extract data fetching, state, and business logic out of a component into the framework's separation primitive — a controller hook, composable, or service. Use when a component mixes data logic with markup, or when asked to extract a hook, composable, or service.
argument-hint: [path/to/component]
---

# Extract Logic from Component

## Step 1 — Identify the target primitive

Read the framework standard imported by this project's agent instruction file:

| Framework | Extract into | Named |
| --- | --- | --- |
| Next.js, React, React Native | Controller hook | `use{Feature}Controller` |
| Vue | Composable | `use{Feature}Controller` |
| Angular | Injectable service or signal store | `{Feature}Store` / `{Feature}Service` |

The mechanism differs; the rule does not — **components render, the extracted
unit holds data and logic.**

## Step 2 — Read and classify

Read the component at `$ARGUMENTS` (ask if not given). Sort every line:

**Moves out:**
- Data state: the records, loading, error, filters, pagination, search text
- Side effects and subscriptions
- API calls and response transformation
- Filter, search, and sort handlers
- Any computation that is not about how something looks

**Stays in:**
- Markup and rendering logic
- UI-only state: modal open, tooltip hover, focus, local animation state
- The call to the extracted unit
- Wiring between UI events and the exposed handlers

The line is: *would this still matter if the UI were rendered completely
differently?* If yes, it moves out.

## Step 3 — Generate

**The extracted unit:**
- Fully typed public interface — no `any`, no leaked internals
- Expose only what the component needs
- State exposed as read-only where the framework supports it (Vue `readonly()`,
  Angular `asReadonly()`); mutation goes through handlers
- Clean up subscriptions, timers, and listeners on teardown using the framework's
  mechanism
- Transform the API response into the shape the UI wants

**The slimmed component:**
- Markup plus one call to the extracted unit
- Use the configured post-split target as a review signal, not a mechanical requirement

**Migration notes:** prop changes, behavior that could regress, tests that need
updating, and anything that was subtly relying on render-order side effects.

## Anti-patterns

❌ Moving UI-only state out — modal open and hover belong in the component
❌ Returning the raw API response
❌ `any` in the public interface
❌ Extracting a unit used by exactly one component that had no logic to begin
   with — that is indirection, not separation
❌ Losing cleanup in the move; this is where the leaks get introduced
