---
description: Compare this project's installed standards against the source repo, report version drift and local edits, and plan an upgrade. Use when checking whether standards are stale, after the standards repo changes, or before adopting a new version.
argument-hint: [path to the standards source repo]
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(diff:*)
---

# Standards Sync

Standards are distributed by copy, so every project holds a divergent snapshot
with no built-in way to know it is stale. This finds the drift.

**Report first. Change nothing without approval.**

## Step 1 — Establish versions

- Installed: `standards/standards.json` in this project
- Source: `standards.json` in the standards repo (path from `$ARGUMENTS`, or ask)

If the project has no `standards.json`, it predates versioning — say so and treat
every file as unknown-drift.

`standards/project.json` and its deviations are project-owned. Validate them,
but never replace them from a source preset during sync.

Report: installed version, source version, and the gap.

## Step 2 — Classify the version gap

Per the semantics in `standards.json`:

| Bump | Meaning | Action |
| --- | --- | --- |
| **patch** | Wording only | Safe to take wholesale |
| **minor** | Rules or reference files added | Take it; new rules apply to new code |
| **major** | A rule was removed, inverted, or a layer restructured | **Review required** — previously compliant code may now violate |

For a major bump, read the `changelog` and state specifically what changed and
what it implies for this codebase. Do not wave at it.

## Step 3 — Detect local edits

Diff each installed file against its source counterpart.

Local edits are the real hazard: an upgrade silently discards them, and a project
that edited `standards/` has requirements that are now invisible.

For each modified file, report the diff and classify:

- **Legitimate deviation** — belongs in `standards/project.json#deviations`, not
  as an edit to a shared file. Say so
- **Local fix worth upstreaming** — the standards repo should take it
- **Accidental drift** — overwrite on upgrade

## Step 4 — Check installation integrity

Against the project's manifest in `manifests/`:

- **Missing** files the manifest requires
- **Extra** files that should not be here — most importantly `standards/platform/web.md` in
  a native project or vice versa, which means the project is running
  contradictory rules
- Commands or skills for the wrong platform
- Routing-table entries in `standards/core/rules.md` pointing at `reference/` files that
  were never installed — a dead pointer means the model reads nothing and
  proceeds without the standard

## Step 5 — Report and propose

```
Installed 0.9.0 → source 1.0.0 (major)

New:      reference/forms.md, reference/seo-gtm.md
Changed:  core/rules.md (+comments, +docs sections)
Modified locally: platform/web.md — custom styling section
          → move to project.json deviations before upgrading
Missing:  reference/typescript.md (routing table points at it)
```

Then propose the upgrade as **discrete steps**, and wait for approval before
touching a file. Never overwrite a locally modified file without explicitly
confirming that specific file.

## Anti-patterns

❌ Overwriting local edits without surfacing them first
❌ Taking a major bump without reading what changed
❌ Editing shared standards to record a deviation — that belongs in `standards/project.json`
❌ Reporting "up to date" on version match alone without checking file drift
