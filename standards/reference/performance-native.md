# Performance: Native

Read before optimization work on React Native.

**Measure in a release build on a low-end device.** Dev builds and simulators
hide almost every real performance problem — the JS bundle is unminified, the
debugger slows the bridge, and a desktop CPU masks jank a three-year-old Android
phone will show immediately.

## Lists

The single biggest source of native performance complaints.

- `FlatList` / `SectionList` / FlashList — never `map()` inside a `ScrollView`.
  A `ScrollView` renders every child immediately; with 500 rows the screen hangs
- Stable `keyExtractor`
- `getItemLayout` for fixed-height rows — lets the list skip measurement
- `renderItem` points at a **memoized component defined outside the parent**. An
  inline arrow creates a new component identity every render and defeats recycling
- Tune `initialNumToRender`, `maxToRenderPerBatch`, `windowSize` for the row cost
- Paginate. Do not render everything the API returned

## Animation

- Run on the UI thread: Reanimated worklets, or `useNativeDriver: true`
- A JS-thread animation drops frames whenever JS is busy — which is exactly when
  the user is interacting
- `InteractionManager.runAfterInteractions` to defer heavy work until an
  animation finishes
- Target 60fps; profile with the platform tools, not by eye

## Rendering

- Memoize list rows and anything under a frequently-updating parent
- Keep state local; a store update re-renders every subscriber
- Avoid deep view nesting — each level costs layout
- No inline style objects in render (see `platform/native.md`)
- `removeClippedSubviews` for long off-screen content, with care

## Images

- Size and cache remote images; full-resolution images in a list will hitch
- A caching image component over bare `Image` for remote sources
- Correct `resizeMode`; never scale a huge source down in the view layer
- Prefetch images for the next screen when the transition is predictable

## Startup

Cold start is the most-judged metric in an app store review.

- Hermes on
- Defer non-critical work off the startup path — analytics init, feature flag
  fetch, and preloading do not belong before first paint
- Lazy-require heavy modules
- Audit native modules; each one adds startup cost and upgrade burden
- Measure time-to-interactive on a low-end device, not a flagship

## Memory

- Release listeners, timers, and subscriptions on unmount
- Watch for retained closures over large objects
- Profile with the platform memory tools — Android OOM kills are silent in JS

## Network

- Every request has a timeout, a retry policy, and a visible offline state
- Batch where the API allows; a phone pays a latency penalty per round trip
- Cache aggressively; assume the network is slow, metered, and intermittent
- Do not block first paint on a network response

## Bundle and release

- Check release bundle size on every release, and enable Proguard/R8
- Verify on the **oldest OS version and lowest-spec device** the project supports
- Feature-flag risky work — web ships a fix in minutes, this ships through review

## Avoid

- Profiling in dev or on a simulator
- `map()` over a large array in a `ScrollView`
- Inline `renderItem` arrows
- JS-thread animations
- Heavy work during app startup
- Assuming a fast network
- Testing only on the newest iPhone
