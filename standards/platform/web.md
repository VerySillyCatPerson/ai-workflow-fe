# Platform: Web

DOM, CSS, browser. Not for React Native — see `platform/native.md`.

## Styling

Use `project.json#stack.styling`. Prefer design tokens for
color, spacing, and type. Inline styles are allowed or forbidden by project
policy and framework constraints. A class string used 2+ times becomes a named constant;
shared across files, a component. Merge an incoming `className` with a
conflict-aware helper, never string concat.

The framework file names this stack's utility layer and its third-party escape hatch.

## Accessibility (WCAG 2.1 AA)

- Accessible name on every interactive element; icon-only controls always need one
- `aria-hidden="true"` on decorative icons and SVGs
- `alt` on every image — `alt=""` if decorative, never the attribute missing
- Labels on all inputs; errors linked via `aria-describedby`; required marked
- Use the semantic element: `<button>` not `<div onClick>`, `<ul>` for lists,
  `<table>` only for tabular data, explicit `type` on form buttons
- `aria-label` on a role-less `<div>` is ignored — give it a role
- Keyboard-operable in a logical order; never remove the focus ring without a
  visible replacement
- Modals trap focus and restore it on close; route changes move focus to the heading

Full checklist: the a11y workflow.

## Storage

Never put auth tokens or personal data in `localStorage`/`sessionStorage` — any
script on the page can read them. Use `httpOnly` cookies. Treat stored values as
attacker-modifiable.

## Security

No `dangerouslySetInnerHTML` / `v-html` / `[innerHTML]` without a real sanitizer.
No `eval` or string-form timers. Never interpolate user input into `href`, `src`,
or a redirect without validating it. Any client-visible env var is public.

Full audit: the security-scan workflow.

## Responsive & performance

Works from 320px, no horizontal page scroll. Respect `prefers-reduced-motion` and
`prefers-color-scheme`. Route-level code splitting by default, images sized and in
a modern format, nothing third-party blocking in `<head>`.

Budgets: `reference/performance-web.md`
