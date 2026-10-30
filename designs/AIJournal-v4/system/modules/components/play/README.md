# play

E4 in the closed inventory (direction-lock.md §6). The play control of a recording: a --tap
square with --r radius, keylined in --block. The recorder runtime swaps the glyph to a pause
while playing.

```js
use('play', { label: 'Play voice memo' })
```

## Why

- **The glyph is the state.** Playing is shown by the pause glyph, not by a variant.
- **The label is required.** The button holds only a decorative glyph, so `aria-label` names it.
- **The glyph is drawn at 15px with a 2px nudge,** below every sizing token, so both are marked as exempt.

## Do and don't

- Do let the parent place it; its `flex` and its tap width are the module's own.
- Do write the label as the action ("Play voice memo").
- Don't add a variant or colour; hover is the only change.

## Legacy debt

- `play.css` carries the shell's motion as legacy contexts: `.app .aj-c-play` (the glide and the
  press scale), the hover media block and the reduced-motion block.
- No placement is left in `lock.css` on `.aj-c-play`: `flex:0 0 auto` and `width:var(--tap)` are the
  module's own.
