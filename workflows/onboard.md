---
description: Audit an existing codebase against these standards and produce a gap report plus a prioritized, incremental migration plan. Use when adopting the standards in an existing project, when asked to assess code health, or to find out how far a repo is from the conventions.
argument-hint: [path or subdirectory to scope the audit]
---

# Onboard an Existing Project

Everything else here scaffolds new code. This audits code that already exists.
For an empty repo use the init workflow instead.

**Produce a plan. Change nothing.** Migrating a codebase is the user's decision to
sequence and approve — see `standards/core/guardrails.md` on scope.

**This command is Phase 0 of `adoption/rollout.md`.** Read that document first —
its phases are the plan you are producing input for, and
`standards/reference/legacy-adoption.md` holds the mechanics for actually turning a rule on
without breaking the build. Do not invent a competing sequence.

## Step 1 — Identify the stack

Do not assume. Determine from `package.json`, config files, and file extensions:

- Framework and version; whether it predates a major shift (Angular standalone,
  Vue Composition API, Next App Router)
- Platform: web or native
- Test runner, i18n library, styling approach, state management
- Repo topology — single app, monorepo, or microfrontend
  (`standards/reference/repo-topology.md`)

Report what you found and which manifest in `manifests/` fits. If the project is
a stack these standards do not cover, say so plainly and stop.

## Step 2 — Read the constraints

Run the the precheck workflow steps: tsconfig, lint, coverage, CI. Note where CI is stricter
than local config. Existing config tells you what the team already agreed to —
respect it over these standards where they conflict, and flag the conflict.

## Step 3 — Audit

Sample broadly rather than reading everything; report coverage honestly ("audited
12 of ~80 components"). Check against the loaded standards:

| Area | Look for |
| --- | --- |
| **Types** | `any`, `as`, `@ts-ignore`, missing strict flags, hand-written API types |
| **Structure** | Components crossing proposed review thresholds, tangled data logic, no feature boundaries |
| **State** | Server state mirrored into local state, prop drilling, `useEffect` fetching |
| **Error handling** | Missing empty/error states, swallowed errors, raw errors rendered |
| **Accessibility** | Unlabeled controls, `div` click targets, unassociated form labels |
| **i18n** | Hardcoded strings, keys missing from locales |
| **Tests** | Coverage, `getByTestId` usage, snapshot tests, missing a11y assertions |
| **Performance** | Bundle size vs budget, unvirtualized lists, unsized images |
| **Docs** | README describing behavior that no longer exists |
| **Security** | Secrets in client code, tokens in storage — run the security-scan workflow |

## Step 4 — Report

**Do not produce a list of 400 violations.** That gets ignored. Group into themes,
count instances, and name the highest-impact file per theme.

For each theme:
- What the gap is, with instance count and 2–3 representative `file:line`
- The risk of leaving it
- Effort: mechanical (codemod-able), moderate, or requires design decisions

## Step 5 — Map findings onto the rollout phases

Do not invent a sequence. Assign each theme to a phase from `adoption/rollout.md`:

| Phase | Takes |
| --- | --- |
| **1** — install, no enforcement | The manifest `core` sets; walk the team through `adoption/conformance.md` |
| **2** — enforce forward | Every rule that can be turned on with a baseline. **Highest leverage** — see `standards/reference/legacy-adoption.md` for the per-toolchain mechanics |
| **3** — add modules | Optional reference files this codebase already needs (it has forms → `forms.md`) |
| **4** — pay down debt | Everything grandfathered in Phase 2, ordered by risk reduced per unit of effort |

**Separate the debt from the bugs.** Missing error/empty states, accessibility
blockers, and secrets in client code are **not** grandfatherable — they are
defects the audit happened to find. Report them as findings with owners, outside
the phase plan. `standards/reference/legacy-adoption.md` has the full table.

Give each phase a rough size and say what unblocks what. Flag anything needing a
product decision rather than assuming it.

## Step 6 — Propose the install

Recommend a manifest from `manifests/`, `core` sets only, and state:

- **Project mode:** `legacy` — copy the legacy preset to
  `standards/project.json`, then adjust it from evidence in this repository
- Confirm the installer pruned routing rows for references it did not install and
  that the installation check reports no dangling routes
- Which **deviations** to record in `standards/project.json`, each with a reason,
  owner, and review date per `adoption/governance.md`. A standard the project
  deliberately does not follow belongs there, not silently violated

## Anti-patterns

❌ Changing code — this command produces a plan
❌ A flat list of every violation
❌ Recommending a rewrite
❌ Ignoring existing project config in favor of these standards
❌ Auditing web rules against native code, or vice versa
❌ Implying full coverage when you sampled
