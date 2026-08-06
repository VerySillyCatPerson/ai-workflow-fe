# Platform: Native

React Native. **Replaces `platform/web.md` — several web rules invert here.**

| Web rule | Native reality |
| --- | --- |
| Project-declared web styling | The `style` prop or a native utility system is the mechanism |
| `aria-*` | `accessibility*` props |
| axe / WCAG tooling | No DOM — no automated a11y check exists |
| `localStorage` | `AsyncStorage` — **unencrypted plaintext on disk** |
| CSP, security headers | No server response to attach them to |
| Cypress / Playwright | Detox or Maestro |
| CSS cascade | No cascade — style every element |

## Styling

Use `project.json#stack.styling`: `StyleSheet.create` or the project's declared
utility layer. Tokens in a
theme module, no raw hex in components. Platform differences via
`Platform.select()` or `.ios.tsx`/`.android.tsx` files.

Prefer stable style objects for repeated or performance-sensitive renders. A
small dynamic style is not automatically a defect; measure before optimizing.

## Accessibility

Native accessibility needs explicit semantics and manual screen-reader checks;
automated component checks can help but do not replace device verification.

- `accessibilityLabel` on every interactive element without clear text
- `accessibilityRole` — `button`, `link`, `header`, `image`, `switch`, `alert`
- `accessible={true}` on composites that should announce as one unit
- `accessibilityState` for selected / disabled / checked / expanded
- `hitSlop` when the visual target is under the configured touch-target value
- Support font scaling — never `allowFontScaling={false}` on body text, never a
  fixed-height container around scalable text
- Verify with VoiceOver and TalkBack. There is no substitute

## Security

The attacker has the binary. **Anything in the bundle is extractable** — no keys,
secrets, or credentials in any form, including build-injected constants.
`AsyncStorage` is plaintext, so tokens and personal data go in the platform
keystore. Validate every deep link as hostile input. Never log tokens or personal
data; device logs are readable.

## Performance

Use a virtualized list for long or dynamic collections; a small fixed collection
may render directly. Keep expensive animations off the JS thread and verify
performance in **release** builds on a representative low-end device.

Full standard: `reference/performance-native.md`
