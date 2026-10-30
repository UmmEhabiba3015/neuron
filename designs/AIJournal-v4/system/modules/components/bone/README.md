# bone

The skeleton's piece (v4 round 10): the shape of something still to come, in `--bone` with one shimmer band fixed to
the viewport, so every bone on the screen shares one sweep. Ask's skeleton drew its own (chat 0.2.1); the user asked
for skeletons on every page, so the bone, its shimmer and its reduced guard moved here.

```js
use('bone', { width: '62%' })                                // a line
use('bone', { form: 'text', lines: [1, 0.58] })              // two lines of prose, as tall as the words
use('bone', { form: 'block', width: '44px', height: '44px' }) // the play button
use('bone', { form: 'round', width: '28px' })                // a mood dot
use('bone', { form: 'wave' })                                // a memo's waveform
use('bone', { form: 'status', text: 'Opening your journal.' }) // the announced line, hidden
```

## Why

- **The page's real frame, only the content in bones** (Ask's rule, DESIGN.md 2026-10-25): the masthead, the nav and
  the sheet are drawn; the words, times, dots and memos are bones at the real content's widths and rhythm, so nothing
  jumps when the page arrives.
- **One sweep.** The band is fixed to the viewport (`background-attachment: fixed`): every bone shows the same pass.
- **Text at the prose line height,** so a row's skeleton is as tall as its words.
- **Still under reduced motion** (no band); the review switch `data-motion-review="play"` shows it.

## Do and don't

- Do draw a skeleton inside the page's real frame (its sheet, its rows), from the real row modules.
- Do give every skeleton one status line (form status) inside its role status region, or as the region itself.
- Don't put words in a bone, or a bone where the real content is already known (the masthead, the date box).
