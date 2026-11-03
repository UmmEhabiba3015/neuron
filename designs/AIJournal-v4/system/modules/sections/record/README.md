# record

The Timeline's list (v4 C1): the sheet and its rows as the old design draws them, and the jump's arrival.
Approved design for the arrival: explore `2026-10-23-timeline-jump-arrival` f-wash-and-frame (DESIGN.md
2026-10-23, the jump arrival). The rows are the old Timeline's, unchanged (DESIGN.md 2026-10-23: C1 redesigned
only the calendar, the mood section and search).

```js
use('record', { items: data.items, moods, place: 'block record' })
use('record', { items: matching, moods, marks: ['slept'] })                   // search results
use('record', { items: [], message: { heading, text } })                      // no matches
```

## Why

- **The arrival waits for the scroll.** The old highlight (a 1.6s flash) was spent while the list still
  scrolled, and in testing nobody saw it. Now the list scrolls the day's first row under the search, waits for
  `scrollend`, then the day arrives, all of its rows as one.
- **C's wash passes through, E's frame stays.** The wash, the day's mood colour at 14% (`--mood-<m>-wash`),
  passes through each row like a train in 1.8s, each row 90ms after the one above, without stopping. The frame,
  `--rule` at 2.5px, is drawn round the whole day as with a pen (800ms) and held, with the date in the day's left
  column in its mood colour, until the next jump or leaving the page.
- **In its own layer.** The frame sits 3px outside the rows, beyond the sheet's own edge, which the sheet clips;
  so the arrival is drawn in the record's layer over the sheet, measured round the rows. It follows them when
  the layout moves and hides while a search hides the whole day. Only a measurement can place it, so it is drawn
  only where a script runs: the numbered comps never show it.
- **Reduced motion** keeps the colour and the marks and drops the movement: the scroll is instant, the wash
  fades where it lies, the frame is there at once.

## How it talks

The app sets `data-jump` (from the card's `daycard:jump`, one day; or a reflection's "N entries", its days
space-separated); record.js takes it. Several days arrive together: one frame round each run of neighbouring days
(a frame per day would double the lines between them), each day's wash and date in its own mood. As the list scrolls it
dispatches `record:day` `{ date }` with the first day whose rows reach below the search; the app sets
`data-day` on the card. The app's search sets `hidden` on the rows and month headings that don't match; the
record hides them, and the first row left takes no rule above it.

## Do and don't

- Do pass each day's mood (`moods`): it is the arrival's colour.
- Do pass only the matching days for a search state, and the words to mark (`marks`).
- Don't flash or time out the frame: it is held.

## Placement

- Placed by: the page (`block record`). A jumped-to day lands `--aj-s-record-offset` (96px) below the top; the
  app adds a pinned header's height on mobile and tablet.
