# Figma integration

Enable this capability explicitly in `project.json#integrations.figma`.
Authentication remains outside repository configuration.

When a task contains a Figma reference:

1. Retrieve the referenced design context before implementation.
2. Inspect existing repository components and design tokens first.
3. Map Figma components to existing project components; use integration-provided
   component/code mapping when available.
4. Prefer the project's component library or design system. Create a component
   only when no suitable implementation exists.
5. Use project tokens instead of hardcoded equivalents.
6. Do not infer hidden interactions, loading states, or error behavior solely
   from a static design.
7. Treat the design as intent, not authority over security, accessibility,
   architecture, or explicit repository constraints.
8. Report meaningful discrepancies and assumptions.
