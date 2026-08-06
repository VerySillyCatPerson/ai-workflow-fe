---
description: Analyze a component crossing its configured review threshold and produce a cohesion-led split plan. Use when a threshold is crossed or when asked to split a component.
argument-hint: [path/to/component]
---

# Split Large Component

## Step 1 — Measure and read

Read the file at `$ARGUMENTS` (ask if not given). Read
`standards/project.json`, then compare line counts with its review thresholds.
Read `standards/framework/{stack}.md` for the
separation primitive and `standards/reference/scaffold-{stack}.md` for the target
file layout.

## Step 2 — Find the seams

Group the code by responsibility, not by line count:

- Data fetching and state management
- Business logic and computation
- Markup sections with a single clear purpose
- Handlers belonging to one specific section

A cohesive 210-line form is fine. A 150-line component doing four unrelated
things should still be split. Size is the trigger for looking, not the reason to cut.

## Step 3 — Plan the split

- **Logic → the framework's separation primitive** (see the extract-logic workflow) if the
  component holds data fetching, complex state, or business rules
- **Sub-components** for cohesive markup blocks that warrant an independent unit;
  use the configured extraction threshold as a review trigger
- **Helpers** for pure computation, into the feature's utils
- **Types** into the feature's types file if not already there

## Output

1. What the component currently does, and which responsibilities are tangled
2. Proposed file structure, one line per file describing its responsibility
3. The refactored parent — mostly composition; explain any justified result over
   the configured post-split target
4. Each extracted piece as a ready-to-paste block
5. **Risks:** shared state that becomes prop drilling, render-order side effects,
   test coverage that will break, and anything relying on the current structure

## Anti-patterns

❌ Splitting by line count with no regard for cohesion
❌ A sub-component used once, 10 lines long, with no independent meaning
❌ Prop drilling past the configured review depth after the split without reconsidering
   ownership — lift to a
   store, context, or injection instead
❌ Splitting markup while leaving the data logic in the parent — that is the half
   of the job that actually matters
