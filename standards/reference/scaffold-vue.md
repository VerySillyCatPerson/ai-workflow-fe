# Scaffolds: Vue 3

Read when creating a component, composable, or feature. Rules live in
`framework/vue.md` — this file is shapes and paths only.

## Component

```vue
<script setup lang="ts">
interface Props { items: Item[]; variant?: 'primary' | 'secondary' }
const props = withDefaults(defineProps<Props>(), { variant: 'primary' })
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <!-- markup -->
</template>

<style scoped>
</style>
```

PascalCase filename: `FeatureTable.vue`.
Setup order: imports → props/emits → composables → state → computed → watchers →
lifecycle → functions.

## Composable

```ts
export function useFeatureController() {
  const data = ref<Feature[]>([])
  const loading = ref(false)
  const filters = ref<FeatureFilters>({ search: '' })

  function handleSearch(value: string) { /* ... */ }

  onScopeDispose(() => { /* cleanup */ })

  return {
    data: readonly(data),
    loading: readonly(loading),
    filters: readonly(filters),
    handleSearch,
  }
}
```

Return refs, not `.value`. Path: `src/features/{feature}/composables/`.

## Feature structure

```text
src/features/{feature}/
├── components/FeatureTable.vue
├── composables/useFeatureController.ts
├── stores/feature-store.ts
├── utils/types.ts
└── FeaturePage.vue
```

## Types

```ts
export interface Feature {
  id: string
}

export interface FeatureFilters {
  search: string
}
```
