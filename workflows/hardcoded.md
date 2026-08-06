---
description: Find user-facing strings that bypass the translation layer and output ready-to-paste locale keys. Use when asked to find hardcoded strings, check i18n coverage, or before a PR that added UI copy.
allowed-tools: Grep, Glob, Read
---

# Find Hardcoded Strings

Standards: `reference/i18n.md`.

## What to flag

- Literal text in markup: `<label>Item Number</label>`, `{{ 'Save' }}`
- Accessible names: `aria-label="Submit"`, `accessibilityLabel="Submit"`
- `placeholder`, `title`, `alt` attributes
- Toast, alert, dialog, and notification copy
- Validation and error messages shown to users
- Button labels, headings, column headers, status labels, empty-state text
- Strings inside a data structure that feeds the UI (column definitions, menu
  configs, status maps) — these are the most commonly missed

## What to ignore

- Console output and developer-facing errors
- URLs, API paths, route segments
- Type literals, enum values, analytics event names
- Comments, test fixtures, Storybook story names

## Output

Group by file. For each finding:

- **`file:line`**
- The hardcoded string
- A suggested key — lowerCamelCase, dot-separated, named for **meaning** not for
  the English text (`form.submitButton`, never `Submit`)
- The replacement call, using this project's translation API

End with a ready-to-paste block of new keys for every locale file the project
has, not just the default. Mark unknown translations `TODO: translate`.

## Anti-patterns

❌ Using the English string as the key — breaks the moment the copy changes
❌ A `t()` call with an empty-string fallback to hide a missing key
❌ Splitting a sentence into concatenated fragments — word order differs by
   language. One key with interpolation
❌ Adding keys only to the default locale
