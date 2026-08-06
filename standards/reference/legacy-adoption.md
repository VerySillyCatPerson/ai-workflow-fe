# Legacy Adoption

How to turn a rule on in a codebase that already violates it. This is the step
where adoption succeeds or dies.

**The whole trick: make the rule an error for new code and invisible for old
code, in one commit, with zero behavior change.** A team that opens the editor to
400 red squiggles concludes the standard is unusable and stops.

Project mode is `legacy` (see `core/rules.md`): coverage follows the explicit
policy in `standards/project.json`, DoD applies to the current change only, pre-existing violations are
grandfathered.

---

## The order that works

1. **Turn the rule on** — as an error, not a warning. A warning is noise nobody
   ever clears
2. **Generate a suppression baseline** in the same commit, so the build is green
3. **Commit the baseline separately** from the config change, and never review it
   line by line — it is generated
4. **Forbid growing the baseline.** This is the rule that matters; everything
   else is bookkeeping
5. **Shrink it opportunistically** — when you are already editing a file, clear
   its entry

Steps 1–3 are one afternoon. Step 4 is what makes the next two years work.

---

## ESLint

Modern ESLint supports a real baseline — violations recorded once, new ones fail:

```bash
<project lint command> --suppress-all .        # write the baseline
<project lint command> .                       # new violations fail
<project lint command> --prune-suppressions .  # remove clean entries
```

If your version has no baseline support, fall back to per-file disables with a
dated reason at the top of each offending file:

```js
/* eslint-disable @typescript-eslint/no-explicit-any --
   Grandfathered 2026-08-06 during standards adoption. Do not add to this file.
   Clear when this module is next touched. */
```

**Never a blanket disable at config level** and never an inline disable without a
reason — those are indistinguishable from a genuine exception, so nobody can tell
debt from decision later.

Add `--max-warnings 0` to CI so warnings cannot accumulate as a shadow baseline.

## TypeScript

Harder — **TS has no native suppression baseline.** Options, best first:

**Ratchet the flags one at a time.** Turn on the cheapest first, fix the fallout,
commit, move to the next. Typical order by pain:

```
noImplicitOverride → noFallthroughCasesInSwitch → strictNullChecks
  → noImplicitAny → noUncheckedIndexedAccess → exactOptionalPropertyTypes
```

`strictNullChecks` and `noUncheckedIndexedAccess` are the expensive two. Budget
them as real work, not config changes.

**Scope by directory.** A second `tsconfig.strict.json` that includes only
migrated paths, checked in CI alongside the loose root config. Move directories
across as they are cleaned. Verbose, but honest about where you actually are.

**`@ts-expect-error` with a dated reason** as the per-site fallback:

```ts
// @ts-expect-error Grandfathered 2026-08-06 — untyped legacy API client.
```

Better than `@ts-ignore` because it **fails once the underlying issue is fixed**,
so the debt removes itself. Never use `@ts-ignore` for this.

**Never** widen a type or add `any` to make a flag pass. That converts a visible
violation into an invisible one.

## Coverage

Do not set a repo-wide floor a legacy suite cannot meet — it will be lowered
until meaningless, or ignored.

Prefer changed-files or ratchet coverage for legacy projects, using the values
declared in project policy. Configure the exact command in the consuming project:

```bash
# CI: coverage of files touched in this PR, not the whole repo
<project coverage command configured for changed files>
```

Track whole-repo coverage as a **trend that may not fall**, separately from the
gate. Ratchet the floor upward as it rises; never downward.

## Formatting

Reformat the whole repo in **one commit that does nothing else**, then add the
hash to `.git-blame-ignore-revs`:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Without that file, one formatting commit destroys `git blame` for the entire
codebase and the team will never forgive it.

---

## Deciding what to grandfather

| Violation | Grandfather? |
| --- | --- |
| Style, naming, formatting | Yes — mechanical, zero risk, fix by codemod later |
| Missing types, `any` | Yes — ratchet per flag |
| Missing tests | Yes — gate changed files only |
| Oversized components | Yes — split when next touched |
| **Missing error/empty states** | **No** — real user-facing defects |
| **Accessibility blockers** | **No** — unlabeled controls, keyboard traps |
| **Secrets in client code** | **No** — fix immediately, then rotate |
| **Guardrail violations** | **No** — never grandfathered, ever |

The bottom four are **bugs that the standard happened to find**, not debt. Treat
them as findings with owners, not as baseline entries.

---

## Anti-patterns

❌ **Enabling as `warn`.** Warnings accumulate forever and nobody clears them
❌ **Fixing violations inside an unrelated PR.** It inflates the diff, buries the
   real change, and makes review dangerous. Separate commits, separate PRs
❌ **A cleanup sprint.** Large mechanical refactors with no feature pressure get
   deprioritized halfway and leave the codebase in two styles
❌ **Blanket config-level disables.** Indistinguishable from a real decision
❌ **Suppressions with no date or reason.** Debt you cannot age is debt you cannot
   pay down
❌ **Lowering a floor to go green.** Ratchets move one direction
❌ **Reformatting without `.git-blame-ignore-revs`**
❌ **Letting the baseline grow.** If it grows, the ratchet is broken and the whole
   exercise is theatre
