# Framework: React (SPA)

Client-rendered on Vite. **No server:** no Server Components, no `'use client'`,
all fetching client-side, every env var public.

## Components

- Functional, named exports
- Order: hooks → computed → effects → handlers → return
- Imports: external → `@/` → relative
- Path: `src/features/{feature}/components/{Name}/{Name}.tsx`

## Data

- Prefer `project.json#stack.serverState`. A fetch effect
  needs justification and explicit cancellation, race, error, and stale-data handling.
- Data logic → `use{Feature}Controller`, exposing `data`, `loading`,
  `totalCount`, `filters`, and handlers. Fully typed, response transformed
- `useEffect` is for syncing with things outside React. A fetch in it is a smell

## State

- Server state lives in the query cache — do not copy it into local state
- Derive during render; never mirror into state with an effect
- Past the configured prop-drilling review depth, reconsider ownership; context,
  composition, or the declared store may be appropriate.

## Routing

One route table in one module. Centralized link generation. Route-level
`lazy()` + `<Suspense>`. Error boundary per segment.

## Performance

Measure before memoizing — reflexive `memo`/`useMemo`/`useCallback` usually costs
more than it saves. Stable keys from data identity, never an array index for
reorderable lists. Virtualize long lists.

## Styling

Use the styling system declared in `project.json`. For a new project with no
choice, Tailwind is one recommendation, not a React requirement.

Scaffolds and paths: `reference/scaffold-react.md`.

Testing follows `project.json#stack.unitTestRunner` and its installed matching
reference. Execute only validation commands declared under `project.json#commands`.
Shared state follows `project.json#stack.stateManagement`.
