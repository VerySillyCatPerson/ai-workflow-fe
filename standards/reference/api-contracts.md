# API & Data Contracts

Read before calling an API or defining a client-side contract.

**Rule: the schema is the source of truth, and types are generated from it —
never hand-written.** A hand-written interface mirroring an endpoint is a copy
that starts drifting the day the backend ships.

## Generate types from OpenAPI

If the backend publishes an OpenAPI/Swagger document, generate from it. This is
not optional tooling preference — it is the difference between the compiler
knowing the contract and you asserting it.

```jsonc
// package.json
{
  "scripts": {
    "api:types": "openapi-typescript $OPENAPI_URL -o src/api/schema.generated.ts",
    "api:check": "<project api:types command> && git diff --exit-code src/api/schema.generated.ts"
  }
}
```

- Generated files are **committed**, named `*.generated.ts`, and never hand-edited
- Add `api:check` to CI. It fails when the spec has changed and the committed
  types have not — that is your early warning of a breaking backend change,
  caught in CI instead of in production
- Regenerate on spec change, never patch the output
- Derive working types from the generated ones rather than redeclaring:

```ts
import type { paths } from '@/api/schema.generated'

type GetUserResponse = paths['/users/{id}']['get']['responses']['200']['content']['application/json']
```

No OpenAPI document available? Say so, and either request one or define a schema
(Zod/Valibot) at the boundary as the single source — then infer the type from it.
Do not write a bare interface and hope.

## Validate at the boundary

Generated types describe what the API **promises**. They do not check what it
**sent**. A 200 with a null in a non-nullable field will crash downstream of a
type that swore it could not happen.

```ts
// A claim
const user = (await res.json()) as User

// A check
const user = userSchema.parse(await res.json())
```

Parse where data enters. Past that line, types are trustworthy — that is the
whole point. See `reference/typescript.md`.

## Error shape

One error type across the client. Discriminated, so handling is exhaustive:

```ts
type ApiError =
  | { kind: 'network' }                              // offline, DNS, timeout
  | { kind: 'timeout' }
  | { kind: 'http'; status: number; body?: unknown }
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'parse'; issues: string[] }              // response did not match schema
```

- Map transport errors into this at the client layer — components never see a raw
  `fetch` rejection or an Axios error object
- `validation` carries field keys so `reference/forms.md` can map them back to inputs
- Every error surfaced to a user is a **translation key**, never a server string.
  Server messages are for logs, not for humans in your UI

## Requests

- One configured client per API. No bare `fetch` scattered through features
- **Every request has a timeout.** A request without one hangs forever on a flaky
  network; on mobile that is routine, not an edge case
- Retry only idempotent methods (GET, PUT, DELETE), with exponential backoff and
  jitter, capped. **Never blind-retry a POST** — you will double-charge someone
- Retry 5xx and network failures. Never retry 4xx; the request is wrong and will
  stay wrong
- Cancel in-flight requests on unmount or supersede (`AbortSignal`)
- Idempotency key on any request that creates a resource
- Auth refresh handled once in the client, with concurrent 401s queued behind a
  single refresh — not one refresh per failed request

## Pagination

Pick one convention and apply it everywhere:

| Style | Use when |
| --- | --- |
| Cursor | Default. Stable under concurrent writes |
| Offset | Only when the user needs to jump to page N |

Response envelope is uniform across endpoints:

```ts
interface Page<T> {
  items: T[]
  nextCursor: string | null
  totalCount?: number   // optional; often expensive to compute
}
```

Never infer "last page" from a short array — an empty page is legitimate. Use the
explicit null cursor.

## Caching

- Server state belongs to the query cache, never mirrored into local state
- Query keys include **every** input that changes the result — filters, sort,
  page, locale. A key missing an input serves the wrong data with total confidence
- Set `staleTime` deliberately per resource. The default is rarely right
- Invalidate by key after a mutation; do not refetch the world
- Optimistic updates need a rollback path, or do not do them

## Contract change

- Additive changes (new optional field) are safe
- Removing or retyping a field is breaking — the `api:check` CI step is what
  catches it before users do
- Never work around a backend contract bug in the client silently. Fix it upstream,
  or add a commented adapter at the boundary naming the ticket

## Avoid

- Hand-written interfaces duplicating a documented API
- Editing a `*.generated.ts` file
- `as` on a response instead of parsing
- `fetch` calls inside components
- Retrying POST
- Requests with no timeout
- Query keys missing a filter input
- Leaking transport errors into the UI layer
