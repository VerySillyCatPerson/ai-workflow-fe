# Framework: Vue 3

**Naming override:** SFCs use PascalCase filenames (`UserProfile.vue`) — matches
the Vue style guide. Composables, utils, and stores stay kebab-case.

## Components

- `<script setup lang="ts">` always. No Options API in new code
- SFC order: `<script setup>` → `<template>` → `<style scoped>`
- Inside setup: imports → props/emits → composables → state → computed →
  watchers → lifecycle → functions
- Props via type-only declaration, defaults via `withDefaults`. Emits always typed

## Reactivity

- `ref()` for primitives and anything reassigned; `reactive()` sparingly — it
  breaks on destructure and cannot be reassigned
- `computed()` for derived values. **Never** a watcher writing to another ref
- Never mutate a prop — emit, or use `defineModel`
- Destructuring a reactive object kills reactivity — use `toRefs`

## Data

Composables are the separation primitive. `use{Feature}Controller` in
`src/features/{feature}/composables/`:

- Expose state as `readonly()`; mutation goes through returned handlers
- Return refs, not `.value` — unwrapping at the boundary kills reactivity
- Clean up in `onScopeDispose` / `onUnmounted`

Use `project.json#stack.stateManagement`. If it is Pinia, use
`storeToRefs()` when destructuring or reactivity breaks.

## Routing

vue-router. Named routes for link generation
(`router.push({ name: 'user', params: { id } })`), never path strings. Lazy
route components.

## Styling

Tailwind utilities or `<style scoped>` — pick one per project. Third-party
overrides use **`:deep()`**, not the trailing `!` used in the React stacks.
Never an unscoped `<style>` in a component.

Scaffolds and paths: `reference/scaffold-vue.md`.

Testing follows `project.json#stack.unitTestRunner` and its installed matching
reference. Execute only validation commands declared under `project.json#commands`.
Server state follows `project.json#stack.serverState`.
