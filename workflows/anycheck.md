---
description: Find every `any` type and type-suppression comment in the source tree and propose proper types or `unknown` + type guards. Use when asked to find any types, clean up TypeScript, or tighten type safety before a PR.
allowed-tools: Grep, Glob, Read
---

# Find `any` Type Usage

## Scope

Search the project source root. Skip `node_modules`, generated files, `*.d.ts`,
and vendored third-party type definitions.

## What to flag

- Explicit annotations: `const x: any`
- Parameters: `function fn(param: any)`
- Return types: `function fn(): any`
- Casts: `value as any`
- Arrays and generics: `any[]`, `Promise<any>`, `Record<string, any>`
- `// @ts-ignore` and `// @ts-expect-error` — these usually mask the same problem
- Implicit `any` from untyped callback parameters, if `noImplicitAny` is off

## Output

Group by file. For each finding:

- **`file:line`**
- The problematic code
- **Category** — one of: `needs proper type`, `use unknown + type guard`,
  `generic needed`, `legitimate edge case`
- The corrected TypeScript

End with a count per category and a prioritized fix list. Prioritize by blast
radius: shared utilities and hooks first, leaf components last — a loose type in
a shared module propagates `any` through every consumer.

## Anti-patterns

❌ Replacing `any` with `unknown` then casting straight back — write a real guard
❌ `// @ts-ignore` to silence the error instead of fixing the type
❌ `(e: any) => void` on event handlers — use the framework's event type
❌ Widening a type to make an error disappear when the value genuinely is narrower
