# Framework: Angular

**Naming override:** files carry a role suffix, class mirrors it —
`user-profile.component.ts` → `UserProfileComponent`, `user.service.ts` →
`UserService`. Follow whichever convention the existing code uses.

## Components

- Follow the Angular version and architecture declared in `project.json`.
  Standalone components are recommended for supported modern versions; legacy
  NgModule projects adopt incrementally.
- `ChangeDetectionStrategy.OnPush` on every component — default detection
  re-checks the whole tree and does not scale
- Signal `input()` / `output()` over the legacy decorators
- Template in a separate `.html` file past a few lines

## Templates

- `@if` / `@for` / `@switch` over legacy structural directives; `@for` needs `track`
- **No function calls in bindings** — they re-run every detection cycle. Use `computed()`
- `async` pipe over manual subscription

## Data

A **service or signal store** is the separation primitive — components render,
services hold data and logic.

Use `project.json#stack.stateManagement` and `project.json#stack.serverState` for
the repository's declared mechanisms; adopt recommendations incrementally.

- Signals for state, RxJS for streams and cancellation
- Expose readonly; mutate through methods
- Manual subscription without `takeUntilDestroyed()` is a leak
- `inject()` in field initializers over constructor injection

## Routing

Standalone lazy routes (`loadComponent` / `loadChildren`). Functional guards, not
class-based. Centralized link generation.

## Styling

Component styles are scoped by default; Tailwind is compatible if adopted.
`::ng-deep` is deprecated — prefer a CSS custom property exposed by the child, or
a fenced global rule. Never disable view encapsulation to make a selector reach.

Scaffolds and paths: `reference/scaffold-angular.md`.

Testing follows `project.json#stack.unitTestRunner` and its installed matching
reference. Execute only validation commands declared in trusted `standards/execution.json`.
