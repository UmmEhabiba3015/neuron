# login (page)

Sign in: the sign-in form on the plain-paper spread. Approved design: journal-website.html `#auth-login`, `#auth-login-error`, `#auth-login-invalid`, `#auth-login-sending`, `#auth-login-network`, `#auth-login-after-reset`, `#auth-login-after-delete`, `#auth-login-after-session`, `#auth-signed-out`.

## Why

Every auth screen is one spread with one form section; a state is that section's content (a notice, a
copy line, a form with its values and help, the action row), so all of them stay the same shape.

## Do and don't

- Do change a state in `data.mjs` (its form section's data); the spread in `system/content/auth-spread.mjs`.
- Don't add markup here: the auth-form section renders the form section from its data.

## Usage

```js
render('login', { platform: 'mobile', state: 'error' })
```

## Platform rules

None: the same markup on every platform.

## Composition

The shell on the auth surface (its id is the state's route), the masthead row, the auth section (the
login spread's context and its region) holding the auth-form section built from the state's data.

## Comp

`system/comps/13-login.json` (the default); `system/comps/15-auth-states.json` (the states).
