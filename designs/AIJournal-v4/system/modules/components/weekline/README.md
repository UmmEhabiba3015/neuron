# weekline

Earlier weeks, under the Reflections booklet (v4 C3, DESIGN.md 2026-10-28). Approved design: explore
`2026-10-27-long-fold-out` E's earlier weeks, as `2026-10-27-booklet-feel/f-mix` draws them.

```js
use('weekline', { heading: 'Earlier weeks', since: 'Since March 2026', weeks: [{ month: 'July', dates: '27 Jul to 2 Aug', line: 'A bank holiday, done on purpose.', href }] })
```

React: `<WeekLine id heading weeks since />`.

Weeks come newest first; a week sits under the month it starts in, and each month is drawn once, where its first
week comes. The section's id (`earlier` by default) is the target of the last leaf's "Earlier weeks".

## Why

- **A line, not rows.** A ring per month and a dot per week on one vertical line: the weeks read as a stretch of
  time, and each row is only its dates and its line.
- **No week numbers.** A week is its dates.
- **The whole row opens the week**, at least `--tap` tall.

## Do and don't

- Do give every week its line (the reflection's own).
- Don't draw it with no weeks: a first reflection and a new account have none, so the page leaves it out.

## Placement

The page places it under the booklet; the space above it is the page's.
