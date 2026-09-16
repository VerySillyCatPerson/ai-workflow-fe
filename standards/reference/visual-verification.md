# Visual Verification

`reference/definition-of-done.md` requires *"actually ran it — a green build is
not a working feature."* This is how that is satisfied rather than asserted.

**Frontend's defining problem: correctness is visual, and the toolchain is
text.** A component can typecheck, pass every unit test, and render as a stack of
overlapping boxes. Nothing upstream of a rendered pixel catches that.

---

## When verification is required

| Change | Required? |
| --- | --- |
| Layout, spacing, styling, theming | **Yes** |
| New or restructured component | **Yes** |
| Animation, transition, timing | **Yes** — and a static screenshot is not enough |
| Responsive or breakpoint work | **Yes**, at both extremes |
| Anything the user described in visual terms | **Yes** |
| Pure logic, types, tests, docs | No |
| Copy change with no layout impact | No |

**When it is required and you did not do it, say so.** "Typechecks and unit tests
pass; not visually verified" is an honest report. "Done" is not.

---

## Pick the tool the project already has

In order. **Do not add a second browser-automation tool** — a repo with Cypress
does not need Playwright installed to take one screenshot.

1. **Playwright already installed** → use it
2. **Cypress already installed** → use it (`cy.screenshot()`, `cy.viewport()`)
3. **Neither** → ephemeral Playwright: run it, capture, remove it. Never commit it
   to `package.json` as a side effect of a verification run
4. **React Native** → see below; this section is web-only

Adding a dev dependency is a supply-chain decision under `core/guardrails.md`.
**Ephemeral use is fine; installing without asking is not.**

## Web flow

```
1. Start the dev server (or a production preview for perf-sensitive work)
2. Navigate to the affected route
3. Capture: default viewport, plus 320px and a wide one for responsive work
4. Read the screenshot back and actually look at it
5. Capture the console — a clean-looking page with a red console is not passing
```

**Before/after is what makes this useful.** A single "after" screenshot only
proves something rendered. For existing UI, use a screenshot captured before
editing, an existing trusted screenshot, or a separate clean checkout of the
base revision. Do not disturb the current worktree to obtain a baseline.

Compare the two directly when a comparable baseline exists. If it does not,
report that limit and still inspect the rendered after state. Report anything
you did **not** intend to change — unintended layout shift elsewhere on the
page is the single most common regression this catches.

For a component with a story, screenshot the story rather than booting the whole
app: faster, isolated, and deterministic.

## Native flow

Heavier, and there is no ephemeral option.

- Simulator/emulator screenshot via the platform CLI, or Maestro if the project
  uses it
- Verify on **both** platforms when the change touches layout — iOS and Android
  diverge on fonts, shadows, and safe areas
- Check at a large font scale (`platform/native.md` requires font scaling support,
  and clipping only appears at the extremes)

If no simulator is available in the environment, **say so and mark the change
unverified.** Do not substitute a unit test and call it verified.

---

## What counts as verified

- [ ] The affected UI was **rendered and looked at**, not inferred
- [ ] Compared against the before state for pre-existing UI, or reported why a
      comparable baseline was unavailable
- [ ] Console clean, or the noise explained
- [ ] Narrow and wide viewport (web) or both platforms (native) for layout work
- [ ] Unintended visual changes reported, not just the intended one

Automated pixel diffing is a **CI** concern, not this. Here the requirement is
that someone — you — looked at the actual output before claiming it works.

---

## Avoid

❌ Claiming visual verification from a passing unit test
❌ Installing Playwright or Cypress into `package.json` without asking
❌ Adding a second browser-automation tool alongside an existing one
❌ Claiming a before/after comparison from a single "after" screenshot
❌ Screenshotting only the happy path when loading, empty, and error states also
   changed (`core/rules.md` requires all four)
❌ Ignoring console errors because the page looks right
❌ Reporting "done" when the environment made verification impossible — report
   *unverified* instead
