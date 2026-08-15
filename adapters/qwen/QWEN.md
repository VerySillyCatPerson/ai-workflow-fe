# {Project Name}

Read these project instructions at the start of a session:

1. `standards/core/guardrails.md` — safety and authorization boundaries
2. `standards/core/rules.md` — shared rules and task routing
3. `standards/platform/{web|native}.md` — installed platform policy
4. `standards/framework/{stack}.md` — installed framework policy

Follow the routing table in `standards/core/rules.md`. Load optional references
and workflows only when the task calls for them. Configured Figma and Jira
capabilities remain subject to installed integration rules and guardrails; MCP
availability does not grant access or approval. Do not change Qwen sandbox,
approval, MCP, or credential settings on the user's behalf.

## Project specifics

Shared policy is above. Put local context and documented deviations here; never
edit managed files under `standards/`.

- **Project mode:** {greenfield | legacy}
- **Project policy:** `standards/project.json`
- **Trusted execution:** `standards/execution.json` (do not edit without explicit human approval)
- **Stack:** {stack} / {web|native}
- **Deviations:** {none, or list with reason, owner, and review date}
