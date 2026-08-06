---
description: Scaffold a new component following the project's loaded framework standard, with types, accessibility, i18n, and a co-located test. Use when asked to create, add, or scaffold a component.
argument-hint: [ComponentName] [feature]
---

# Create Component

Scaffold a component that matches the project's conventions.

## Step 1 — Read the loaded standard

This command is framework-agnostic. Before generating anything, read
`standards/project.json`, then **both**:

1. `standards/framework/{stack}.md` — the rules (styling mechanism, data
   separation, naming overrides)
2. `standards/reference/scaffold-{stack}.md` — the concrete shapes and paths

**Follow them over any assumption in this file.** The scaffold file is not
optional; do not invent a component shape from memory when a canonical one exists.

## Step 2 — Check the component library first

Look in the project's component library / design system before building anything
bespoke. If a suitable component exists, use it. Never duplicate one that is
already there — that is the most common and most expensive mistake this command
can make.

## Step 3 — Gather inputs

From `$ARGUMENTS` or by asking:

1. Component name
2. Feature it belongs to, or `shared`
3. Anything framework-specific the standard calls for (e.g. whether it needs a
   client directive, whether it is presentational or a container)

## Step 4 — Generate

**Component file** — at the path the framework standard specifies:

- Props and boundaries typed according to the configured TypeScript policy
- Doc comment: one-line description plus a line per prop
- All user-facing strings through the translation layer — no hardcoded copy
- Accessible name on every interactive element; decorative graphics hidden from
  assistive tech. Use the mechanism for the platform (`aria-*` on web,
  `accessibility*` on native)
- Styling per the mechanism declared in project policy and interpreted by the framework standard
- Import order: external → absolute alias → relative
- Designed cohesively; use the configured component size as a review trigger

**Test file** — co-located, following the project's testing standard:

- Renders without crashing
- Key elements queried by role or accessible name
- An accessibility assertion using whatever the platform supports (axe on web;
  explicit accessibility-prop queries on native)

## Anti-patterns

❌ Building a bespoke component the library already provides
❌ Hardcoded user-facing strings
❌ Missing accessible name on an icon-only control
❌ Type choices that violate the configured TypeScript policy
❌ Styling that conflicts with the project-declared mechanism
