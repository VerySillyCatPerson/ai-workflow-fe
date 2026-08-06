# Testing: Vitest + Vue Testing Library

Principles in `reference/testing.md` apply; this file covers the concrete API.

## Render wrapper

```ts
// Correct — includes router, Pinia, i18n
import { render } from '@/utils/test-utils'

// Wrong
import { render } from '@testing-library/vue'
```

The wrapper must install i18n, or every query will match against raw keys and the
test proves nothing about what a user sees.

## Query priority

Identical to the React stacks — `getByRole` → `getByLabelText` →
`getByPlaceholderText` → `getByText` → `getByDisplayValue`. Never `getByTestId`;
fix missing semantics and never add ARIA solely for testing.

## Reactivity and flushing

Vue's DOM updates are asynchronous. A synchronous assertion straight after a
state change reads the old DOM.

```ts
import { flushPromises } from '@vue/test-utils'

await userEvent.click(getByRole('button', { name: /add/i }))
await flushPromises()
getByText('cart.itemCount')
```

Prefer `findBy*`, which waits for you, over a manual `nextTick`/`flushPromises`
where possible.

## Interactions

```ts
import userEvent from '@testing-library/user-event'
await userEvent.click(getByRole('button', { name: /submit/i }))
```

## Composables

Composables that use lifecycle hooks or `provide`/`inject` cannot be called bare
— they need a component instance. Use the project's `renderComposable` helper, or
mount a minimal host component:

```ts
const [result, app] = withSetup(() => useFeatureController())
expect(result.loading.value).toBe(false)
app.unmount()
```

Assert on `.value`. Test that the readonly exposures cannot be written directly.

## Pinia

Use `createTestingPinia()`. It stubs actions by default — pass
`stubActions: false` when the test is about what the action actually does. Never
share a store instance between tests.

## Network

MSW, same discipline as the React stacks: global handlers, per-test overrides for
edge cases only.

## Accessibility

No `jest-axe` here — use `vitest-axe` (or `axe-core` directly against the
container). Same rule: every component test includes an accessibility assertion.

```ts
import { axe } from 'vitest-axe'

it('has no accessibility violations', async () => {
  const { container } = render(FeatureCard, { props })
  expect(await axe(container)).toHaveNoViolations()
})
```

## Snapshot rendering

Do not shallow-render merely to simplify a test; it asserts on stubs. Follow the
configured snapshot policy. When snapshots are permitted, keep them focused on a
stable contract and prefer behavior assertions for component interaction.

## Data-driven cases

```ts
it.each([
  ['active', 'Active'],
  ['pending', 'Pending'],
])('mapStatus(%s) returns %s', (input, expected) => {
  expect(mapStatus(input)).toBe(expected)
})
```
