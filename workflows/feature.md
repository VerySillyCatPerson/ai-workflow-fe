---
description: Scaffold a complete feature module — structure, types, data layer, components, and locale keys — following the project's loaded framework standard. Use when asked to scaffold or add a new feature.
argument-hint: [feature-name]
---

# Scaffold Feature Module

## Step 1 — Read the loaded standard

Read **both**:

1. `standards/framework/{stack}.md` — the rules, including which separation
   primitive this stack uses: a controller hook (React, React Native), a
   composable (Vue), or a service/signal store (Angular)
2. `standards/reference/scaffold-{stack}.md` — the exact directory layout, file
   shapes, and type definitions

Follow them. Do not invent a structure when a canonical one exists.

## Step 2 — Gather inputs

Feature name from `$ARGUMENTS` or ask. Identify the user-facing behavior,
primary data entity (if any), and whether the feature needs a list, detail,
form, or other shape. Check existing routes, components, data contracts, and
project policy before deciding what to create.

## Step 3 — Generate

Create the structure from the framework standard, containing:

**Types** — model only the inputs, entities, and outputs the feature needs. Add
filter types only when filtering is part of the behavior. No `any`.

**Data layer** — when the feature fetches or mutates data, use the framework's
separation primitive and expose the states and handlers its behavior needs.
Lists may need totals, filters, search, and pagination; detail or form features
may not. Fully type the contract and transform API responses where the UI needs
a different shape. Keep rendering logic out of the data layer.

**Page/screen component** — when the feature has a route, keep it thin and handle
the applicable loading, empty, error, and success states from
`standards/core/rules.md`. Delegate substantial rendering to sub-components.

**Presentational components** — create them when they clarify the feature's
responsibilities. No data fetching; props in, events out.

**Locale keys** — when the project has a translation layer, add every new
user-facing string to all required locale files. Mark untranslated values
`TODO: translate` so they are greppable.

## Step 4 — Report

List every file created or changed, the behavior and states covered, validation
run, and any integration still needed (route, navigation, translation namespace,
or store registration).

## Anti-patterns

❌ API calls in the page component — they belong in the data layer
❌ Hardcoded column headers or labels
❌ Skipping the empty state, or making it identical to the error state
❌ A data layer that returns the raw API response
❌ UI-only state (modal open, hover) in the data layer
