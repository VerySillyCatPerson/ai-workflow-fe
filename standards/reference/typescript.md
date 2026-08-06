# TypeScript

Resident summary is in `core/rules.md`. This is the deep reference — read it
before writing non-trivial types, generics, or narrowing logic.

**Principle: make illegal states unrepresentable.** A type that permits a state
the code cannot handle is a bug waiting for input. Most runtime errors in a typed
codebase happen where the type was wider than reality.

## Compiler settings

Follow `standards/project.json#typescript.strictness`:

- `strict` — enable the complete baseline below
- `incremental` — follow `reference/legacy-adoption.md`; enable flags in a
  recorded sequence and do not introduce new violations
- `project-config` — the repository's documented TypeScript configuration is
  authoritative; report gaps rather than silently strengthening it

Strict baseline:

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,   // arr[0] is T | undefined — it genuinely is
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true,
  "exactOptionalPropertyTypes": true  // `{ a?: string }` ≠ `{ a: string | undefined }`
}
```

`noUncheckedIndexedAccess` is the highest-value flag most projects skip. Array and
record access genuinely can be undefined; without it the compiler lies to you.

## `any` policy

Follow `standards/project.json#typescript.anyPolicy`:

- `forbid` — use the alternatives below; no `any`
- `external-boundaries` — contain `any` at an unavoidable untyped dependency
  boundary, explain it, and convert immediately to a checked or stronger type
- `allow-with-reason` — every use needs a concrete reason and the narrowest scope

No policy permits `any` merely to silence a compiler error.

| Instead of | Use |
| --- | --- |
| `any` on unknown input | `unknown` + type guard |
| `any` to bridge a mismatch | Fix the type, or parse at the boundary |
| `any[]` | `unknown[]` then narrow, or the real element type |
| `Record<string, any>` | `Record<string, unknown>` |
| `(e: any) => void` | The framework's real event type |
| `as any` to silence | A guard, or `satisfies`, or fix the source type |

`unknown` narrowed straight back with `as` is `any` with extra steps.

## Discriminated unions over optional bags

```ts
// Bad — permits { loading: true, error: Error, data: User } which is meaningless
interface State {
  loading?: boolean
  error?: Error
  data?: User
}

// Good — the four states from core/rules.md, and only those
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: User }
```

Narrowing then works, and the compiler catches an unhandled case:

```ts
switch (state.status) {
  case 'success': return render(state.data)  // data is defined here, no `!`
  // ...
  default: return assertNever(state)
}
```

```ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}
```

Put `assertNever` in every exhaustive switch. It turns "someone added a variant"
from a runtime surprise into a compile error.

## Narrowing

```ts
// Type predicate
function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'code' in value
}

// Assertion function
function assertDefined<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value == null) throw new Error(`${name} is required`)
}
```

Prefer narrowing to casting. A predicate is checked at runtime; a cast is not.

Follow `typeAssertionPolicy` for non-null assertions. Under `narrowing-only`, use
`!` only after a real check the compiler cannot follow and explain why. Under
`forbid`, restructure the code so narrowing is visible to the compiler.

## `satisfies`

Validates against a type while keeping the literal's precision:

```ts
// `as` widens — routes.home is now string, autocomplete lost
const routes = { home: '/', profile: '/profile' } as Record<string, string>

// `satisfies` validates and keeps '/' | '/profile'
const routes = { home: '/', profile: '/profile' } satisfies Record<string, string>
```

Use it for config objects, route maps, and theme tokens.

## Derive, never duplicate

```ts
type UserId = User['id']
type CreateUserInput = Omit<User, 'id' | 'createdAt'>
type PartialUpdate = Partial<Pick<User, 'name' | 'email'>>
type Handler = (typeof handlers)[number]
type Result = Awaited<ReturnType<typeof fetchUser>>
```

A second hand-written definition of the same shape will drift. Derive from one source.

## Generics

```ts
// Unconstrained — accepts anything, guarantees nothing
function pick<T, K>(obj: T, keys: K[]) {}

// Constrained — the compiler enforces the relationship
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {}
```

Rules:
- Constrain every parameter
- One use = not a generic. If `T` appears once, use a concrete type
- Name meaningfully past one: `TData`, `TError`, not `T`, `U`, `V`
- Default where sensible: `<TError = Error>`

## Branded types

For values that are structurally identical but semantically different:

```ts
type UserId = string & { readonly __brand: 'UserId' }
type OrderId = string & { readonly __brand: 'OrderId' }

function getUser(id: UserId) {}
getUser(orderId) // compile error — this is a real bug class
```

Use for ids, currency amounts, and pre-validated strings (sanitized HTML, checked URLs).

## `readonly`

Default to it for props, config, and anything you do not intend to mutate.
`readonly T[]` catches accidental `push` into a prop. Use `as const` for literal
tuples and constant objects.

## Boundaries

**Type assertions on external data are claims, not checks.** An API response typed
as `User` is `User` only because you said so.

```ts
// This is a lie the moment the API changes
const user = (await res.json()) as User

// This is a check
const user = userSchema.parse(await res.json())
```

Parse at every boundary: API responses, URL and route params, form input, storage
reads, deep links, webhook payloads. Beyond the boundary, types can be trusted —
that is the point of having one.

See `reference/api-contracts.md` for generating these types from a schema.

## Enums

Prefer a const object plus a derived union. TS `enum` has runtime cost, awkward
semantics, and no structural compatibility:

```ts
export const Status = { Active: 'active', Archived: 'archived' } as const
export type Status = (typeof Status)[keyof typeof Status]
```

## Avoid

- Any `any`, assertion, or non-null usage outside the configured policy
- `@ts-ignore`; use a reasoned `@ts-expect-error` only when the error is intentional
- `Function`, `Object`, `{}` as types — they mean almost nothing
- `as` to convert between unrelated shapes
- Optional fields modelling states that a union should model
- A type and a Zod/Valibot schema maintained separately — infer the type from the schema
- Interfaces for unions or mapped types — use `type`
- Deeply nested conditional types when a simpler shape or an overload would do
