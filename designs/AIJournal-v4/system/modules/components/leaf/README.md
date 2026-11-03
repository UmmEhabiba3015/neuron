# leaf

A leaf of the Reflections booklet (v4 C3, DESIGN.md 2026-10-28). Approved design: explore
`2026-10-27-booklet-feel/f-mix` (its `shared/booklet.css` and `cards.css`), with the user's rulings of 2026-10-28:
the leaf's date top right on the kicker's line, and "N entries" in the foot.

```js
use('leaf', { form: 'week', number: '1', kicker: 'This week', date: '3 to 9 Aug', line: 'Five days here, and sleep on your mind.' }, { picture })
use('leaf', { form: 'note', number: '3', kicker: 'What came up', date: '6 Aug', big: [{ n: '4', unit: 'days with sleep' }], words }, { picture, foot })
use('leaf', { form: 'end', number: '6', back: { label: 'Earlier weeks', href: '#earlier' } })
```

React: `<Leaf form number kicker date line big words sign back picture={…} foot={…} />`.

- **week**: the kicker and the dates, the week's line (a heading), the picture at the foot. Also the "Next week"
  leaf (the line alone) and the week so far (its second line under the dots, `words`).
- **note**: the kicker and the leaf's date, the big number with its unit, the picture, the note's words at the foot,
  then the foot: "N entries" (button grade cite, opening Timeline on those entries) and its thumbs (thumbs,
  form pair), always shown: Ask's mechanic (v4 round 10).
- **end**: "Your journal" in the hand, and the way to the earlier weeks when there are any.

The picture is a `leafpic` placed `pic`. The booklet renders the leaves, numbers and names them ("2 of 6: What you
kept"), and makes those out of view inert.

## Why

- **Every leaf turns at one size.** At least `--leaf-h` tall; the words sit at the foot whatever the number and
  picture above them take, so a turn never jumps.
- **Paper you can lay on paper.** `--aj-c-leaf-paper`, `--aj-c-leaf-edge` and `--aj-c-leaf-pad` default to a leaf
  of its own (`--paper-2`, the shade into the spine, a 1px `--rule` edge); the desktop spread sets them so two leaves
  share one paper and one fold.
- **The date sits with the kicker**, on the right of the same line, so the foot is free for the entries.
- **Rated like an answer.** A note is something the journal wrote, so it takes Ask's thumbs; That's not right and
  its marked state (struck through, Undo) were retired (the user, 2026-10-29).

## Do and don't

- Do give a note's leaf its date and its foot; the trend's source is "Earlier weeks".
- Don't put week numbers on a leaf, and don't list entries on it: the foot opens them in Timeline.
