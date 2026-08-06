# Governance

Who owns the standards, how they change, and how a team gets an exception.

**Without this, four teams become four standards inside a quarter** — not by
rebellion, but because someone hits a rule that does not fit, has no way to raise
it, and edits their local copy. Every drift starts as a reasonable local decision.

---

## Ownership

| Role | Responsibility |
| --- | --- |
| **Standards owner** (one named person) | Merges changes, bumps the version, keeps the estate aligned. Not a committee |
| **Team representative** (one per team) | Raises changes and deviations, follows the `standards-sync` workflow, answers "why does our stack differ" |
| **Everyone** | Follows what is installed, or raises a deviation. Never edits `standards/` locally |

If nobody is named as owner, these standards are already decaying. Name someone
before Phase 1 of the rollout.

---

## Changing a standard

**A team's local copy is never the place to make a change.** Local edits are
silently destroyed by the next standards sync, and everyone else keeps the old
rule.

1. **Raise it** — what rule, what problem it causes, on what evidence. "It is
   annoying" is not evidence; "it costs us an hour per PR and here is why" is
2. **Discuss** with the standards owner and the other team reps. A rule that
   fails for one stack often fails for all of them
3. **Decide** — one of:
   - **Change the standard** — it was wrong or too narrow. Update, bump the
     version, teams sync
   - **Move it down a layer** — it was in `core/` but is only true for one
     platform or framework. This is the most common correct outcome
   - **Grant a deviation** — the rule is right in general, wrong for this project
   - **Decline** — with the reason stated. A declined change that is explained
     stays followed; one that is ignored becomes drift
4. **Record it.** Even a decline. The next team will raise the same thing

**Turnaround matters more than the answer.** A change request that sits for three
weeks teaches the team to route around the process permanently.

---

## Deviations

A deviation is a project not following a rule, **on the record**. The alternative
is not compliance — it is silent non-compliance you find out about in six months.

Recorded in `standards/project.json#deviations`. Never duplicate the canonical
record in an adapter file and never edit shared standards to carry it.

```json
"deviations": [
  {
    "rule": "testing.coverage.mode",
    "reason": "Legacy suite is report-only while changed-files gating is introduced",
    "owner": "@lead",
    "review": "2026-Q4"
  }
]
```

Every deviation needs four things:

| Field | Why |
| --- | --- |
| **What rule** | Precisely, so standards sync and reviewers can see it |
| **Why** | The actual constraint, not "we prefer it" |
| **Owner** | A person, not a team |
| **Review date or trigger** | The part that stops it being permanent |

### Kinds

- **Temporary** — a real constraint that will pass (legacy suite, pending
  upgrade). Needs a date. Most deviations are this
- **Permanent** — structurally impossible to comply (framework version, client
  mandate, regulatory constraint). Still reviewed annually
- **Disguised change request** — several teams request the same deviation. That
  is a signal the *rule* is wrong. Escalate it to a change, not a fourth exception

### Never deviations

`core/guardrails.md` is not negotiable. Commit approval, attribution trailers,
credential access, honest reporting — no project-level exception, no client
exception. If a client asks, that is a conversation with the standards owner, not
a line in an instruction file.

---

## Cadence

| When | What |
| --- | --- |
| Standards repo bumps | Team reps follow the `standards-sync` workflow |
| Monthly | Owner checks estate versions (`adoption/estate.md`) |
| Quarterly | Deviations past their review date; declined requests raised twice |
| Per new team | Walk `adoption/conformance.md`, name a rep |

---

## Anti-patterns

❌ **A team forks the standards repo.** The whole value is one source. A fork
means the change process failed — fix that, do not bless the fork

❌ **Editing shared standards in a project.** Destroyed on sync, invisible to
everyone else. Deviations go in `standards/project.json`

❌ **Deviation with no owner or review date.** That is not a deviation, it is
permanent drift with paperwork

❌ **Standards owned by committee.** Nothing merges. One named owner, consulted
widely

❌ **Rules added faster than they are removed.** A standard nobody can hold in
their head gets ignored wholesale. Every addition should face "does this earn its
place in every project's context, forever?"

❌ **Enforcing on a team that never agreed.** Rollout is Phase 0 through 5 for a
reason. Skipping the assessment produces compliance theatre
