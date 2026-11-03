# leafpic

A Reflections leaf's picture (v4 C3, DESIGN.md 2026-10-28). Approved design: explore
`2026-10-27-booklet-feel/f-mix` (its `shared/cards.css`), the pictures of `2026-10-27-paper-story-cards` B.

```js
use('leafpic', { kind: 'week', days, say: 'Monday even, Wednesday low, …', caption: 'Mon even · Wed low · …', place: 'pic' })
use('leafpic', { kind: 'recordings', recs: [{ day: 'Wed', len: '11:47' }, …], say: '3 recordings: …' })
```

React: `<LeafPic kind say caption days recs weeks />` (see `dist/types/LeafPic.props.d.ts`).

- **week**: the day letters over seven dots. `days`: `{ dow, mood?, day?: before|ahead, today?, title? }`.
- **kept**: a pen square over a microphone square under each day. `days`: `{ dow, written, recorded, title? }`.
- **recordings**: a bar each, drawn to the longest. `recs`: `{ day, len: "m:ss" }`.
- **weeks**: four columns, oldest first. `weeks`: `{ label, n (days of 7), current? }`.

## Why

- **Ink on paper.** Every mark is `--rule` or a share of it; only a kept day's dot takes its mood colour, and the
  word is always in the title, the leaf's label or the caption (the five mood colours fail as identity colours).
- **Said once.** The figure is `role="img"` named by `say`; the drawing and the caption are hidden from screen
  readers, so the picture is one sentence, not seven dots.
- **No week numbers.** A column is labelled by its date ("13 Jul") or "This week".
- **It plays when its leaf comes into view.** The dots pop in turn, the bars grow, the columns rise, while the
  booklet marks the leaf `data-pos="now"` (the context). Under reduced motion they are simply there; the
  motion-review switch lifts the guard in previews.

## Do and don't

- Do give every picture its `say`.
- Don't label weeks by number, and don't carry a mood by colour alone.

## Placement

The leaf places it (role `pic`). It sets no margin of its own beyond clearing the figure's.
