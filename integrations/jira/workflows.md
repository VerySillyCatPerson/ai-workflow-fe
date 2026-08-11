# Jira capability routing

Use `workflows/ticket-to-code.md` for ticket-led implementation. When a linked
design is part of the task, use `workflows/ticket-design-to-code.md`.

Load this capability only when `project.json#integrations.jira.enabled` is true.
The active adapter decides how to retrieve ticket context and must preserve the
read/write boundary in `integrations/jira/rules.md`.
