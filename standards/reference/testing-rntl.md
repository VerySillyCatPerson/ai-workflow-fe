# Testing: React Native Testing Library

Principles in `reference/testing.md` apply; this file covers the concrete API.

**There is no DOM.** No `jest-axe`, no `container`, no CSS queries, no Cypress.

## Render wrapper

```ts
// Correct — includes navigation, query client, theme, i18n
import { render, renderHook } from '@/utils/test-utils'

// Wrong
import { render } from '@testing-library/react-native'
```

Navigation context is the one most often missing — a screen rendered without it
throws on the first `useNavigation()`.

## Query priority

1. `getByRole` — maps to `accessibilityRole`
2. `getByLabelText` — maps to `accessibilityLabel`
3. `getByText` — visible `<Text>` content
4. `getByDisplayValue` — current input values

Never `getByTestId`. Query visible text, displayed values, or real
`accessibility*` semantics. If an interactive component cannot be queried by role
or label, fix its VoiceOver/TalkBack semantics rather than adding a test-only prop.

## Interactions

```ts
import { userEvent } from '@testing-library/react-native'

const user = userEvent.setup()
await user.press(screen.getByRole('button', { name: /submit/i }))
await user.type(screen.getByLabelText('form.email'), 'test@example.com')
```

Prefer `userEvent` over `fireEvent`. Use `fireEvent` only for events `userEvent`
does not model (`scroll`, custom native module events).

## Accessibility assertions

Assert the props explicitly, since nothing checks them automatically:

```ts
const button = screen.getByRole('button', { name: /save/i })
expect(button).toBeEnabled()
expect(screen.getByLabelText('profile.avatar')).toBeOnTheScreen()
```

Automated checks cannot cover screen-reader focus order or gesture conflicts.
Manual VoiceOver and TalkBack passes remain required for any new screen.

## Native modules

This is the one place liberal mocking is correct — native modules have no JS
implementation in Jest. Most libraries ship a mock; register it in the Jest setup
file rather than per test. Check the setup file before adding a `jest.mock`.

## Navigation

Render the screen inside a real navigator from the test wrapper rather than
mocking the navigation module. Assert on what the user lands on, not on whether
`navigate` was called with the right string.

## Lists

`FlatList` renders a window, not the whole dataset. A query for row 500 fails
because it was never rendered — that is correct behavior. Assert on the first
page, or drive the list with a small fixture.

## Async

`findBy*` queries, and `waitFor` for non-query conditions. Never a real timer wait.

## Timers and animations

Use fake timers for debounce and timeout logic. Reanimated needs its Jest setup
registered; without it, animated components render but values never advance.

## E2E

Detox or Maestro against a built binary. Cover the same seven scenarios as the
web E2E set — happy path, loading, empty, search, filter, error, selection —
plus: offline, backgrounding and resume, and a permission denial.
