---
description: Bootstrap a new project to these standards — install the manifest, write tsconfig with the required flags, create the test-utils wrapper, wire lint and CI gates, and set project mode. Use when starting a greenfield project or when scaffolding commands fail because the project infrastructure does not exist yet.
argument-hint: [stack] [project name]
---

# Initialize a Project

Every scaffolding command assumes infrastructure that has to exist first: a
tsconfig with the mandated flags, the test-utils wrapper every testing standard
requires, lint config, and the `standards/` install. This creates it.

**For an existing codebase, use the onboard workflow instead** — it audits before it
proposes, which is what legacy needs.

## Step 1 — Confirm the stack and mode

From `$ARGUMENTS`, or ask: stack (nextjs · react · vue · angular · react-native)
and whether this is genuinely greenfield.

If the repo already has source files, **stop and recommend the onboard workflow**. Running
this over existing code overwrites config the team chose deliberately.

## Step 2 — Install the manifest

From `manifests/{stack}.json`, the `core` sets only:

- `resident` + `reference.core` → `standards/`
- `commands.core` + `skills` → `workflows/`
- **Adapter for the user's tool** → see `adapters/README.md` for the mapping.
  Ask which tool they use rather than assuming; installing two is fine, since
  both point at the same `standards/`. Then fill in **Project specifics**
- **`enforcement/`** → `lefthook.yml` + `enforcement/hooks/`, **committed**, then
  adapt its commands to `standards/project.json` before enabling it. It is an
  optional local check, not a universal CI backstop. Never invoke `npx`.
- **Tool hooks**, if the user's tool supports them — the adapter's `hooks/`
  directory into wherever that tool expects them (`adapters/README.md`). These
  catch the same problems earlier, at edit time: an accelerator, never the only
  line of defence

Run the installation check. The installer resolves and prunes the routing table;
a dangling row is an installation failure, not a manual follow-up task.

## Step 3 — Set project mode

Copy `templates/project.greenfield.json` to `standards/project.json` and
`templates/project.schema.json` to `standards/project.schema.json`. Then fill
the framework, stack choices, thresholds, and existing validation commands.

```md
- **Project mode:** greenfield
- **Project policy:** `standards/project.json`
```

Greenfield takes its explicit policy from commit one. There is nothing to grandfather,
so nothing gets the legacy discount.

## Step 4 — TypeScript config

Start from `templates/tsconfig.base.json` — it carries the flags
`standards/reference/typescript.md` mandates. Merge with the framework's own generated
config rather than replacing it; frameworks set `jsx`, `lib`, `moduleResolution`,
and `types` for reasons.

Configure the `@/` alias in **both** tsconfig and the bundler (Vite `resolve.alias`,
Metro, or the framework's built-in) — an alias in one but not the other fails at
runtime with a confusing error.

## Step 5 — Test wrapper

**Every testing standard in this repo forbids importing `render` directly from
the testing library.** That wrapper must exist before any test is written, or the
rule is unfollowable.

Create `src/utils/test-utils.tsx` (or the stack's equivalent) exporting `render`
and the hook-rendering helper wrapped in every provider the app uses — query
client, theme, i18n, router, auth, and navigation on native. Re-export the rest
of the testing library so a test needs one import.

Read `reference/testing-{stack}.md` for this stack's specifics before writing it.
Ask which providers the project will use rather than guessing.

## Step 6 — Quality gates

- Lint config with the project's rule set, `--max-warnings 0`
- Coverage threshold at the Step 3 floor
- Record only the project's actual format, lint, typecheck, test, coverage, and
  build commands in `standards/project.json#commands`; do not invent script names
- CI running all five, plus `api:check` if there is an OpenAPI spec

Greenfield is the only moment these are free to add. **Every gate is more
expensive to introduce later** — that is what `standards/reference/legacy-adoption.md` is
about, and this step is how a project avoids ever needing it.

## Step 7 — Project files

- `.env.example` with every variable, no values. **Never create or read `.env`**
- `.gitignore` covering `.env`, build output, coverage
- `README` with setup, scripts, and architecture — `standards/core/rules.md` requires it to
  stay current, so it must start correct

## Step 8 — Report

List what was created, what you assumed, and what still needs a human decision
(component library, i18n library, error reporting service). Do not silently pick
a design system or state library — those are the user's calls.

## Anti-patterns

❌ Running this over an existing codebase — use the onboard workflow
❌ Replacing a framework's generated tsconfig instead of merging
❌ Writing tests before the wrapper exists
❌ Picking a component library or state manager without asking
❌ Creating `.env`
❌ Installing every reference file "to be safe" instead of using the manifest
