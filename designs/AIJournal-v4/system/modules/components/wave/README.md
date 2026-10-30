# wave

E5 in the closed inventory (direction-lock.md §6). A recording's waveform, decorative. The duration beside it
carries the information.

```js
use('wave', { size: 'row' })
```

React: `<Wave size="row" />` (see `dist/types/Wave.props.d.ts`).

## Why

- **One shape at one pitch** (v4 round 10, the user, 2026-10-29). Every memo draws the 14:05 phrase exactly as Today
  shows it at 1440 on opening: bars 1.77px wide every 6.19px. It was an svg stretched to its row, so between the comp
  widths the bars widened and spread, and the live memo drew a third geometry. Now the phrase is a tile repeated
  along the row (a mask on `currentColor`): a wider row shows more of it.

- **It is decoration.** It is `aria-hidden`; the duration beside it is the information.
- **It draws in once on arrival,** at the product's wave duration (520ms from 1200px, to stay under
  45px a frame). A restated screen and reduced motion do not draw it.
- **`big` is the capture screen's waveform:** the object of that screen rather than a detail of a row.

## Do and don't

- Do let the parent place it; `flex` and `min-width` (and the big variant's `width`) are the module's own.
- Do let it take the room it is given: the phrase fills it from the start edge.
- Don't draw a waveform of your own for a memo; the recorder's live trace is the one other (the capture screen's).
- Don't give it a name or role; don't put the duration inside it.
- Don't add a colour or size beyond `row` and `big`.

## Legacy debt

- `wave.css` carries legacy contexts: `.app` (the motion scope, the reduced-motion guard with the
  review switch, and the 1200px duration, which keeps `.app` for specificity) and `.app.restate`.
- No placement is left in `lock.css` on `.aj-c-wave`: `flex:1 1 auto`, `min-width:0`, and
  `width:100%` on `[data-size="big"]` are the module's own.
- The legacy class `wave` is still on the markup; `g-draw` stays in `lock.css` for other
  components, and the module has its own copy, `aj-c-wave-draw`.
- No screen carries the `big` variant today; it is kept as the contract decides.
