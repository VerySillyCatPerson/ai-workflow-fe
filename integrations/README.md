# Optional capabilities and adapters

Core standards define portable engineering policy. Capabilities describe optional
context or actions, and integration directories adapt those capabilities to a
vendor or tool. Vendors are adapters, not architecture.

Install only the capability a project uses. Authentication belongs to the user's
client or integration environment; never put credentials in `project.json` or
any committed integration configuration.

Source conflicts are resolved in this order unless explicit project policy says
otherwise: security, accessibility, and repository constraints; explicit
requirements; design intent; existing conventions; agent inference. Never hide
a conflict by silently choosing one source.
