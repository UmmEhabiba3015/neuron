# auth

A section: the plain-paper open spread of sign in and create account. A canvas holding the account
sheet, which lays two sides next to each other: the context (a large title, a line of copy and the
three ways the journal is used) and the region holding the auth form. Below 700px of container the
sides stack, the region first, and the ways are dropped.

```js
use('auth', { title, copy, ways: [{ label, text }] }, { children: use('auth-form', …) })
```

React: `<AuthSpread title copy ways>{children}</AuthSpread>`.

## Why

- **An open spread, not a dialog** (October approved auth): the person sees what the journal is for
  on the left while signing in on the right.
- **The form comes first on a phone**: below 700px the region moves above the context.

## Do and don't

- Do put the auth form in the region (children).
- Don't use it outside the plain-paper auth shell: every rule reads `.auth-paper`.

## Placement

- Places: `form` the region's form, a 500 column, centred.
- Placed by: the page (`grow`).

## Legacy debt

- Every rule carries the legacy context `.auth-paper` (the plain-paper shell), which keeps the
  spread's specificity; it goes when the shell's auth variant becomes a module attribute.
- The account sheet's two-column grid and its 700px stacking are in the sheet module, as legacy
  context `.auth-paper .aj-c-sheet:where(.auth-sheet)`.
- Placement left in lock.css: the account sheet's width, max-width, margin and grow
  (`.auth-paper .auth-sheet`). The canvas's `flex:1;min-width:0` is the page's, by role (`grow`).
