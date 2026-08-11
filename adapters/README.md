# Adapters

`standards/` and `workflows/` are the source. Only the **entry point** differs
between AI coding tools — every one reads some file from a known path, and an
adapter is that file.

## Tool support

| Tool | Status | Entry point | Reads referenced files? | Workflows |
| --- | --- | --- | --- | --- |
| **Claude Code** | Supported adapter | `CLAUDE.md` (`@` imports) | Yes | Slash commands + skills |
| **Codex / AGENTS.md tools** | Supported adapter | `AGENTS.md` | Yes | By path reference |
| **Cursor** | Supported adapter | `.cursor/rules/*.mdc` | Yes | By path reference |
| **Copilot** | Supported resident-only generator | `.github/copilot-instructions.md` | No | Not supported |
| **Windsurf** | Compatible, unvalidated | `.windsurf/rules/` | Expected | By path reference |
| **Aider** | Compatible, unvalidated | `CONVENTIONS.md` | Expected | By path reference |

“Compatible” means the generic path-reference approach may work, but this
repository does not ship or validate a dedicated adapter for it.

**Two classes of tool:**

- **Referencing** (everything except Copilot) — the entry file points at
  `standards/…` and the agent reads what it needs. This is the design the
  two-tier loading model assumes: resident files always, `reference/` on demand
- **Inline-only** (Copilot) — cannot open arbitrary files, so resident standards
  and the resolved `standards/project.json` must be flattened into the instruction
  file. Run `node adapters/copilot/build.mjs --stack <stack> --platform <platform> --policy standards/project.json`.
  Generation fails if policy is absent,
  unresolved, or mismatched. On-demand references remain unavailable

## Installing

1. Install with `--adapter claude|codex|cursor|copilot` (comma-separate multiple)
2. Fill the installed entry file's Project specifics
3. Fill stack choices in `standards/project.json` and human-review validation commands in trusted `standards/execution.json`
4. Optionally adapt and install `enforcement/` (see below)

Using two tools on one repo is fine: install both adapters. They point at the
same `standards/`, so they cannot disagree.

Claude's turn-end lint hook uses optional `commands.lintChanged` when configured,
passing a JSON file list through `AI_WORKFLOW_CHANGED_FILES`; otherwise it falls
back to `commands.lint`.

## Workflows

`workflows/*.md` are plain prompt documents. They keep YAML frontmatter because
Claude Code and Cursor both use it and everything else ignores it.

| Tool | Invocation |
| --- | --- |
| Claude Code | Copied to `.claude/commands/` → `/review`. `a11y` and `security-scan` go to `.claude/skills/` instead, so they auto-invoke |
| Cursor, Codex, Windsurf, Aider | "Follow `workflows/review.md`" — the entry file lists them |
| Copilot | Not supported; workflows are agentic |

## Enforcement templates

`enforcement/` is **not** an adapter. It contains optional local templates. They
run only after a consuming project adapts and installs them; this repository does
not ship a universal CI backstop.

| Layer | Scope |
| --- | --- |
| `enforcement/lefthook.yml` | Local commits after project installation |
| CI | Not shipped universally; configure the consuming repository's own CI from project policy |
| `adapters/claude/hooks/` | Claude Code only. Catches problems *earlier*, at edit time, but is not the only line of defence |

A tool-specific hook is an accelerator. Prose remains advisory, local hooks are
local checks, and only a configured consuming-project CI job is CI enforcement.

## Adding a tool

1. `adapters/{tool}/` with its entry file, pointing at `standards/` — never
   duplicating content
2. A row in the table above, honest about referencing vs inline-only
3. Map the workflows to whatever that tool calls them
4. **Do not** add tool-specific rules to `standards/`. If the tool needs
   something the standards cannot express, that is an adapter concern
