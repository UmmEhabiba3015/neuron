# send

E10 in the closed inventory (direction-lock.md §6). The commit control: the composer's filled
control while the field holds content. A word, "Save", not a glyph. Same height and fill as the
microphone it replaces.

```js
use('send', { label: 'Save' })
```

React: `<Send />` (see `dist/types/Send.props.d.ts`).

## Why

- **A word, not a glyph.** An arrow was read as download, which is what it must not mean.
- **Caps come from the CSS.** Write the label in sentence case.
- **The accessible name is "Save entry"** (`aria-label`), beside the visible word.
- **It exists only while there is something to save,** so it has no disabled state.

## Do and don't

- Do let the composer lay out its row; the send button's `flex:0 0 auto` is its own.
- Do keep the label to the one word the product uses.
- Don't add a variant or colour; hover (fills --block) is the only change.

## Legacy debt

- `send.css` carries the shell's motion as legacy contexts: `.app .aj-c-send` (the press ramp,
  the hover-capable repeat, the press scale and duration) and the `.app` reduced-motion rule.
- No placement is left in `lock.css` on `.aj-c-send`: `flex:0 0 auto` is the module's own.
