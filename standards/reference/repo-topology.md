# Repo Topology

How to install and scope these standards for single-app repos, monorepos, and
microfrontends.

**The core problem:** these standards are stack-specific by design, and
`platform/web.md` and `platform/native.md` directly contradict each other. One
root instruction file cannot serve a Vue app and a React Native app in the same repo.

> **"Agent instruction file"** means whatever your tool reads at the repo root
> or in its rules directory — `adapters/README.md` maps them. This document says
> *instruction file* throughout because the layout logic is identical across all
> of them.

---

## Single app (polyrepo)

The default. One stack, one root instruction file, one manifest.

```text
my-app/
├── <instruction file>     ← from adapters/{tool}/, points at standards/
├── standards/             ← from manifests/{stack}.json
│   ├── standards.json     ← version marker for the sync workflow
│   ├── core/ platform/ framework/ reference/
├── workflows/             ← prompt docs, invoked however your tool invokes them
└── <tool config dir>      ← enforcement config + tool-native workflow shims
```

**Across many repos** — separate repos, separate teams, one client, the most
common consulting shape:

- One standards repo **per client**, not per team. A per-team copy is a fork with
  extra steps
- Each repo installs only its own stack's manifest. A web repo holding
  `platform/native.md` is a bug
- Repos on different versions is fine; a repo that *does not know* its version is
  not. `standards.json` + the sync workflow on a cadence
- Version alignment matters most where teams share a surface — a design system or
  an API contract. Unrelated internal tools can drift further
- Cross-team rule disputes are settled by `adoption/conformance.md`, which
  documents what is identical everywhere and why the rest necessarily differs

Full process: `adoption/estate.md` and `adoption/governance.md`.

---

## Monorepo

Instruction files nest: the root file applies everywhere, and a file in a
subdirectory applies when work touches that subdirectory. Use this to scope stacks.

**Nesting support differs by tool — check `adapters/README.md` before relying on
it.** Some scope by directory or glob; others read only a single root file.
Where nesting is unsupported, either split the monorepo into
tool-configured workspaces, or accept one instruction file carrying both stacks
with the divergences stated explicitly (worse, but honest).

```text
monorepo/
├── <root instruction file>   ← guardrails + core ONLY. No platform, no framework
├── standards/                ← shared: core/, reference/, all platform+framework
├── workflows/
├── apps/
│   ├── web/<instruction>     ← standards/platform/web.md
│   │                           standards/framework/vue.md
│   └── mobile/<instruction>  ← standards/platform/native.md
│                               standards/framework/react-native.md
└── packages/
    └── ui/<instruction>      ← platform/web.md + the framework it targets
```

**The root file carries only what is universally true:** guardrails and
`core/rules.md`. Putting a platform or framework file at the root is the mistake
this layout exists to prevent — it applies Vue rules to the mobile app.

Rules:
- One stack per package. A package serving both web and native needs its rules
  split, not merged
- Shared `packages/*` state which platform they target in their own instruction file
- Install `standards/` **once** at the root; nested files reference it by relative path
- Version once, at the root `standards/standards.json`

**Caveat:** workflows are repo-wide — the e2e-native workflow is visible inside
the web app too. Keep the superset and rely on each workflow's platform guard
(they check the loaded platform standard and refuse when it does not match), or
split into package-local tool config if the noise is a real problem.

---

## Microfrontends

Independently deployed apps composed at runtime. The standards apply per
microfrontend, exactly as for a single app — plus the following, because the
failure modes here are integration failures, not code failures.

### Contracts

- **The host/remote boundary is a versioned API.** Type it, generate the types
  where possible, and treat a change as breaking until proven otherwise
- Shared dependencies (framework, design system) are declared **singletons** with
  explicit version ranges. Two React copies at runtime is the classic
  microfrontend outage
- Never reach into another microfrontend's internals. If you need its state,
  that is a contract gap — fix the contract

### Isolation

- **A remote failing to load must not blank the host.** Error boundary plus a
  timeout around every remote, with a degraded fallback
- Styles must not leak across boundaries: scoped styles, or a prefix convention
  agreed once and enforced
- One design system version at a time, or accept visible inconsistency
- Global state (auth, locale, theme) is provided by the host and consumed via a
  typed contract — never duplicated per remote

### Operations

- Every remote reports its own version and errors, tagged with which remote they
  came from. See `reference/observability.md`
- Performance budgets are **per remote and in aggregate**. Five remotes each
  "only 80KB" is a 400KB page
- Independent deploy means version skew is permanent, not transient: an old host
  will meet a new remote in production. Design contracts to tolerate it
- Integration tests run against the composed app, not only per remote. Every
  interesting bug in this architecture lives between the pieces

### Standards installation

Each microfrontend repo installs its own stack's manifest. Where they share a
design system, that repo carries its own too. Keep `standards.json` versions
aligned across the estate — divergent standards across microfrontends produce
exactly the inconsistency the architecture is already prone to.

---

## Choosing

| Situation | Layout |
| --- | --- |
| One app, one team | Single repo |
| Several apps sharing code, one org | Monorepo with nested instruction files |
| Independent deploy cadence per team, hard org boundaries | Microfrontends |

Microfrontends solve an **organizational** problem — independent deployment
across team boundaries — at a real technical cost. If the driver is technical
rather than organizational, a monorepo is almost always the better answer.
