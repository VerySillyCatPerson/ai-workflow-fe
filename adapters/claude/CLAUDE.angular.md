# {Project Name}

{One paragraph: what this app is, who uses it, what it talks to.}

@standards/core/guardrails.md
@standards/core/rules.md
@standards/platform/web.md
@standards/framework/angular.md

## Project specifics

Everything above is the shared standard. Everything below is true only of this
repo — put local deviations here rather than editing the imported files.

- **Project mode:** {greenfield | legacy}
- **Project policy:** `standards/project.json` (fill every policy value; integrations are opt-in)
- **Trusted execution:** `standards/execution.json` (do not edit without explicit human approval)
- **Angular version:** {version} — note if it predates standalone or signals
- **Component library:** {Angular Material / other}
- **State:** {signals / NgRx / component store}
- **i18n:** {@angular/localize / Transloco}, locales in {path}
- **File suffix convention:** {`.component.ts` / bare} — follow existing code
- **Test runner:** {Jest / Karma} · standard: `standards/reference/testing-angular.md`
- **Deviations from the standard:** {none, or list with reasons}
