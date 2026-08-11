# Figma capability routing

Use `workflows/design-to-code.md` for design-led implementation. When a ticket
also supplies requirements, use `workflows/ticket-design-to-code.md`.

Load this capability only when `project.json#integrations.figma.enabled` is true
and relevant Figma context is present. The active adapter decides how to retrieve
design context; these rules do not prescribe a client or protocol.
