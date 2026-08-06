# Cross-Stack Conformance Map

Use this with team leads to explain what is shared, what is configured per
project, and why platform or framework mechanics differ. Conformance means
following the same policy model, not forcing every repository to use the same
number or library.

---

## 1. The shared taxonomy

Every expectation belongs to one of four strengths. Do not present a
configurable policy or recommendation as an invariant.

### Guardrails

Safety and authorization rules from `core/guardrails.md`. These are not relaxed
through project policy:

- Explicit authorization for commits, deployment, destructive actions, and dependencies
- No credential access or disclosure
- No attribution trailers or bypassed hooks
- Honest reporting of checks, failures, and incomplete work
- Respect for scope and explicit prohibitions

### Invariants

Shared outcomes. Projects may use different mechanisms, but the outcome remains:

| Outcome | Source |
| --- | --- |
| Validate untrusted boundary data | `core/rules.md`, `reference/api-contracts.md` |
| Do not swallow failures or render raw errors | `core/rules.md` |
| Consider loading, empty, error, and success states where applicable | `core/rules.md` |
| Give interactive UI an accessible name and appropriate semantics | platform standards |
| Keep business/data logic behind a testable boundary | core + framework standards |
| Keep documentation aligned with externally visible behavior | `core/rules.md` |
| Prefer behavior-oriented tests and semantic queries | `reference/testing.md` |
| Do not add test-only selectors or ARIA solely for tests | `reference/testing.md` |
| Do not expose secrets or personal data | guardrails + platform standards |

### Configurable policy

These values may legitimately differ. Every project records its effective values
in `standards/project.json`:

| Area | Examples |
| --- | --- |
| Review thresholds | Component, extraction, post-split, PR, prop-drilling depth |
| Accessibility thresholds | Contrast and touch-target values |
| TypeScript strictness | `any`, assertions, explicit parameter and return annotations |
| Testing strictness | Snapshots, coverage mode and metric values |
| Stack choices | Styling, state, server-state, unit and E2E tools |
| Executable gates | Format, lint, typecheck, test, coverage, and build commands |

The shared principle is that policy is explicit, reviewable, and does not regress
silently. A value from a recommended preset is not universal merely because it
is the default.

### Recommendations

Framework and reference files provide strong defaults. They yield to documented
project architecture, framework version, measured evidence, and legacy adoption
constraints. Examples include folder shape, controller/composable naming,
styling choice, state library, test runner, and virtualization strategy.

---

## 2. Platform-forced differences

Web has a DOM, CSS, and HTTP responses. Native ships a binary and uses device
APIs. The shared outcome stays stable while the mechanism changes.

| Concern | Web | Native | Why it differs |
| --- | --- | --- | --- |
| Styling | Project-declared CSS or utility system | `style` prop or native utility system | Native has no CSS cascade |
| Accessible name | HTML semantics and `aria-*` | `accessibility*` props | Different accessibility APIs |
| Verification | Automated checks plus manual checks where applicable | Component checks plus VoiceOver/TalkBack | No DOM; device behavior still needs manual verification |
| Token storage | Commonly secure server-managed cookies | Platform keystore | Native storage and threat model differ |
| Client secrets | Server may hold secrets; browser bundle may not | Nothing secret may ship in the binary | The binary is extractable |
| Transport controls | CSP and response headers | Native transport configuration | No page response exists on native |
| E2E mechanism | Project-declared browser runner | Project-declared device runner | Different runtime |
| Performance focus | Bundle and web-vitals measurements | Startup, list recycling, UI-thread work | Different bottlenecks |

React Native loads `platform/native.md` instead of `platform/web.md`. Loading
both creates contradictory mechanics.

---

## 3. Framework idioms and project choices

Framework profiles recommend idiomatic mechanisms without converting them into
cross-team invariants.

| Concern | Next.js | React | Vue | Angular | React Native |
| --- | --- | --- | --- | --- | --- |
| Logic boundary | Server boundary or controller hook | Controller hook | Composable | Service or signal store | Controller hook |
| Component filename | Profile recommendation | Profile recommendation | PascalCase SFC recommendation | Version/project convention | Profile recommendation |
| Routing | App Router | Project router | vue-router | Angular Router | Declared native router |
| Styling | Project policy | Project policy | Project policy | Project policy | Project policy |
| Shared state | Project policy | Project policy | Project policy | Project policy | Project policy |
| Unit/E2E tooling | Project policy | Project policy | Project policy | Project policy | Project policy |

The invariant is separation, type safety according to project policy,
accessibility, and testability. The library or filename is usually a
recommendation or declared project choice.

---

## 4. Legitimate difference versus drift

| Situation | Classification |
| --- | --- |
| Two projects use different component review thresholds recorded in policy | Legitimate configurable policy |
| One project permits boundary `any` with reasons and another forbids it | Legitimate configurable policy |
| Vue uses a composable while Angular uses a service | Framework-forced mechanism |
| Native uses device accessibility props while web uses HTML semantics | Platform-forced mechanism |
| A project silently edits shared standards | Drift |
| A project violates an invariant without a recorded deviation | Drift |
| A project follows a different library already declared in policy | Legitimate project choice |
| A team treats a preset value as permanently mandatory for every project | Misclassification |

When a project cannot meet an invariant, record a deviation in
`standards/project.json` with the rule, reason, owner, and review date or trigger.
Changing a configurable policy value is not itself a deviation, though relaxing
one should be deliberate and explained.

---

## How to use this

- Onboard a team by reviewing the taxonomy, its platform row, its framework
  profile, and its explicit project policy.
- Resolve disputes by identifying the expectation's strength before debating
  its value or mechanism.
- Compare teams on shared outcomes and policy transparency, not identical tools
  or numbers.
- Escalate repeated deviations as evidence that the upstream invariant may need
  revision.
