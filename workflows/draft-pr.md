---
description: Run the pre-PR checklist — branch, scope, quality gate, commit messages — and generate a PR description from the diff. Use when asked to create, open, or draft a PR, or whether a branch is ready for review.
allowed-tools: Bash(git:*), Read
---

# Draft PR

Conventions: `standards/reference/git-pr.md`. Thresholds: `standards/core/rules.md`.

## Step 1 — Branch and scope

Find the PR's actual base branch from the PR metadata or repository settings.
If it cannot be determined, ask rather than assuming `main`. Then inspect
`git status`, the commit range from that base, and the full diff, including
uncommitted changes that would need to be included before opening a PR.

Check: branch name follows the type convention, based on the right base branch,
no untracked files that should be included, no committed files that should not be
(build output, `.env`, editor config, fixtures with real data).

Against `standards/project.json`: if the diff exceeds the PR review threshold, assess
reviewability and propose a split when it improves the change
unless it is a mechanical refactor or one tightly-coupled feature. Flag any mix
of feature work with dependency bumps, unrelated refactors, or config changes.

## Step 2 — Quality gate

Run the five gates from `standards/reference/git-pr.md` in order, using only
commands declared in trusted `standards/execution.json`. When a gate has no
declared command, report it as unavailable instead of guessing a script from
`package.json`. **Stop at the first failing configured gate and report it.**
Do not present an unverified branch as ready for review.

## Step 3 — Commit messages

Read commit subjects in the range from the actual base branch to `HEAD`.

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
