# Estate Management

`standards.json` and the `standards-sync` workflow handle **one** repo. This is how you keep
N repos across M teams aligned.

**The goal is not that every repo is on the newest version.** It is that you know
what every repo is on, and nothing has silently forked. A repo two minors behind
is fine. A repo whose version nobody knows is not.

---

## The registry

One file, in the standards repo, listing every repo using it.

```jsonc
// estate.json
{
  "client": "Acme",
  "standardsVersion": "1.0.0",         // current source version
  "minimumSupported": "1.0.0",         // below this, upgrade is mandatory
  "repos": [
    {
      "name": "acme-web",
      "stack": "nextjs",
      "team": "Web",
      "rep": "@jdoe",
      "installedVersion": "1.0.0",
      "lastSync": "2026-08-01",
      "deviations": 1
    },
    {
      "name": "acme-mobile",
      "stack": "react-native",
      "team": "Mobile",
      "rep": "@asmith",
      "installedVersion": "0.9.0",
      "lastSync": "2026-06-14",
      "deviations": 3
    }
  ]
}
```

Maintained by the standards owner, updated when a rep reports a sync. Keep it
boring — a stale registry is worse than none, because it is believed.

---

## Acceptable drift

| Gap | Status | Action |
| --- | --- | --- |
| Same version | Aligned | — |
| Within one **minor** | Fine | Sync at the team's convenience |
| Two or more minors | Drifting | Schedule a sync this quarter |
| Below `minimumSupported` | **Not aligned** | Upgrade before new feature work |
| Any **major** behind | **Not aligned** | Rules have changed meaning — treat as a project |
| Unknown | **Worst case** | No `standards.json`. Follow the `standards-sync` workflow now |

"Unknown" outranks "far behind" as a problem. A repo four minors behind is a
known quantity; a repo nobody has checked could be anywhere.

---

## Rolling out a version

**Patch / minor** — announce, reps follow the `standards-sync` workflow at their convenience,
registry updated. New rules apply to new code; nothing retroactive.

**Major** — a rule was removed, inverted, or a layer restructured. Previously
compliant code may now violate.

1. Write what changed and what it implies, per stack — not just the changelog
2. Land it on the **pilot repo first**. Majors are where a rule that reads fine
   turns out to be wrong in practice
3. Fix what the pilot exposes, then roll to the rest
4. Grandfather existing violations — `adoption/rollout.md` Phase 2 rules apply
   again. A major bump is not licence to enforce retroactively
5. Update `minimumSupported` only once every repo has moved

Never roll a major to every repo simultaneously. You lose the ability to tell
whether a problem is the change or the repo.

---

## Multi-repo, multi-team clients

The common shape: separate repos, separate teams, one client, and the standards
are the only thing holding them together.

- **One standards repo per client**, not per team. A per-team copy is a fork with
  extra steps
- **Each repo installs only its own stack's manifest.** A web repo holding
  `platform/native.md` is a bug — the `standards-sync` workflow flags it
- **Version alignment matters most on shared surfaces.** Two teams consuming the
  same design system or API contract should be on the same version; two unrelated
  internal tools need not be
- **`adoption/conformance.md` is the cross-team reference.** When mobile and web
  disagree about a rule, that document settles it — not whoever argues hardest
- **Deviations are per repo, tracked centrally.** The count lives in the registry
  so a repo quietly accumulating exceptions is visible. Five deviations is a
  signal the standard fits that team badly; take it to governance

---

## Health check

Run monthly. Five questions:

1. Is any repo missing a `standards.json`?
2. Is any repo below `minimumSupported`, or a major behind?
3. Has any repo not synced in two quarters?
4. Any deviation past its review date? (`adoption/governance.md`)
5. Any repo whose `standards/` differs from source by local edit?

Question 5 is the one that matters most and is easiest to miss —
The `standards-sync` workflow reports it per repo, but only when someone follows it.

---

## When to stop

If most repos are consistently drifting, the answer is **not** more process. It
means the standards do not fit, or nobody owns them. Take it to governance and
consider cutting rules rather than adding enforcement.

An estate of five repos does not need this file's full machinery. Scale the
process to the estate — a registry and a monthly glance is enough until it is not.
