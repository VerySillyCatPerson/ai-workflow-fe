# Jira integration

Jira is a source of requirements and task context. Enable it explicitly in
`project.json#integrations.jira`; authentication remains outside the repository.

- Read issue descriptions, acceptance criteria, comments, attachments, linked
  issues, and linked designs when needed.
- Treat `project.json#integrations.jira.projectKeys` as the scope boundary for
  both reads and writes. Access to an issue whose key is not listed requires
  explicit approval before retrieving or mutating it. Never silently widen the
  configured project list.
- Mutating Jira requires explicit approval. `write: confirm` records that
  conservative policy; `write: never` disables writes.
- Creating or editing issues, comments, fields, assignments, priorities, or
  transitions is a write.
- Never change issue state merely because implementation completed.
- Never rewrite acceptance criteria to match the implementation.
- Report conflicts between the ticket and the codebase.
