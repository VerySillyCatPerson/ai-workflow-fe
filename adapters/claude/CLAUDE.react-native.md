# {Project Name}

{One paragraph: what this app is, who uses it, what it talks to.}

@standards/core/guardrails.md
@standards/core/rules.md
@standards/platform/native.md
@standards/framework/react-native.md

> **Note:** `platform/web.md` is deliberately **not** imported. Several of its
> rules are inverted on native — see the table at the top of `platform/native.md`.

## Project specifics

Everything above is the shared standard. Everything below is true only of this
repo — put local deviations here rather than editing the imported files.

- **Project mode:** {greenfield | legacy}
- **Project policy:** `standards/project.json` (fill every value; do not hide preset behavior here)
- **Expo or bare:** {which, and the SDK/RN version}
- **Navigation:** {React Navigation / Expo Router}
- **Styling:** {StyleSheet / NativeWind} — pick one and note it here
- **Secure storage:** {expo-secure-store / react-native-keychain}
- **Minimum OS:** iOS {version}, Android API {level}
- **Test device floor:** {the low-end device performance is verified against}
- **Test utils:** `@/utils/test-utils` · standard: `standards/reference/testing-rntl.md`
- **E2E:** {Detox / Maestro}
- **Deviations from the standard:** {none, or list with reasons}
