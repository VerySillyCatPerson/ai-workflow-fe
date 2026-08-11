---
description: Read the project's quality configuration — TypeScript, lint, coverage, build — and summarize the constraints that will fail the pipeline. Use at session start or before generating code in an unfamiliar project.
allowed-tools: Read, Glob, Grep
---

# Pre-Task Quality Gate Check

Establish what the pipeline will reject **before** writing code.

## Step 1 — Read what exists

- `tsconfig.json` (and any extended base config)
- Lint config — `eslint.config.*`, `.eslintrc*`, or the framework's equivalent
- Test config — coverage thresholds and exclusions
- `package.json` — the actual script names, which differ by framework
- Formatter config
- Any static-analysis config (SonarCloud, etc.)
- CI workflow — the gates that run on the branch may exceed the local ones
- `standards/project.json` — intended policy and stack choices
- `standards/execution.json` — trusted locally executable validation commands

## Step 2 — Report

**TypeScript** — strict mode and which flags; options that change codegen
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`);
path aliases; target and module resolution.

**Lint** — extended rule sets; rules that commonly catch generated code
(`import/order`, `no-console`, unused vars, exhaustive-deps); notable rules
turned **off**, since those signal deliberate project decisions.

**Coverage** — thresholds per metric, excluded paths, and whether CI enforces a
stricter bar than the local config.

**Commands** — compare real format, lint, typecheck, test, coverage, and build
commands with `standards/execution.json`; update stale executable configuration only with explicit human approval.

## Step 3 — Watch out for

End with the top 3–5 things most likely to fail the pipeline for this specific
config, stated concretely. "`noUncheckedIndexedAccess` is on, so every array
index access needs a guard" — not "be careful with types".

If any config file is missing entirely, say so. Compare executable configuration
with `standards/project.json`: a declared threshold without a matching gate is
advisory, and a real CI gate absent from policy means the policy is stale.
