# {Project Name}

{One paragraph: what this app is, who uses it, what it talks to.}

@standards/core/guardrails.md
@standards/core/rules.md
@standards/platform/web.md
@standards/framework/vue.md

## Project specifics

Everything above is the shared standard. Everything below is true only of this
repo — put local deviations here rather than editing the imported files.

- **Project mode:** {greenfield | legacy}
- **Project policy:** `standards/project.json` (fill every policy value; integrations are opt-in)
- **Trusted execution:** `standards/execution.json` (do not edit without explicit human approval)
- **Component library:** {package name, docs URL}
- **State:** Pinia stores in {path}
- **Styling:** {Tailwind utilities / scoped styles} — pick one and note it here
- **i18n:** vue-i18n, locales in {path}, supported: {list}
- **Test utils:** `@/utils/test-utils` · standard: `standards/reference/testing-vitest-vtl.md`
- **Nuxt:** {yes — note SSR boundaries / no}
- **Deviations from the standard:** {none, or list with reasons}
