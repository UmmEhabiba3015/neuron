# mark

D4 in the closed inventory (direction-lock.md §6). An item mark: a keyline, an optional glyph
and a word, saying something about one item. Today it says "Private, out of memory" under a
journal entry.

```js
use('mark', { label: 'Private, out of memory', glyph: 'lock' })
```

React: `<Mark label="…" glyph="lock" />` (see `dist/types/Mark.props.d.ts`).

## Why

- **Never colour alone.** It is always a keyline and a word, in --rule-2 on --paper; there is
  no tint and no variant (direction-lock.md §6 D4).
- **Caps come from the CSS.** Write the label in sentence case; the module sets it in caps with
  wide tracking.
- **The glyph is drawn at 11px,** below every sizing token, so the two sizes are marked as
  exempt in the CSS.
- **The walkthrough runtime adds marks with no glyph,** hence `glyph: 'none'`.

## Do and don't

- Do let the parent place it: the rows set the gap after the words by role (`after`); hiding it where
  the entry row carries its tools stays with the parents (entry-actions' memory dropdown says it there).
- Do keep the label to a word or a short phrase.
- Don't colour it or add a variant to say more or less; the words carry the meaning.
- Don't make it interactive; a mark states a fact and is never focusable.

## Placement

- Placed by: the saved-entry row (`after`), the day row (`after`), the recording row (`after`).
