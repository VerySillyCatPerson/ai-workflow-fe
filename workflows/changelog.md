---
description: Summarize recent commits into a grouped, human-readable changelog entry. Use when asked to generate a changelog, summarize recent changes, or write release notes.
argument-hint: [number of commits]
allowed-tools: Bash(git log:*), Read, Edit
---

# Generate Changelog Entry

## Step 1 — Gather

`git log --oneline -{count}` (default 20 if `$ARGUMENTS` is empty).

## Step 2 — Group

Include only categories that have entries:

- **Features** — new capability
- **Fixes** — resolved bugs
- **Improvements** — refactors, performance, code quality
- **Accessibility** — a11y work, called out separately because it is usually
  invisible in a feature list and worth surfacing
- **Tests** — new or updated coverage
- **Chores** — dependencies, config, CI

## Step 3 — Write

- Skip merge and version-bump commits
- Combine related commits into one entry — readers care about the change, not
  the number of times it was touched
- Plain language, written for someone who did not read the diff. "Fixed the
  status filter clearing on page change", not "fix: reset filter state in effect"
- Lead each entry with the user-visible effect

```markdown
## [Unreleased] — {date}

### Features
- Added filtering by date range and status

### Fixes
- Fixed missing translation for the archived status label

### Accessibility
- Added accessible names to table sort controls
```

## Step 4 — Offer to write it

Ask whether to prepend the entry to an existing `CHANGELOG.md`. Prepend — never
append, and never overwrite the file.

## Anti-patterns

❌ Restating commit subjects verbatim
❌ One line per commit when three commits are one change
❌ Internal jargon in a changelog a user will read
