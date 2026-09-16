# Consuming repository CI

Copy `standards-ci.yml` to the consuming repository's
`.github/workflows/standards.yml`. Set repository variable
`AI_WORKFLOW_SOURCE_REPO` to the standards source repository (`owner/name`)
and `AI_WORKFLOW_SOURCE_REF` to a reviewed source revision or tag. Set
`AI_WORKFLOW_INSTALL` to the consuming project's reviewed, reproducible
dependency command (for example, its package-manager lockfile install). A private
source repository needs a read-only credential in the second checkout step;
the consuming repository's default token cannot read another private repo.

The job runs the source CLI's `check` against the installed project, then the
project's trusted `standards/execution.json` commands. A PR with
`commands.lintChanged` uses paths changed since the PR merge base, delivered as
JSON in `AI_WORKFLOW_CHANGED_FILES`. Pushes and PRs without `lintChanged` run
the full `commands.lint`. Missing lint, typecheck, test, or build commands fail.
Coverage runs as a gate only for active coverage policy; report-only and
disabled coverage do not block CI.

The source checkout is explicit so the job can validate the installed lock and
managed adapters against the right manifests. Pin the source ref deliberately:
moving it can make previously installed projects report stale standards before
their own sync PR is ready.
