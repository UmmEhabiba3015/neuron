# reset (page)

Reset password: choosing a new password from the link, on the login spread. Approved design: journal-website.html `#auth-reset`, `#auth-reset-short`, `#auth-reset-saving`, `#auth-reset-expired`, `#auth-reset-network`.

## Why

Every auth screen is one spread with one form section; a state is that section's content (a notice, a
copy line, a form with its values and help, the action row), so all of them stay the same shape.

## Do and don't

- Do change a state in `data.mjs` (its form section's data); the spread in `system/content/auth-spread.mjs`.
- Don't add markup here: the auth-form section renders the form section from its data.

## Usage

```js
render('reset', { platform: 'mobile', state: 'short' })
```

## Platform rules

None: the same markup on every platform.

## Composition

The shell on the auth surface (its id is the state's route), the masthead row, the auth section (the
login spread's context and its region) holding the auth-form section built from the state's data.

## Comp

`system/comps/15-auth-states.json` (the states).
