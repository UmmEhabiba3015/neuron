# booklet

The week's reflection as a small booklet (v4 C3, DESIGN.md 2026-10-28). Approved design: explore
`2026-10-27-paper-story-cards/d-booklet` with its feel from `2026-10-27-booklet-feel/f-mix` (A's border and lift, B's
stitches across the fold, no cover).

```js
use('booklet', { label: 'Reflection, 3 to 9 Aug', at: 0, leaves: [
  { form: 'week', kicker: 'This week', date: '3 to 9 Aug', line, picture },
  { id: 'sleep', form: 'note', kicker: 'What came up', date: '6 Aug', big, words, picture, foot },
  { form: 'end', back: { label: 'Earlier weeks', href: '#earlier' } },
] })
```

React: `<Booklet id label leaves at labels onTurn />`.

Each leaf is the `leaf` component's props plus its slots (`picture`, a leafpic placed `pic`; `foot`) and an optional
`id`. The booklet numbers the leaves, names each ("2 of 6: What you kept"), sides them and gives a leaf with an id
the element id `leaf-<id>`.

## Behaviour

- **Static:** it opens on `at` (0 on every static screen; the rated state opens on its note's leaf): that leaf is
  `data-pos="now"`, the rest `past` or `next` and inert. From the container's 1200 the CSS shows the spread that holds
  it (a left leaf and the right one after it), so the desktop comps open on leaves 1 and 2 with no script.
- **Live** (booklet.js): the arrows, the Left and Right keys, a touch swipe over 50px, and in a phone's column a tap
  on a leaf's outer thirds. One leaf at a time below 1200, two from it (`--aj-s-booklet-span`, read from the CSS; a
  column crossing 1200 keeps the leaf in view). A spent arrow hands its focus to the other. A hash naming a leaf
  (`#leaf-sleep`, Timeline's way back) opens there. `booklet:turn` `{ at, span }` after every turn.
- **Motion:** below 1200 the turned leaf rotates over the spine (rotateY -96deg from its left edge, `--g-turn` on
  `--gc`) and fades; the spread fades in (360ms). Under reduced motion the leaf changes at once; the motion-review
  switch lifts the guard in previews. The motion tokens are the shell's, so a catalogue specimen (no shell) never moves.

## Why

- **One leaf, one thought.** The reflection reads as pages you turn, not a list to scan; the number and picture lead,
  the words sit at the foot.
- **Paper on the table.** The booklet is the only paper that lifts (`--elev-paper`); a `--rule` edge, a shade into the
  spine, two stitches of `--rule-2` across the fold and a `--rule` ribbon make it an object.
- **It renders its own leaves**, so the leaf in view is right before any script runs.

## Do and don't

- Do give every note's leaf an `id` (`count`, `sleep`, `longest`, `trend`), so Timeline's way back can reopen it.
- Do open the rated state on its note's leaf (`at`).
- Don't put anything else on the booklet's paper, and don't give any other paper `--elev-paper`.

## Placement

The page places it as a block; Earlier weeks (weekline) follows it. The pager's 34px clears the ribbon.
