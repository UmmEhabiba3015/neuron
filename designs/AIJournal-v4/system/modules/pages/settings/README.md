# settings (page)

Settings: privacy, what the model can see, and your data, three states of one pushed page reached from
You. Approved design: journal-website.html `#settings-privacy`, `#settings-visible`, `#settings-data`.

## Why

A page module is the screen as the product draws it, so the screen files, the prototypes and the
website are written from one source instead of being kept by hand on three platforms.

## Do and don't

- Do compose modules only (`use()`), with roles; the page has no CSS and writes no markup of its own.
- Do keep content in `data.mjs`, once for every platform; a platform difference is a named rule in the
  render, never a second copy.
- Don't add a state journal-website.html doesn't show. The account and data states (17-account-data)
  join this page in round 4.

## Usage

```js
render('settings', { platform: 'desktop', state: 'visible' })
```

- `platform`: mobile, tablet or desktop. One render for all three.
- `state`: `privacy`, `visible` or `data`, named as the routes.

The page composes the shell (rail, page), the masthead (back to You), the record (a sheet of settings
rows, with section headings where a state has them) and a foot or a notice.

## Platform rules

- **Desktop**: the masthead is the title block beside the page (`mast` form `title`, shell layout
  `sidebar`, page headed `pushed`).
- **Mobile and tablet**: the masthead row inside the page (role `head`).

## States

- `privacy`: five read-only rows and the support link, then the foot.
- `visible`: "It can read" and "It cannot read", then the notice.
- `data`: "Take it out" and "End it". `privacy` and `visible` are clipped (the states pack shows many
  states without a full viewport each).

- The account and data states of 17-account-data (round 4b): `devices`, `only-device`, `device-signed-out`,
  `device-failed`, `timezone-failed` and `delete-pending` are generic state pages (kind account; rows and
  headings are the page's own `use()`, the rest the auth-form blocks). `delete-confirm` and `delete-failed`
  are the data page with a dialog (a card) after the record; `export-preparing`, `export-ready`,
  `export-empty` and `export-failed` are the data page with a state message in the record. `timezone`
  (a select of every timezone) waits for the field module to write a select with options.

## Content

`data.mjs`: the copy and links, written once. A row with an `href` is a link; one without is read only.

## Comp

`system/comps/10-settings-privacy.json` lists the three devices `mobile-web/10-settings-privacy.html` and
its tablet and desktop copies show, with one caption after the last. The build writes those files from it.
