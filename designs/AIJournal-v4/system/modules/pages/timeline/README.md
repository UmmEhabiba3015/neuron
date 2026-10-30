# timeline (page)

Timeline: the journal by day, newest first, with the date and mood card and the search as the list's running
head (v4 C1). Approved design: explore `2026-10-23-timeline-jump-arrival` f-wash-and-frame; DESIGN.md
2026-10-23. The rows are the old design's (journal-website.html `#timeline`).

## Why

- **One page on every platform.** The List/Calendar zoom and the desktop's calendar index go: the calendar lives
  in the card (daycard), so every platform shows the same three things, the card, the search and the list.
- **The date box is back** in the masthead on every platform, as the masthead places it (under the wordmark on
  phones, beside it from 700, in the title block on desktop).
- **On desktop the card is the sticky column right of the list** (b-side-column). It is the page's 340px second
  column (revision 46), not the exploration's 22vw: one width for every split page's second column.

## Do and don't

- Do keep the days and each day's mood in `data.mjs` (a recording's waveform is the wave's own (v4 round 10)).
- Do derive the card's weeks and months with `system/content/journal-days.mjs` from the moods.
- Don't draw the arrival in a comp state: only the record's script can place it.

## Usage

```js
render('timeline', { platform: 'mobile', state: 'mood' })
```

## Platform rules

- **Mobile and tablet**: the header section (the masthead row with the date box, the destinations); the card
  (`block`; in the flow on the numbered comps, find's `flow`, sticky in the reader), the list (`block record`), the foot.
- **Desktop**: the title block (wordmark, date box, destinations); the page is `split`: the search and the list in
  the record's column, the card `aside column` (it spans the column, so it sticks beside the whole list).

## States

- The card's: `mood` (panel open), `calendar` (open), `mood-one-day` (27 Jul to 2 Aug: a straight line),
  `mood-empty-week` (nothing written this week: the journal and the list from 1 August).
- No arrival state: a rendered jump scrolls whatever hosts the page on load (the catalogue). The arrival is the
  live jump's (the walkthroughs, the website); the record's own catalogue shows it.
- The search's: `found` ("Priya": two days, the word marked, the 9 August row dated), `no-matches`, `searching`,
  `search-failed`.
- The old design's: `earlier`, `end` (another foot line), `thin-week` (a few days, the card's first week; the
  shell clipped), `loading` (the list replaced by a state message, no foot).
- The rows' own states (delete, memory, the last item of a day) are the shared entry states their tools link to
  (18-entry-system-states, the day page's last-deleted), unchanged.

## How it runs

`scripts/journal-timeline.js` (the walkthroughs and the website) passes the card's `daycard:jump` to the record's
`data-jump`, the record's `record:day` to the card's `data-day`, and runs a stand-in search on `find:search`
(the no-matches message from the templates in `scripts/templates/4-timeline.mjs`).

## Composition

The masthead (`header` or `mast` title, `keybox`, `dest`); the card (`daycard`: `cal` wheel, `moodgraph`); the
search (`find` pill: `field` bare, `button` switch); the list (`record`: `sheet`, `shead`, `dayrow`, `recrow`,
`entry-actions`); the foot.

## Comp

`system/comps/02-timeline.json`: mobile and tablet show the list and the calendar open; desktop the list.
