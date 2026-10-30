# keybox

D1 in the closed inventory (direction-lock.md §6). A printed caps key, then its value: every
date the product shows, and the price. The value is handwritten (the date, written in as the
page arrives) or printed (a label or a price). On a pushed page with no wordmark the date box
names the page and its value is the h1.

```js
use('keybox', { key: 'Day', value: "Sun 9 Aug '26", valueTag: 'h1' })
```

React: `<Keybox keyLabel="Day" value="Sun 9 Aug '26" />` (see `dist/types/Keybox.props.d.ts`).

## Why

- **Written, not printed, for the date.** The write-in is the hand becoming present in the
  order it would have been written; printed prose is never swept (motion 15.11e).
- **The date box is the page's name when there is no wordmark** (revision 48), so the value
  may be the h1.
- **Wraps rather than clips.** It is `min-height`, never a fixed height, so a date wraps at
  200% type (direction-lock.md 3.3).

## Do and don't

- Do set `printed` once the screen has spent its two hand appearances (rule 8), and for prices.
- Do use `valueTag: 'h1'` only when the box names the page.
- Do let the parent place it: the masthead holds its size in the row and sets the gap below it in the
  title block, by role (`tool`).
- Don't write a printed value in, or make the box interactive.

## Placement

- Placed by: the masthead (`tool`).

## Legacy debt

- Legacy contexts in `keybox.css`: `.mast >` (masthead height), `.app` (motion scope, with
  the reduced-motion and review switch), `.app.restate`, `.auth-surface`, `.auth-paper`
  (font size, wrap) and `.recorder-mast` (22px).
- No placement is left in `lock.css` on `.aj-c-keybox`; the masthead's `tool` role gives its flex and
  margin, and the auth spread's width rules for it.
- `.app:has(.keybox .v:not(.printed)) .glance .gline` is a legacy context of the glance.
- Legacy classes `keybox`, `k`, `v` and `printed` are still read by the runtime scripts.
