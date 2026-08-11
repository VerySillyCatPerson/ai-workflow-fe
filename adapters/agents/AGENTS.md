# {Project Name}

{One paragraph: what this app is, who uses it, what it talks to.}

> Template for tools reading `AGENTS.md` — Codex, Amp, Jules, Zed, and others.
> Copy to the repo root, fill the braces, delete this block.

## Read before doing anything

These are not optional. Read them at the start of the session, before writing code:

1. `standards/core/guardrails.md` — **overrides everything else.** Commit
   approval, no attribution trailers, no credential access, honest reporting
2. `standards/core/rules.md` — limits, types, naming, errors, comments, docs
3. `standards/platform/{web|native}.md` — pick the one your project installed
4. `standards/framework/{stack}.md` — pick the one your project installed

`standards/core/rules.md` opens with a routing table mapping each kind of task to
the `standards/reference/…` file to read first. **Follow it.** Those files are
deliberately not loaded up front — read them when the table says to, not before.

## Workflows

`workflows/*.md` are prompt documents for recurring tasks. When asked to do one
of these, read the file first and follow it:

| Ask | Workflow |
| --- | --- |
| Start a new project | `workflows/init.md` |
| Adopt standards in existing code | `workflows/onboard.md` |
| Create a component | `workflows/component.md` |
| Scaffold a feature | `workflows/feature.md` |
| Write tests | `workflows/test.md` |
| Check UI actually renders | `workflows/verify.md` |
| Review changes | `workflows/review.md` |
| Prepare a PR | `workflows/draft-pr.md` |
| Accessibility audit | `workflows/a11y.md` |
| Security audit | `workflows/security-scan.md` |
| Check standards are current | `workflows/standards-sync.md` |

The full set is in `workflows/`. Each states when it applies.

## Project specifics

Shared standards are above. Local deviations go here — **never edit
`standards/`**, which is shared and overwritten on sync. Deviations need a
reason, an owner, and a review date.

- **Stack:** {nextjs | react | vue | angular | react-native}
- **Project mode:** {greenfield | legacy}
- **Project policy:** `standards/project.json` (thresholds, strictness, stack choices, integrations)
- **Trusted execution:** `standards/execution.json` (human-approved commands; do not edit without explicit approval)
- **Component library:** {package, docs URL}
- **i18n:** {library, locales path, supported locales — or "single locale"}
- **Test utils:** `@/utils/test-utils`
- **API:** {base URL / client module / OpenAPI spec}
- **Deviations:** {none, or list with reason + owner + review date}
