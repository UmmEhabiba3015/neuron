# moodgraph

The 36th component (DESIGN.md, 2026-10-23; v4 C1). The week's mood as one smooth curve, with the
ground under it in the colour of the week's average mood. It opens from the mood row of the
Timeline's date and mood card. Approved design: explore `2026-10-23-timeline-jump-arrival`
f-wash-and-frame (the mood panel, from timeline-mood-gaps E, revised).

```js
use('moodgraph', { week: '2026-08-03', label: '3 to 9 Aug', days, before: { date: '2026-08-01', mood: 'light' }, current: '2026-08-09' })
```

React: `<Moodgraph week label days before after current onPick />` (see `dist/types/Moodgraph.props.d.ts`).

`days` is the week's seven days, Monday first: `{ date, mood?, has?, future?, name, short }`. `before` and
`after` are the nearest days written outside the week (`{ date, mood }`), or none. A point dispatches
`moodgraph:pick` with its date; which week shows is the parent's.

## Why

- **One week, always whole.** In testing, a line broken at the empty days didn't read as a mood
  graph. The curve runs through the days written only, carried in from the last day written before
  the week and out to the first day after; where there is none, it runs level to the edge.
- **It never shows a mood no day had.** The curve is monotone between points (Fritsch-Carlson): it
  never swings above or below the days either side of it.
- **One day is a straight line** at that day's mood across the week. **Nothing written is the empty
  graph:** the scale and the days, no curve and no ground. This week is always shown, even empty.
- **History has no empty weeks.** The arrows to earlier and later weeks skip any week with nothing
  written.
- **Each point is a button to its day** (a `--tap` target; its label names the day and its mood,
  "Sunday 9 August, Good. Go to this day"). The jump scrolls, waits for the scroll to end, then the
  day arrives (DESIGN.md, the jump arrival).
- **The drawing has a name.** `role="img"` with every day written and its mood, then "On average"
  and the week's mood.

## The area colour

The ground under the curve takes the colour of **the week's average mood**: that mood's ground token
(`--mood-light-ground` to `--mood-hard-ground`: the mood colour at 22%). The curve itself is `--rule`, 2px, the same every week.

1. Score each day written: Hard 1, Low 2, Even 3, Good 4, Light 5.
2. Average the scores over the days written (empty days don't count) and round to the nearest.
3. **Exactly between two moods (x.5):** the side with more days wins, counting the days above the
   average against the days below it.
4. **Still level:** the side of the latest day written in the week wins.

One day written takes that day's mood. Nothing written has no ground.

Examples: Good, Good, Low → 3.33 → Even. Light, Even → 4.0 → Good. Good, Even → 3.5, one day each
side, the latest is Even → Even (Even, Good → Good). Light, Light, Hard, Hard, Good, Low → 3.0 → Even. Good, Good,
Hard, Light → 3.5, three above and one below → Good.

## Do and don't

- Do draw the point dots in their own mood colours over the ground, the current day's dot ringed
  in `--ink`.
- Do keep the curve neutral (`--rule`): the colour belongs to the ground and the dots.
- Don't colour the ground by the latest day or the most common mood; it is the average, rounded as
  above.
- Don't draw a gap, a dotted bridge or words for missing days.

## Placement

- Placed by: the date and mood card's mood panel (v4 round 5, next). Its margin is the parent's.
