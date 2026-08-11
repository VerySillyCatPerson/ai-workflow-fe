---
description: Implement a change from a ticket while preserving its acceptance criteria. Use when a task is identified by an issue or ticket reference.
---

# Ticket to code

1. Resolve the requested ticket and retrieve its description and acceptance criteria.
2. Read relevant comments, attachments, and linked issues.
3. Identify linked design or documentation references.
4. Inspect the current repository implementation and reusable components or utilities.
5. Plan the smallest implementation that satisfies the requirements.
6. Implement within the installed project standards.
7. Run validation declared in trusted `standards/execution.json`.
8. Verify each acceptance criterion against the result.
9. Report unresolved requirements, assumptions, conflicts, and deviations.

Do not silently reinterpret the ticket to match the implementation.
