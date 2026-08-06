# Framework: React Native

Loads `platform/native.md`, **not** `platform/web.md` — several web rules invert.

## Components

- Functional, named exports. Order: hooks → computed → effects → handlers → return
- Every touchable is `Pressable` (or the project wrapper), never a `View` with a
  touch handler
- Platform variants as `.ios.tsx` / `.android.tsx` siblings

## Data

Use `project.json#stack.serverState` and a `use{Feature}Controller` hook where it
fits the declared architecture. A phone loses the network mid-request routinely.
Every request needs a timeout decision and visible failure behavior. Retry only
when safe for that operation.

## Lists

For long, dynamic, or paginated lists use `FlatList` or the virtualized list
declared in `project.json`, with a
stable `keyExtractor`, `getItemLayout` for fixed rows, and a memoized `renderItem`
defined outside the parent. Paginate large results; a small fixed list does not
need virtualization.

## Navigation

Use the navigation system declared in `project.json`. Keep one typed route param list, no untyped
`navigate()`. **Pass ids, not objects.** Deep-link config in one place, validated.

## i18n

`Intl` support depends on the JS engine build — verify formats on device, not
just in the simulator. RTL needs `I18nManager` handling, not only translated strings.

## Release

Web ships a fix in minutes; this ships through review. Feature-flag anything
risky, verify size and performance in release builds, keep native module
additions deliberate.

Scaffolds and paths: `reference/scaffold-react-native.md`.

Testing follows `project.json#stack.unitTestRunner`; E2E follows
`project.json#stack.e2eRunner`. Use installed references matching those choices.
Execute only validation commands declared under `project.json#commands`. Shared
state follows `project.json#stack.stateManagement`.
