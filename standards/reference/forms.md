# Forms

Read before building any form, input, or validation flow.

Forms are where accessibility, validation, error handling, and state management
all meet — and where most frontend defects live.

## Validation

**One schema, used three ways:** it types the form values, validates on the
client, and is shared with (or generated from) the server contract. Never write
the rules twice — two copies diverge and the user meets the difference as a
confusing error.

```ts
const schema = z.object({
  email: z.string().email('form.errors.emailInvalid'),
  age: z.number().min(18, 'form.errors.ageMin'),
})
type FormValues = z.infer<typeof schema>  // derive, never redeclare
```

Error messages are **translation keys**, not English strings.

### Timing

| Moment | Behavior |
| --- | --- |
| While typing, first visit | **Do not validate.** Errors before the user finishes is hostile |
| On blur | Validate that field |
| After first submit | Validate on change — the user has seen the errors, now help them fix them |
| On submit | Validate everything, focus the first invalid field |

Server-side validation is the real one. Client validation is a convenience and
can always be bypassed.

## Accessibility

This is the highest-risk area of any form.

- Every input has a **visible** label, programmatically associated. A placeholder
  is not a label — it disappears on focus and fails contrast
- Errors linked with `aria-describedby`, and the input marked `aria-invalid="true"`
- The error message sits next to its field, not only in a summary at the top
- Announce errors in a live region so a screen reader user learns of them without
  hunting
- On failed submit, move focus to the first invalid field
- Required fields marked with `required` — asterisks alone are not communicated
- Never convey validity by color alone: add an icon or text
- Group related inputs in a `fieldset` with a `legend` (radios, addresses)
- Native: pair `accessibilityLabel` with `accessibilityState={{ invalid: true }}`

## State

Track separately — they answer different questions:

| State | Meaning | Drives |
| --- | --- | --- |
| `isDirty` | Differs from initial values | Unsaved-changes guard |
| `isValid` | Passes the schema | Whether submit can proceed |
| `isSubmitting` | Request in flight | Disabled button, spinner |
| `submitCount` | Attempts made | Whether to validate on change |

**Never disable submit merely because the form is invalid.** A disabled button
with no explanation is a dead end — the user cannot tell what is wrong. Let them
submit, then show the errors and focus the first one.

Do disable while `isSubmitting`, and guard against double submission.

## Submission

- Disable the control and show progress for the duration
- Success: confirm it, then navigate or reset deliberately — never leave the user
  wondering whether it saved
- Failure: keep **all** entered data. Losing a filled form to a 500 is the worst
  outcome in this document
- Map server field errors back onto their inputs; show non-field errors at form level
- Idempotency key or request dedup on anything that creates a record
- Warn before navigating away while dirty

## Inputs

- Correct `type` and `inputmode` — `email`, `tel`, `numeric`. On mobile this
  changes the keyboard and is a real usability win
- Correct `autocomplete` tokens (`email`, `given-name`, `street-address`,
  `cc-number`). Users complete forms far faster; this is not optional polish
- Never block paste, especially on password and one-time-code fields
- Never impose an arbitrary max length on names, emails, or addresses
- Format on blur, not on keystroke — reformatting under the cursor is maddening
- Store canonical values (ISO dates, minor currency units), display localized

## Sensitive fields

- Never log form values — they carry passwords and personal data
- Never persist a password or payment field to storage, including drafts
- `autocomplete="new-password"` on registration to stop the browser filling the old one
- Never send card data through your own server unless you intend to be PCI-scoped

## Avoid

- One `useState` per field on a large form — use a form library
- Validating on every keystroke from first render
- A disabled submit button as the only feedback
- Error text that names the constraint but not the fix ("invalid input")
- Regex email validation stricter than the RFC — you will reject real addresses
- Placeholder-as-label
- Clearing the form on submit failure
- Optimistically claiming success before the request resolves
