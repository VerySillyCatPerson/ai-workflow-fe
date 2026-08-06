---
description: Run the pre-PR checklist — branch, scope, quality gate, commit messages — and generate a PR description from the diff. Use when asked to create, open, or draft a PR, or whether a branch is ready for review.
allowed-tools: Bash(git:*), Read
---

# Draft PR

Conventions: `standards/reference/git-pr.md`. Thresholds: `standards/core/rules.md`.

## Step 1 — Branch and scope

```bash
git status
git log origin/main..HEAD --oneline
git diff main...HEAD --stat | tail -1
```

Check: branch name follows the type convention, based on the right base branch,
no untracked files that should be included, no committed files that should not be
(build output, `.env`, editor config, fixtures with real data).

Against `standards/project.json`: if the diff exceeds the PR review threshold, assess
reviewability and propose a split when it improves the change
unless it is a mechanical refactor or one tightly-coupled feature. Flag any mix
of feature work with dependency bumps, unrelated refactors, or config changes.

## Step 2 — Quality gate

Run the five gates from `standards/reference/git-pr.md` in order, using this project's script
names (they differ by framework — check `package.json`). **Stop at the first
failure and report it.** Do not proceed to drafting a description for a branch
that does not build.

## Step 3 — Commit messages

```bash
git log origin/main..HEAD --format="%s"
```

Verify each against the Conventional Commits rules in `standards/reference/git-pr.md`. List any
that are vague or malformed, and suggest rewrites.

## Step 4 — Draft the description

Fill in the template from `standards/reference/git-pr.md` using the commit log and diff.

Write the **What** section as intent, not a replay of the commit log — the
reviewer can read the commits. Fill the **Test plan** with what you actually
verified, and say plainly if something was not verified. An empty **Out of
scope** section is fine; a wrong one is not.

## Step 5 — Report

State the gate results honestly, including anything that failed or was skipped.
Then list what the author still needs to do: reviewers to assign, labels, linked
ticket, screenshots for user-visible changes.

## Anti-patterns

❌ Drafting a description for a branch with a failing gate
❌ A title that describes nothing ("fix", "update", "changes")
❌ Claiming a test plan step you did not run
❌ Force-pushing after review has started
