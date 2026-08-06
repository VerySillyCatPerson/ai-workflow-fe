# Framework: Next.js (App Router)

## Components

- Functional, named exports. **Server Components by default**
- `'use client'` only for hooks, browser APIs, or event handlers — push it as far
  down the tree as possible, it drags the whole subtree into the client bundle
- Server Actions for mutations; Suspense for streaming
- Order: hooks → computed → effects → handlers → return
- Imports: external → `@/` → relative
- Path: `src/features/{feature}/components/{Name}/{Name}.tsx`

## Data

- Prefer Server Components or the server-state mechanism declared in
  `project.json`. A client fetch effect needs explicit justification and
  cancellation, race, error, and stale-data handling.
- Use `project.json#stack.serverState` for client server-state handling. Client
  data logic may use a `use{Feature}Controller` hook, exposing `data`, `loading`,
  `totalCount`, `filters`, `handleSearch`, `handleFilterChange`, `handlePageChange`
- Fully typed return; transform the response, never pass it through raw

## Server/client boundary

- A `'use client'` file must not import `server-only`, DB clients, or `fs`
- Never pass passwords, internal ids, or full user objects into client props —
  everything crossing is serialized into the page and readable
- `NEXT_PUBLIC_*` is public. Never a secret

## Routing

One canonical route structure; localized aliases via `rewrites`, never duplicated
folders. Centralized link generation. `loading.tsx` and `error.tsx` per segment.

## Styling

Use the styling system declared in `project.json`. Tailwind is a recommendation
for a new project with no choice, not a Next.js requirement.

Scaffolds and paths: `reference/scaffold-nextjs.md`.

Testing follows `project.json#stack.unitTestRunner` and its installed matching
reference. Execute only validation commands declared under `project.json#commands`.
Shared state follows `project.json#stack.stateManagement`; do not introduce a
library merely because a framework profile recommends one.
