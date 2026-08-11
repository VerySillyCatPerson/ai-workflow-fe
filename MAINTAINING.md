# Maintaining ai-workflow-fe

This repo **is** the standards library. It is not an application. Nothing here
ships; it is consumed by other repos, by any AI tool, via `adapters/`.

## Three audiences

Do not mix them:

- **`standards/`, `workflows/`** — read by an AI agent inside a consuming
  project. Terse, prescriptive, checkable. **Names no tool, ever**
- **`adapters/`, `enforcement/`** — tool and toolchain wiring. The only place a
  tool may be named
- **`adoption/`** — read by humans: you, a team lead, an eng manager. Never
  installed into a project. How the estate is run, not how code is written

A rule about writing code never goes in `adoption/`. A tool name never goes in
`standards/`. A process for adopting standards never goes in the other two.

## Tool-agnosticism is the hard constraint

`standards/`, `workflows/`, `manifests/`, and `adoption/` name **no** AI tool. If
a rule cannot be written without naming one, it belongs in an adapter.

Only these may name a tool: `adapters/`, `scripts/` when validating a named
adapter, the root entry files, the `standards.json` changelog, and
`enforcement/` where it points at a specific adapter's file.

The test: could a user of any agent — or someone editing by hand with none — read
this file and know what to do? If not, it is in the wrong place.

| Leak | Write instead |
| --- | --- |
| A specific instruction filename | the agent instruction file |
| A tool's config directory | the enforcement config |
| A `/slash-command` name | the {name} workflow |
| "skill", "command", "rule file" | workflow |
| "the tool does X" | check `adapters/README.md` — support differs |

This is the rule most often broken while *writing about* the architecture. Stating
the constraint by naming a tool violates it.

## The layering rule

Three layers, and the boundary is the whole design. Before adding any rule,
decide which owns it:

| Layer | Owns | Test |
| --- | --- | --- |
| `standards/core/` | True in every framework on every platform | Identical in Angular and React Native? |
| `standards/platform/` | Depends on DOM-vs-device | Does it reference CSS, `aria-*`, `StyleSheet`, a device API? |
| `standards/framework/` | Depends on the framework | Does it name a specific API, directive, or file convention? |

**A rule goes in the highest layer where it is still universally true.** When in
doubt, principle in `core/`, mechanism in `framework/` — the pattern
`reference/testing.md` and `reference/testing-*.md` follow.

## Hard rules for editing

1. **Configurable thresholds live in `standards/project.json`.** Executable
   validation commands live in trusted `standards/execution.json`, which agents
   must not modify without explicit human approval. Source presets
   provide recommended values; shared standards refer to policy keys or named
   concepts, never one preset's number as a universal rule.
2. **`standards/core/` may never name a framework or platform.** If it mentions
   `useEffect`, `aria-label`, or `StyleSheet`, it is in the wrong layer.
3. **`platform/native.md` overrides, it does not extend.** React Native inverts
   several web rules; its override table must stay accurate. Add a row whenever
   you add a web rule that does not hold on native.
4. **Workflows delegate, they do not duplicate.** A workflow reads the loaded
   `framework/*.md` and follows it — which is why `component.md` is one file
   rather than five.
5. **Framework files carry the scaffolds.** Concrete shapes live in
   `reference/scaffold-{stack}.md`; the framework file carries the rules.

## Versioning

`standards.json` carries the version. **Bump on every material distributed change**
to `standards/`, `workflows/`, adapters, manifests, templates/schema, installer,
validator, or enforcement hooks, with a `changelog` line.

- **major** — a rule removed or inverted, or a layer restructured. Previously
  compliant code may now violate
- **minor** — a rule or reference file added
- **patch** — wording only

Without a bump, the sync workflow cannot tell a project it is stale and the whole
distribution model silently degrades. **A change with no bump is a bug.**

## Adding a framework

1. `standards/framework/{name}.md` — components, data primitive, routing, styling,
   i18n API, scripts
2. `standards/reference/scaffold-{name}.md` — shapes, paths, structure tree
3. `standards/reference/testing-{runner}.md` — wrapper, queries, async, a11y
4. An entry in **each** `adapters/*/` for the new stack, plus a note in
   `adapters/README.md`
5. `manifests/{name}.json` — `core`/`optional` split, plus an `excluded` block
   with a reason per entry
6. Note any `core/rules.md` override **in the framework file**, never by editing core
7. Row in the README composition matrix

## Adding a reference file

`reference/` costs no context until read — but it is **not** free. Every installed
file is one someone must keep current, and a stale standard is worse than a
missing one because it gets trusted.

1. Write `standards/reference/{topic}.md`
2. **Add its row to the routing table in `core/rules.md`.** No row, no reads
3. Add to every relevant manifest, defaulting to **`optional`** with a concrete
   install trigger. It earns `core` only by being needed on essentially every
   project in that stack
4. Add a workflow if it has an active procedure (`perf` → performance)
5. Bump `standards.json`

Platform-specific topics get **two files** (`performance-web` /
`performance-native`), never one with branching sections — the manifest then
installs only the right one.

**Resist adding to `core`.** The default install is ~24 files and should stay near
that. A standards set nobody can hold in their head gets ignored wholesale.

## Adding a workflow

`workflows/*.md`, flat — no subdirectories, since not every tool supports
namespacing. Frontmatter: `description` is required and must say **what it does
and when to use it**; `argument-hint` and `allowed-tools` are optional and
ignored by tools that do not use them.

A workflow must not restate framework specifics. It reads the loaded standard.
`name` frontmatter is required only when an adapter maps that workflow into a
skill format that requires it; currently this applies to `a11y.md` and
`security-scan.md`. Other workflows should not add inert `name` fields.

## Enforcement lives in three layers

| Layer | Mechanism | Scope |
| --- | --- | --- |
| Prose — `core/guardrails.md` | The agent should follow it | Whatever reads it |
| Tool config — `adapters/{tool}/` | Harness asks, refuses, or runs code on events | One tool |
| Local hook template — `enforcement/` | Installed commit checks | Consuming projects that enable it |

When a guardrail is mechanically checkable at the commit boundary, update the
optional shared hook template as well as relevant adapters. Do not call it CI
enforcement unless a consuming repository has installed a real CI job. Twin
guards must remain behaviorally aligned.

## Context budget

**Resident tier** — `core/guardrails.md` + `core/rules.md` + one `platform/` +
one `framework/` loads every session in every consuming project. Currently ~3k
tokens. Treat it as near-fixed.

A rule earns a place there only if its absence would produce wrong code *before*
the agent had any reason to go looking. Styling mechanism: yes. Test query
priority: no — the testing reference gets read when a test is written.

**`core/guardrails.md` is exempt from this argument.** Guardrails cannot be
on-demand: by the time you would fetch "don't commit without approval," you have
committed. Keep them terse; never move them.

The routing table at the top of `core/rules.md` is what makes the split safe.
Installation resolves stack/runner placeholders and removes rows for references
it did not install; `check` rejects dangling rows. Keep the parser contract and
installer tests current whenever the table format changes.

## Style

Terse and prescriptive. Say what to do; give a reason only where it prevents a
plausible wrong reading. Every rule should be checkable — a reviewer must be able
to tell whether a diff violates it.
