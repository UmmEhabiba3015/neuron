# error (page)

The error pages: a page that could not be found and a page that could not be shown. Approved design:
journal-website.html `#not-found`, `#server-error`.

## Why

The first generic state pages: the shape many states share (a masthead by kind, the destinations, a
message and a way out in an account sheet), composed once in `system/content/state-page.mjs`.

## Do and don't

- Do change a state's message or its way back in `data.mjs` (its blocks).
- Don't add markup here: the auth-form section renders the blocks.

## Usage

```js
render('error', { platform: 'desktop', state: 'server-error' })
```

## Platform rules

The state page's: desktop's title block beside the page; mobile and tablet the header section.

## Composition

The shell on the account surface (its id is the state's route), the journal masthead with a printed keybox,
the destinations (Today current), and an account sheet holding the auth-form section: the title, a copy
line, the action row.

## Comp

`system/comps/18-entry-system-states.json` (devices not-found, server-error).
