# Testing: Angular

Principles in `reference/testing.md` apply; this file covers the concrete API.

Prefer **Angular Testing Library** over bare `TestBed` fixture manipulation. It
gives the same role/label query discipline as the other stacks and keeps tests
off internal component members.

## Setup

```ts
import { render, screen } from '@testing-library/angular'

await render(UserProfileComponent, {
  inputs: { user: mockUser },
  providers: [{ provide: UserService, useValue: mockService }],
})
```

Standalone components are imported directly — no `declarations`, no host module.

## Query priority

Identical to the other stacks: `getByRole` → `getByLabelText` →
`getByPlaceholderText` → `getByText` → `getByDisplayValue`. Never `getByTestId`;
fix missing semantics and never add ARIA solely for testing.

## Change detection

Angular does not re-render until change detection runs. Angular Testing Library
triggers it for you on user events; raw `TestBed` requires `fixture.detectChanges()`.
With `OnPush` components, a mutation that does not change a signal or input
reference will not re-render — that is the framework working correctly, not a
test problem to work around.

## Async

- `await screen.findByRole(...)` for content that arrives after a request
- `fakeAsync` + `tick()` for timer-driven code
- `await fixture.whenStable()` when awaiting outstanding async work
- Never a real `setTimeout` wait

## Interactions

```ts
import userEvent from '@testing-library/user-event'
await userEvent.click(screen.getByRole('button', { name: /submit/i }))
```

## Services and stores

Test these directly — no `TestBed` needed for a plain signal store:

```ts
const store = new FeatureStore()
store.handleSearch('query')
expect(store.data()).toHaveLength(2)
```

Inject via `TestBed.inject(Service)` only when the service has dependencies worth
resolving through DI.

## Observables

- Test emissions, not subscription internals
- Marble tests for timing-sensitive stream logic; plain `firstValueFrom` for a
  single expected value
- Assert that subscriptions are cleaned up on destroy

## HTTP

`HttpTestingController` for services that call `HttpClient`. Always
`httpMock.verify()` in `afterEach` — an unmatched request is a real bug the test
would otherwise hide.

## Accessibility

`jest-axe` works against the rendered container:

```ts
const { container } = await render(UserProfileComponent, { inputs })
expect(await axe(container)).toHaveNoViolations()
```

## Angular Material

Use component **test harnesses** rather than querying Material's internal DOM.
Harnesses survive Material version upgrades; CSS selectors into its internals do not.

## Avoid

- Asserting on `component.someProperty` — test rendered output, not fields
- `fixture.debugElement.query(By.css(...))` when a role query works
- Snapshots outside the configured snapshot policy
- `NO_ERRORS_SCHEMA` to silence unknown elements — import the real component or
  provide a deliberate stub
