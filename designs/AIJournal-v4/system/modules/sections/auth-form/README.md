# auth-form

A section: the content column of every account screen (sign in, create account, forgot and reset
password, the account and data states). A heading, an optional line of copy, an optional form of
labelled fields, and a row of actions. On the plain-paper spread it is the opaque card with the
soft shadows; on an account sheet a 440px column.

```js
use('auth-form', { heading: 'Sign in' }, { children: '…copy, form, actions…' })
```

React: `<AuthForm heading="Sign in">{children}</AuthForm>`.

## Why

- **One column for every account screen**, so sign in, the account states and the data screens read
  as the same object (AUTHENTICATION EXTENSION, September 2026).
- **The soft shadows belong to the sign-in and sign-up card only** (October approved auth, the user's
  choice), not to other sheets.

## Do and don't

- Do put the copy, the form (`__form` with `__field`, `__inner`, `__password`) and the action row in it.
- Do let the parent place it: the auth region and the account sheet give it its column by role (`form`).
- Don't restyle the fields or buttons from here; the shared `.auth-copy`, `.auth-help` and
  `.auth-actions` are not this section's.

## Placement

- Places: `block` a notice, flush, `--s6` below, padding `--s6`; `row` a settings row, `--s3` below; `head` a section head, `--s8` above; `fill` a field (its field's width) or the submit (the form's width; `--s4` lower on the plain-paper spread); `start` the forgot link, at the start (plain-paper spread).
- Placed by: the auth section (`form`), the sheet (`form`).

## Legacy debt

- Legacy contexts in `auth-form.css`: `.auth-sheet` (the account sheet), `.auth-paper` (the
  plain-paper shell), `:where(#journal) .device.t / .device.d` (the website preview's widths).
- Placement left in lock.css: `.auth-paper .password-note` and `.auth-paper .field-error` (the forgot
  line, which the button's own rule matches and wins over). The column and the placement of the
  children are by role (see Placement).
- Shared legacy text styles and the action row stay in lock.css: `.auth-copy` (its typing motion
  too), `.auth-help`, `.auth-actions`. The prototype review control `.auth-preview` stays legacy.
- The legacy classes stay on the markup while those rules read them (contract `legacyClasses`).
