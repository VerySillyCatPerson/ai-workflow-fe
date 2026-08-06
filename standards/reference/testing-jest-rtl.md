# Testing: Jest + React Testing Library

For Next.js and React on web. Principles in `reference/testing.md` apply; this file
covers the concrete API.

## Render wrapper

```ts
// Correct — includes all providers
import { render, renderHook } from '@/utils/test-utils'

// Wrong — missing providers
import { render } from '@testing-library/react'
```

## Query priority

1. `getByRole` — buttons, links, headings
2. `getByLabelText` — form fields
3. `getByPlaceholderText` — when no label exists
4. `getByText` — visible content
5. `getByDisplayValue` — current form values

Never `getByTestId`. Query real semantics or visible behavior. If an interactive
element lacks a semantic query, fix its accessibility; do not add ARIA solely for testing.

## Async

```ts
// Prefer
await findByRole('link', { name: /back/i })

// Avoid
await waitFor(() => expect(getByRole('link', { name: /back/i })).toBeInTheDocument())
```

After the first `await` resolves, use sync queries:

```ts
await findByText('page.title')
getByText('page.count')
```

Absence: `expect(queryByText('error.message')).not.toBeInTheDocument()`

Scope: `within(getByRole('article', { name: 'Item 1' })).getByText('$120.00')`

## Interactions

```ts
await userEvent.click(getByRole('button', { name: /submit/i }))
```

Not `fireEvent` — `userEvent` dispatches the full realistic event sequence.

## Network

MSW. Global handlers in `mocks/handlers.ts`; `server.use()` for per-test
overrides only. Never `jest.mock` the fetch client.

## Accessibility

```tsx
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  expect(await axe(container)).toHaveNoViolations()
})
```

Include this in every component test.

## Hooks

`renderHook` from the project wrapper. Test initial state, then each handler's
effect on state, then that loading is set during a fetch and cleared after.

## Data-driven cases

```ts
it.each([
  ['active', 'Active'],
  ['pending', 'Pending'],
])('mapStatus(%s) returns %s', (input, expected) => {
  expect(mapStatus(input)).toBe(expected)
})
```

## Assertions

```ts
expect(submitButton).toBeDisabled()
expect(element).toHaveTextContent('expected text')
expect(link).toHaveAttribute('href', '/home')
```

Not raw prop or style inspection.

## Server Components (Next.js)

RTL renders client components. An async Server Component is tested by calling it
and asserting on the returned tree, or through an E2E spec — do not add
`'use client'` to make something testable.
