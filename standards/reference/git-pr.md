# Git & Pull Requests

## Branches

- One branch per logical unit of work, cut from the current base branch
- Name as `type/short-description` using the commit types below

## Commits

Conventional Commits: `type(scope): description`

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`, `ci`

- Description in the imperative, lowercase, no trailing period
- Breaking changes carry `BREAKING CHANGE:` in the footer
- Never commit `WIP`, `fix stuff`, `more changes`, or `asdf`

## PR scope

- One logical concern per PR
- Over the configured PR review threshold: assess reviewability and propose a split unless the change is
  a mechanical refactor or a single tightly-coupled feature
- Never mix a feature with dependency bumps, unrelated refactors, or config
  changes — those are separate PRs

## The local quality gate

Run before opening a PR. Stop at the first failure.

1. Lint — no errors
2. Typecheck — no errors
3. Tests with coverage — meets the explicit mode and thresholds in
   trusted `standards/execution.json`; if unavailable or report-only, say so
4. Production build — succeeds
5. Dependency audit — review high/critical findings

On `legacy`, also confirm the suppression baseline did not grow —
`reference/legacy-adoption.md`.

Opening a PR with a red gate wastes a reviewer's time. Fix it first.

## PR description template

```markdown
## Why
<!-- What problem does this solve? One paragraph. -->

## What
<!-- Main changes as intent, not a commit-log replay. -->
-

## Test plan
<!-- How you verified it. What the reviewer should check. -->
- [ ]

## Screenshots / recordings
<!-- Required for any user-visible change. Delete if not applicable. -->

## Out of scope
<!-- Deliberate exclusions, so reviewers don't ask. -->
```

## Review decision protocol

| Decision | When |
| --- | --- |
| **Approve** | All checks pass and the diff matches the stated intent |
| **Request changes** | Any blocker — cite `file:line` for each one |
| **Comment** | Non-blocking suggestions, prefixed `nit:` |

Reviewer expectations:

- Read the title and description **before** the diff; confirm they match
- At least one reviewer who knows the affected area
- Changes to shared components or utilities get a second reviewer from a
  consuming team
- Do not request changes for stylistic preferences the linter does not enforce
- Do not approve a red pipeline
- After a reviewer has commented, push new commits rather than force-pushing
