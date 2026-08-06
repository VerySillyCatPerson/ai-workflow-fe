---
description: Generate or verify TypeScript types from an OpenAPI/Swagger spec, wire up the CI drift check, and find hand-written types that duplicate the contract. Use when asked about API types, OpenAPI, Swagger, codegen, or when API types are out of sync.
argument-hint: [spec URL or path]
---

# API Types from OpenAPI

Standard: `standards/reference/api-contracts.md`. **The spec is the source of truth; types
are generated from it, never hand-written.**

## Step 1 — Locate the spec

From `$ARGUMENTS`, or look for `openapi.json` / `swagger.json` / a documented spec
URL in the README or env config.

**No spec available?** Say so and stop rather than hand-writing types. The correct
next step is asking the backend team for one, or defining a runtime schema
(Zod/Valibot) at the boundary as the single source and inferring types from it.
Report which of these you recommend and why.

## Step 2 — Assess the current state

- Is there already generated output? Is it committed, and is it named `*.generated.ts`?
- Find **hand-written interfaces duplicating spec shapes** — these are the drift
  risk this command exists to remove. Grep for interfaces matching endpoint
  response names
- Is there a CI check, or can the committed types silently fall behind the spec?

## Step 3 — Generate

```jsonc
{
  "scripts": {
    "api:types": "openapi-typescript $OPENAPI_URL -o src/api/schema.generated.ts",
    "api:check": "<project api:types command> && git diff --exit-code src/api/schema.generated.ts"
  }
}
```

Adjust the tool to whatever the project already uses. Do not introduce a second
generator alongside an existing one.

Rules:
- Output committed, `*.generated.ts`, never hand-edited
- Add a header comment marking it generated and naming the source spec
- Exclude from lint and coverage

## Step 4 — Wire the CI check

`api:check` regenerates and fails if the committed output differs — catching a
backend contract change in CI instead of production. **If the project has no such
check, adding it is the highest-value part of this task.**

## Step 5 — Migrate hand-written types

For each duplicate found, show the replacement deriving from the generated schema:

```ts
import type { paths } from '@/api/schema.generated'

type GetUserResponse = paths['/users/{id}']['get']['responses']['200']['content']['application/json']
```

Do not delete hand-written types wholesale — some encode real client-side
transforms. Distinguish "duplicates the contract" (replace) from "derives
something the API does not model" (keep, but derive its input from the generated type).

## Step 6 — Flag the validation gap

Generated types describe what the API **promises**, not what it **sent**. Report
any boundary where a response is cast rather than parsed, and recommend runtime
validation there per `standards/reference/api-contracts.md`.

## Report

Files generated, scripts added, CI check status, hand-written types superseded,
and any spec/implementation mismatch you noticed — a spec that disagrees with
reality is a finding worth raising upstream.

## Anti-patterns

❌ Hand-writing types when a spec exists
❌ Editing generated output
❌ Generated types not committed — CI cannot diff what it must regenerate
❌ Treating generated types as runtime validation
❌ Two generators for one API
