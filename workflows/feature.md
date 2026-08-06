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

Feature name from `$ARGUMENTS` or ask. Confirm the primary data entity and
whether the feature is list-shaped (table, filters, pagination) or detail-shaped.

## Step 3 — Generate

Create the structure from the framework standard, containing:

**Types** — the main entity and a `Filters` type. No `any`.

**Data layer** — named per the framework standard, exposing at minimum `data`,
`loading`, `totalCount`, `filters`, and handlers for search and filter change.
Fully typed. Transforms the API response into the shape the UI needs rather than
passing it through raw. Contains no rendering logic.

**Page/screen component** — thin. Consumes the data layer and handles all four
states from `standards/core/rules.md`: loading, empty, error, success. Delegates
rendering to sub-components.

**Presentational components** — no data fetching. Props in, events out.

**Locale keys** — every user-facing string, added to **all** locale files. Mark
untranslated values `TODO: translate` so they are greppable.

## Step 4 — Report

List every file created, and flag anything the user still needs to wire up
(route registration, navigation entry, i18n namespace registration, store
registration).

## Anti-patterns

❌ API calls in the page component — they belong in the data layer
❌ Hardcoded column headers or labels
❌ Skipping the empty state, or making it identical to the error state
❌ A data layer that returns the raw API response
❌ UI-only state (modal open, hover) in the data layer
