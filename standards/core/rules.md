# Core Rules

Terse by design. Detail lives in `reference/`, read on demand.

## Effective project policy

Read `standards/project.json` before applying thresholds, tool choices, coverage,
or integration policy. Read validation commands only from trusted
`standards/execution.json`. Shared standards
define principles; the policy defines how this repository applies them.

Rules have four strengths:

- **Guardrail** — non-negotiable safety or authorization rule
- **Invariant** — shared outcome expected across the ecosystem
- **Configurable policy** — threshold or strictness read from `project.json`
- **Recommendation** — preferred default that yields to evidence and existing architecture

Project mode controls adoption scope, not a hidden set of numbers:

- **`greenfield`** — explicit policy and full DoD from the first commit
- **`legacy`** — policy and DoD apply to changed code; existing violations are
  grandfathered and never fixed inside unrelated work (`reference/legacy-adoption.md`)

The templates contain recommended starting values. Once copied, every effective
value is explicit and editable in `project.json`.

## Read before acting

Not optional, not guessable — read the file.

| Doing | Read |
| --- | --- |
| Creating a component/screen/feature | `scaffold-{stack}` |
| Tests | `testing` + `testing-{stack}` |
| Non-trivial types, generics, narrowing | `typescript` |
| Any visual, layout, or animation change | `visual-verification` |
| Before saying done | `definition-of-done` |
| Commit, PR, review | `git-pr` |
| Forms, inputs, validation | `forms` |
| Calling an API, defining a contract | `api-contracts` |
| Bundle, render cost, jank | `performance-{web\|native}` |
| Errors, analytics, flags | `observability` |
| Metadata, tags, tracking | `seo-gtm` |
| Copy, i18n | `i18n` |
| Adopting standards in existing code | `legacy-adoption` |
| Repo layout, monorepo, microfrontends | `repo-topology` |
| Accessibility audit · Security audit | `a11y` · `security-scan` workflows |

Paths are `reference/{name}.md`. The installer resolves stack/runner placeholders
and prunes rows for references it did not install; the installation check rejects
any dangling row. Module commands update optional references and routing together.

## Configurable review thresholds

Read limits from `project.json`: component review size, post-split target,
extraction candidate size, PR size, prop-drilling depth, contrast, and touch
target. Crossing one starts a review; it does not prove the code is defective.
Cohesion, responsibilities, risk, and reviewability decide the outcome.

## TypeScript

**Types are the primary correctness tool. Treat a weak type as a defect.**

- Props and public boundaries remain typed. For parameters, returns, `any`, and
  assertions, follow `project.json#typescript`.
- Prefer inference when it is unambiguous and the policy permits it. Prefer
  `unknown` plus validation at untrusted boundaries. Never use `any` or `as`
  merely to silence a compiler error, regardless of policy.
- `import type`; `@ts-expect-error` with a reason, never `@ts-ignore`
- Constrain every generic; model impossible states out with unions; derive types
  rather than hand-copying a second definition

Everything else: `reference/typescript.md`

## Naming

| Kind | Convention |
| --- | --- |
| Files, directories | kebab-case |
| Components, classes | PascalCase |
| Variables, functions | lowerCamelCase |
| Env vars, constants | SCREAMING_SNAKE_CASE |
| Booleans | `is` / `has` / `should` |
| Handlers · handler props | `handle*` · `on*` |
| Translation keys | lowerCamelCase, dot-separated |

Filename matches its primary export. **Vue and Angular override the file rule —
see the framework file.** No abbreviations, no numeric suffixes, no
`data`/`info`/`manager` as a whole name.

## Errors

- `??` not `||` (which swallows `0` and `''`); `?.` for traversal
- Every data view handles **four** states: loading, empty, error, success.
  Empty and error must look different — they tell the user opposite things
- Never render a raw error; translate it
- No `console.log`; never log tokens or personal data
- Validate anything entering from an API, URL, storage, or deep link
- Catch only where you can act. Never swallow silently

## Structure

- Feature-based: related code lives together under its feature
- Data logic stays out of components — the framework file names the primitive
- UI-only state (modal open, hover) stays in the component
- Conditional arrays via `if`/`push`, not spread-ternary

## Comments

**Short and descriptive. No essays.**

- Comment **why**, never what. A comment restating the code gets deleted — it
  will drift out of date
- One line by default. Past three, rename or extract instead of explaining
- JSDoc on exported API only, not every internal function
- No history narration, no commented-out code, no banner comments
- `TODO:` needs context and an owner. A bare `TODO` is noise

## Documentation

**A feature is not done until the docs match it** — same change, not later.

- New feature, script, env var, or setup step → update the project `README`
- Changed behavior → fix every place it is described
- New env var → `.env.example` (never `.env`)
- Never leave a README describing something that no longer works. Stale docs are
  trusted, so they are worse than none

Checklist: `reference/definition-of-done.md`
