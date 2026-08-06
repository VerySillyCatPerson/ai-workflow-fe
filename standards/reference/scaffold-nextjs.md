# Scaffolds: Next.js

Read when creating a component, page, or feature. Rules live in
`framework/nextjs.md` — this file is shapes and paths only.

## Component

```tsx
/**
 * @description What this component does.
 * @param props.foo - What foo controls.
 */
export function ComponentName({ foo }: ComponentNameProps) {
  // hooks → computed → effects → handlers → return
}
```

Path: `src/features/{feature}/components/{Name}/{Name}.tsx`
Imports: external → `@/` → relative.

## Controller hook

```ts
interface FeatureControllerReturn {
  data: Feature[] | undefined
  loading: boolean
  totalCount: number
  filters: FeatureFilters
  handleSearch: (value: string) => void
  handleFilterChange: (filters: Partial<FeatureFilters>) => void
  handlePageChange: (page: number) => void
}

export function useFeatureController(): FeatureControllerReturn { /* ... */ }
```

## Feature structure

```text
src/features/{feature}/
├── components/{Feature}Table/{Feature}Table.tsx
├── utils/types.ts
├── use{Feature}Controller.ts
└── {Feature}Page.tsx
```

Route segments additionally get `loading.tsx` and `error.tsx`.

## Types

```ts
export interface Feature {
  id: string
}

export interface FeatureFilters {
  search: string
}
```
