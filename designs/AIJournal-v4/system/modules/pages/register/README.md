# register (page)

Create an account: the sign-up form on the plain-paper spread. Approved design: journal-website.html `#auth-register`, `#auth-register-error`, `#auth-register-invalid`, `#auth-register-short`, `#auth-register-creating`, `#auth-register-network`.

## Why

Every auth screen is one spread with one form section; a state is that section's content (a notice, a
copy line, a form with its values and help, the action row), so all of them stay the same shape.

## Do and don't

- Do change a state in `data.mjs` (its form section's data); the spread in `system/content/auth-spread.mjs`.
- Don't add markup here: the auth-form section renders the form section from its data.

## Usage

```js
render('register', { platform: 'mobile', state: 'error' })
```

## Platform rules

None: the same markup on every platform.

## Composition

The shell on the auth surface (its id is the state's route), the masthead row, the auth section (the
register spread's context and its region) holding the auth-form section built from the state's data.

## Comp

`system/comps/14-register.json` (the default); `system/comps/15-auth-states.json` (the states).
