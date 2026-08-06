# Rollout

Copying 20 files is an install. This is the rollout.

**Two rules govern everything below.** First: **never enforce retroactively.** Turn
a rule on for new code with existing violations grandfathered — a team facing 400
errors on day one concludes the standard is unusable and stops. Second: **pilot
with one team.** A standard that survives contact with one codebase is credible
to the next four; one imposed on all teams simultaneously fails everywhere at once
and cannot be diagnosed.

---

## Phase 0 — Assess (before promising anything)

Per team, per repo:

- Follow the `onboard` workflow. It reports the stack, gaps, and a phased plan
- Read their existing config. **Where their config and these standards conflict,
  their config wins by default** — then discuss. Overriding a team's deliberate
  decision on day one costs all the goodwill you need for the rest of this
- Note anything that will need a permanent deviation (an Angular version
  predating standalone, a design system that mandates its own patterns)

Output: a per-team picture, and an honest estimate. Do not skip to Phase 1
because the assessment is unflattering.

## Phase 1 — Guardrails and core, no enforcement

Install the manifest's `core` sets. Nothing is enforced yet; the standard is
available and advisory.

- `core/guardrails.md` + the enforcement config — **these apply immediately and
  are not phased.** Approval before commits, no attribution trailers, no
  credential reads. There is no version of this that waits for buy-in
- `core/rules.md`, platform, framework files
- Walk the team through `adoption/conformance.md` — sections 1 and their own rows

The goal of this phase is that new code trends toward the standard because it is
present, not because anything blocks. Give it two to three weeks.

## Phase 2 — Enforce forward

Turn on the checks, grandfathering everything that exists.

- Lint rules and strict TS flags **on**, existing violations captured in a
  suppression baseline in the same commit
- Coverage follows the explicit legacy mode and thresholds in
  `standards/project.json`; changed-files or ratchet mode is the recommended
  starting point, with whole-repository coverage tracked as a trend
- Use the `review` workflow in the team's normal flow before a PR
- PR template from `reference/git-pr.md`

**`reference/legacy-adoption.md` has the per-toolchain mechanics** — ESLint
baselines, the TS flag ratchet order, `.git-blame-ignore-revs`, and which
violations must *not* be grandfathered. This phase fails without them.

Now no *new* violations land. This is the highest-leverage phase and the one
teams tolerate best, because it never asks them to stop feature work.

## Phase 3 — Add modules as teams reach them

Pull `optional` reference files at their trigger, not in advance. Each manifest
carries the trigger per entry.

Typical order:

| Trigger | Install |
| --- | --- |
| First real form | `reference/forms.md` |
| First API integration | `reference/api-contracts.md` + the `api-types` workflow |
| Perf budget set, or a regression | `reference/performance-{web\|native}.md` + the `perf` workflow |
| Adding error reporting or analytics | `reference/observability.md` |
| Public pages that must rank | `reference/seo-gtm.md` |
| Monorepo or microfrontends | `reference/repo-topology.md` |

Some are near-certain per stack and worth installing in Phase 1 — the manifests
mark these *promote early*: `performance-native` for React Native,
`security-headers` for Next, `forms` for Angular.

## Phase 4 — Pay down the grandfathered debt

Only now, and only with the team's agreement on pace. The `onboard` workflow's migration plan
is the backlog. Sequence by risk reduced per unit of effort; mechanical fixes
first, structural refactors behind them.

This phase never "finishes," and that is fine. Forward enforcement means the debt
is bounded and shrinking.

## Phase 5 — Steady state

- Follow the `standards-sync` workflow quarterly, or whenever the standards repo bumps
- Deviations reviewed at their recorded review date (`adoption/governance.md`)
- Estate-wide version check (`adoption/estate.md`)

---

## Greenfield

Faster. Phases 1 and 2 collapse into project setup — everything enforced from the
first commit, since there is no existing code to grandfather. Phase 3 still
applies: do not install nine reference files into an empty repo.

## Multi-team sequencing

1. **Pilot** with the team most likely to succeed — smallest codebase, most
   receptive lead. Not the one with the worst code
2. **Fix what the pilot exposes** in the standards repo before team two. The
   pilot will find wrong or missing rules; that is what it is for
3. **Roll to remaining teams** with the pilot lead as reference, not you. A peer
   who has done it is far more persuasive than the consultant who wrote it
4. **Cross-stack teams last** — mobile after web, or vice versa. They surface the
   platform-divergence questions that `adoption/conformance.md` exists to answer,
   and you want that document already battle-tested

## Signals it is going wrong

- A team disables rules locally instead of raising a deviation → the change
  process is unclear, or too slow. Fix `adoption/governance.md`
- Blanket suppressions appearing in new code → Phase 2 landed before Phase 1 was
  understood
- One team's `standards/` diverging by edit → they needed a deviation and did not
  know how to ask
- Nobody has followed the `standards-sync` workflow in a quarter → no owner. See governance
