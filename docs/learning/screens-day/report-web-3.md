# Screens Day, part 3 — Worker report, web: the calendar on the Timeline

**Date:** 2026-10-09. Prompt: `docs/workers/screens-day-web-screens-3.md`.
Built on parts 1 and 2 (`report-web.md`, `report-web-2.md`), committed on
`screens-day`. Binding: `docs/requirements.md` 3.5.4.

---

## Read this first

- **The calendar is built, with real data.** The month shown is the month
  of `GET /days/today`. The days marked are the ones `GET /days?from=&to=`
  returns for that month. The browser's clock is never read.
- **Desktop:** the month grid stands beside the list all the time. A marked
  day scrolls the list to that day. It **does not add a history entry**,
  because the designer recorded that as something the build must do
  (direction-lock.md 13.12).
- **Tablet and phone:** a List / Calendar switch in the masthead. Calendar
  shows the month grid in place of the list. A marked day goes to that
  day's page, as those comps link it. The switch adds no history entry.
- **No unbuilt control was added.** The comps draw no control on the
  calendar that could be unbuilt: there is no way to move to another month
  in any of them. `lib/unbuilt.ts` is unchanged. See *The unbuilt controls*.
- **All nine checks pass**, run as one chain after the work, and again after
  the mutation was undone.
- **The mutation was caught by five tests.** See *Mutation*.
- **Walked in a real browser at 1440, 834 and 390.** No press of the switch
  or of a calendar day sent a request to the API. See *The walk*.
- **Measured against the comps.** No style value differs anywhere on the
  calendar or the switch. Every difference in position comes from the data:
  October 2026 has five weeks and starts on a Thursday, and the comp's
  August has six weeks and starts on a Saturday. See *Measured*.
- **Three choices are the owner's.** See *Choices for the owner*.

`apps/api`, `packages/contracts` and git were not touched (`git status`
lists only files under `apps/web`, and this report). No dependency was
added. `app/styles/lock.css` is the designer's file byte for byte (`cmp`
exits 0). None of the designer's scripts was run. The owner's database was
not used: its SHA-256 began `13cf1ed2` before and after. My API ran on
3100 and my web app on 3101, with a throwaway database in my scratch
folder. Both are stopped.

---

## Objective

Parts 1 and 2 left the calendar out of the Timeline. The owner says it is
part of the Timeline's main screen. Build it in its main state, from real
data, as the three comps draw it.

## Implementation summary

- **`lib/calendar.ts`** (new, no React): the weeks of a month, Monday
  first; the first and last date of a month, for the API; and a marked
  day's name for a screen reader.
- **`lib/timeline.ts`**: when the Timeline opens, it asks for today, then
  for the dates of today's month that have an entry, then for the entries.
  The open Timeline carries `calendar: { month, written }`.
- **`app/screens/LiveTimeline.tsx`**: the switch (`ZoomSwitch`), the month
  grid (`MonthGrid`), and the jump to a day in the list (`goToInList`).
- **`app/components/LiveScreen.tsx`**: two new optional props. `mastAside`
  is what the masthead holds below desktop, if it is not the date box.
  `zoom` puts `data-zoom` on the page.
- **`app/styles/live.css`**: a new section, 2.1, shows one zoom below
  desktop and both on desktop.

## Files

**New**

| File | What it is |
|---|---|
| `apps/web/lib/calendar.ts` | `monthRange`, `weeksOf`, `writtenDayLabel` |
| `apps/web/lib/calendar.test.ts` | Its eight tests. No React |
| `docs/learning/screens-day/report-web-3.md` | This report |

**Changed**

| File | Change |
|---|---|
| `apps/web/lib/timeline.ts` | Asks `GET /days` for today's month; `TimelineCalendar`; the open view carries `calendar` |
| `apps/web/lib/timeline.test.ts` | The fake API answers `/days`. One test's list of requests gains the `/days` question. The failure tests now also run on `/days`. One new test |
| `apps/web/lib/format.ts` | `formatDayAndMonth`, as "3 August" |
| `apps/web/app/screens/LiveTimeline.tsx` | The switch, the two month grids, the month heading of the calendar zoom, the jump |
| `apps/web/app/components/LiveScreen.tsx` | `mastAside` and `zoom` |
| `apps/web/app/styles/live.css` | Section 2.1 added. The note in 5.4 updated: it said the calendar was not built |

**One existing test was changed**, and only in what it expects to be sent:
*entries from two pages … are grouped by day* checks the exact list of
requests, and that list now has `/days?from=2026-09-01&to=2026-09-30` after
`/days/today`. The behaviour changed, so the test had to.

---

## Decisions and reasons

| Decision | Reason |
|---|---|
| **Where a marked day goes, on desktop: to that day in the list, on the same page** | The desktop comp links each day to `#d-{date}`, the day's rows in the list, and names it "… Go to it in the list". lock.css revision 37: "the list is the record and the calendar is an index into it" |
| **The jump adds no history entry** | direction-lock.md 13.12: "the comp draws the link and the build must scroll without pushing". 00-flow.md: pressing Back four times to get off a screen is worse than losing an undo. The link keeps its `#d-{date}` address, so it still works if the script has not loaded |
| **Focus moves to the day's own link in the list** | A keyboard user carries on from the place the eye has moved to. That link's name is the date in full and the number of entries |
| **Where a marked day goes, on tablet and phone: to the day's page, `/d/{date}`** | The tablet, mobile and prototype comps link each day to `#day`, the day's page, and name it with no "in the list". In the calendar zoom the list is not on screen. lock.css revision 46: "at 390 and 834 a day cell was a link to a day page" |
| **Today's cell goes to Today (`/`)** | The same rule as today's row in the list (Day 17c): the page for today's date sends the person to Today anyway |
| **On desktop, no switch; the date box stays** | direction-lock.md 13.12: ".seg is not on this screen" at desktop, and "the title block's second-row slot takes the same date box" |
| **Below desktop, the switch takes the date box's place in the masthead** | As the tablet and mobile comps draw it. Day 17c put the date box there only because the switch was not drawn (ui-handover.md) |
| **The switch appears once the Timeline has opened** | Before that there is nothing to switch between, and the masthead shows the date box as before. Both are the same height (lock.css 7.6), so nothing moves |
| **The switch adds no history entry, and does not change the address** | 00-flow.md: "Timeline zoom (list ↔ calendar): does not push. A persisted view preference, not a place" |
| **One request for the calendar, made with the list** | The Timeline opens, fails and is asked again as one thing, so the calendar needs no loading or failed state of its own (the owner: main state only). If `/days` fails, the Timeline shows its existing failed state |
| **The range asked is the whole month**, 1st to last day | The comp draws the whole month. A date after today has no entries, so asking for it costs nothing |
| **The marks come from `/days`, not from the list** | The prompt. Both say the same thing: the API lists a date only if it has an entry that is not deleted (ADR-020) |
| **A day of another month is never marked**, even where it is drawn in the first or last week | The comp draws those days faintly and never as links. Only one month's dates are asked for |
| **Two month grids are rendered**, one for desktop and one for the calendar zoom; the width hides one | Their links go to different places and have different names. This is the same pattern as the two headers (live.css section 2) and the three waveforms (section 4) |
| **The grid is a `nav`, with the weekday letters and the other months' days hidden from a screen reader** | The comp's main state uses `role="grid"` on a `div` with no rows, which is not valid: a grid must contain rows. The designer's own later version, in the desktop prototype's thin-week state, uses `<nav class="cal">` and hides the weekday letters. I followed that one. A screen reader hears "October 2026", then each day's number, and the marked days by their full names |
| **The CSS went into live.css section 2, not section 5** | Section 5 is for things lock.css does not draw. This is not that: lock.css draws both zooms. It is a change of markup between widths, which is what section 2 is for |
| **The calendar zoom has no foot line** | The list's foot ("There is nothing earlier in this journal.") talks about the list. The comp's foot is the "Since" line, which was not built (Day 17c) |

---

## The unbuilt controls

**None added.** I read every place the calendar is drawn: `02-timeline.html`
at the three widths, `#timeline-calendar` in `journal-prototype.html`, and
the desktop prototype's thin-week state. None has a control on the calendar
other than the days themselves and the switch. There is no previous month,
next month or "today" button anywhere. Both the days and the switch work.

So `lib/unbuilt.ts` and its tests are unchanged, and no `NOT_SCHEDULED`
entry was added.

**What this leaves:** the calendar shows only the current month. On desktop
the list beside it still holds every month. In the calendar zoom on a
phone or tablet, an earlier month cannot be seen at all. See *Choices for
the owner*.

---

## Choices for the owner

| Choice | What I built | The other option |
|---|---|---|
| **A way to see another month** | Nothing, because no comp draws it | A previous and next month control, drawn and marked unbuilt (`NOT_SCHEDULED`) until it is wired. The designer would need to draw it first |
| **The switch is not remembered** | List every time the Timeline opens. After a calendar day leads to a day's page, Back returns to the list | Remember the choice for this browser. 00-flow.md calls it "a persisted view preference" |
| **The switch's name for a screen reader is "Zoom"** | "Zoom", the designer's word | A plainer word, such as "Show as" |

---

## Every new sentence

**Mine.** None. Every new word comes from the designer or from the data.

**The designer's, word for word.** "List", "Calendar", "Zoom" (the
switch's group name, for a screen reader), "M T W T F S S", ", writing"
and ". Go to it in the list" (in a marked day's name, as "3 August,
writing. Go to it in the list").

**From the data.** The month, as "October 2026": the grid's name, and the
heading of the calendar zoom.

**Left out of the designer's.** "a recording" and "writing and a recording"
in a day's name; the `audio` mark on a day; "Since March 2026".

---

## Tests

`lib/calendar.test.ts`, eight tests, no React, no clock:

1. **August 2026 is drawn as `02-timeline.html` draws it**: Monday first,
   six weeks, 27–31 July before and 1–6 September after, the 3rd and 6th
   marked;
2. a month that starts on a Monday has no day of the month before, and one
   that ends on a Sunday has none of the month after;
3. a February of four weeks has four weeks, and no empty one;
4. a leap February has its 29th, and the year turns inside December's last
   week;
5. a date with entries outside the month is not marked, even where it is
   drawn;
6. every cell is the day after the one before it, and the first is a
   Monday;
7. the range asked of the API is the whole month (31, 30, 29 and 31 days
   checked);
8. a marked day is named as the comp names it, without the recording.

`lib/timeline.test.ts`: **the calendar shows the month of the API's today,
and marks the dates the API says have an entry** (new). Today is 2 September
in the fake API and the list holds August too; the calendar is September
with the 1st marked, and `/days` is asked once. The failure tests now run on
`/days` as well as on `/days/today` and `/entries`: two more tests.

Web tests: **171 of 171** (160 before: 8 new in `calendar.test.ts`, 1 new
and 2 more from the loop in `timeline.test.ts`).

## Checks

Run from the repository root as one chain, exit 0, after the work; and
again, exit 0, after the mutation was undone.

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm build` | clean |
| `pnpm test` | contracts 7 of 7; API 16 suites, 246 of 246 |
| `pnpm test:e2e` | 25 suites, 365 of 365 |
| `pnpm lint:web` | clean |
| `pnpm typecheck:web` | clean |
| `pnpm build:web` | clean. `/timeline` built |
| `pnpm test:web` | contracts 7 of 7; web **171 of 171** |

## Mutation

**The line**: in `lib/calendar.ts`, `mondayFirst`,

```ts
return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
```

changed to

```ts
return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
```

This makes the calendar start on Sunday, which is what a calendar does by
default and what the comp does not do. Every week the calendar draws depends
on this line. All nine checks were run one by one.

| Check | Result |
|---|---|
| `pnpm lint`, `typecheck`, `build`, `test`, `test:e2e` | pass (they do not read the web app) |
| `pnpm lint:web`, `typecheck:web`, `build:web` | **pass.** The types are the same |
| `pnpm test:web` | **fails**: 166 of 171. *August 2026 is drawn as 02-timeline.html draws it* (the first week came out as `(26) (27) (28) (29) (30) (31) 1`); *a month that starts on a Monday …*; *a February of four weeks …*; *a leap February …*; *every cell of a week is the day after the one before it* (the first cell was not a Monday) |

The line was put back and all nine were run again: the table above.

**What no test reaches.** The jump on desktop, the switch, and the CSS that
shows one zoom are in React and CSS. If `goToInList` stopped preventing the
link's default, a history entry would be added, and no check would fail.
They are covered only by *The walk*. This belongs on the Day 19 list of
things a browser test would hold.

---

## The walk

Headless Chromium, against the real API and the built web app. One account;
one entry written today (Fri 9 October), one moved to 3 October and one to
6 August in the throwaway database, and ten more written today so that the
list is longer than the window. "API requests" counts the requests the page
had sent to the API just before and just after the press. "History" is
`history.length`.

| Step | Result |
|---|---|
| Open the Timeline | It asks `/days/today`, then `/days?from=2026-10-01&to=2026-10-31`, then `/entries?limit=200&offset=0` |
| **1440:** what is shown | The list, the index, the date box. No switch. The calendar zoom's heading and grid are hidden |
| 1440: the index | Named "October 2026". M T W T F S S. 35 days in 5 weeks, from 28 September to 1 November. Marked: 3 → `#d-2026-10-03`, "3 October, writing. Go to it in the list"; 9 → `#d-2026-10-09`, "9 October, writing. Go to it in the list". No other day is a link. 6 August is not in October, so it is not drawn. No `audio` anywhere |
| 1440: a marked day's size | 44.30 × 44.30 (lock.css: 44.29) |
| 1440: press 3 in the index | Address `/timeline` → `/timeline`. **History 3 → 3. API requests 47 → 47.** The page scrolled 0 → 302, as far as it goes; the row of 3 October is in view. Focus on "Saturday 3 October 2026, 1 entry" |
| 1440: press 9 in the index | Address unchanged. History 3. Focus on "Friday 9 October 2026, 11 entries" |
| 1440: the index while the list scrolls | `position: sticky`, from lock.css |
| **834:** what is shown | The switch: List pressed, Calendar not, group "Zoom". The list and its foot. No index, no calendar, no date box in the masthead |
| 834: press Calendar | Address unchanged. **History 3 → 3. API requests 47 → 47.** The list and its foot are hidden. "October 2026" and the grid are shown. Calendar is pressed |
| 834: the marked days | 3 → `/d/2026-10-03`, "3 October, writing", 67.7 × 67.7; 9 → `/`, "9 October, writing" |
| 834: press 3 | `/d/2026-10-03`: "Goes to the third of October." |
| 834: Back | `/timeline`, with List pressed. See *Choices for the owner* |
| 834: Calendar, then press 9 | `/`: Today, with its composer |
| **390:** what is shown | As 834 |
| 390: press Calendar | Address unchanged. **History 5 → 5. API requests 58 → 58.** Grid shown, list hidden |
| 390: the marked days | 3 and 9, as at 834; 44.0 × 44.0 |
| 390: press List | The list is back. History 5 |
| 1440: the list's own link to 6 August | `/d/2026-08-06`: still works |

---

## Measured against the comps

As parts 1 and 2: each comp and the running app in headless Chromium, 764
tall. Every visible element inside `.app` is recorded with its position,
size and 29 computed style values. Elements are paired by class names and
place in the tree. "Same" means within 0.6px and all 29 values equal. The
comp is lifted out of its stage and given `live.css`, in the browser's
memory only. The comp's recordings and the "Private, out of memory" mark
were removed, in memory, because they are not built. **One new adjustment:**
the `split` class is ignored when pairing. The tablet and mobile comps draw
`.page` and the app draws `.page split` at every width. Every `.page.split`
rule in lock.css is inside the desktop container block (lines 2400–2809),
so below desktop the class does nothing.

The app had one entry on today, 9 October.

| Screen | Comp | 390 | 834 | 1440 |
|---|---|---|---|---|
| Timeline, list (and index on desktop) | `02-timeline.html`, first device | 16 of 20 | 18 of 20 | 26 of 57 |
| Timeline, calendar zoom | `02-timeline.html`, second device | 25 of 53 | 25 of 53 | — (no zoom on desktop) |

**Same at every width**: the masthead, the wordmark, the switch and both of
its buttons, the destinations, the month heading, the grid's box (its
position, width, padding, fill and keyline), and every weekday letter.
**No style value differs on any calendar element** at any width. On desktop
the index starts at exactly the comp's place.

### Every difference I could not close, and why

| # | Difference | Where | Why |
|---|---|---|---|
| 1 | The grid is one week shorter (46px at 390, 70px at 834, 46px at 1440), and its days sit in different cells | Every calendar | Data. October 2026 starts on a Thursday and has 5 weeks; the comp's August starts on a Saturday and has 6. Day *n* of each grid lands at the same column positions; only the date in each cell differs |
| 2 | Two marked days, not six; none drawn as a recording | Every calendar | Data. No recordings exist |
| 3 | The list is shorter, so the foot is higher | List | Data: one day, not seven |
| 4 | The foot says "There is nothing earlier in this journal.", not "Since March 2026"; no foot in the calendar zoom | List, calendar zoom | Day 17c's. The "Since" line is not built |
| 5 | The day's date is a link inside `.tcol` | List | live.css 5.4, Day 17c |
| 6 | The date box says "Fri 9 Oct '26" and is 9px narrower | Desktop | Data |

**Not measured.** The jump's scroll position against a comp (a comp cannot
scroll). The sticky index while scrolling (checked as `position: sticky`
only). Hover, and the pressed state. Firefox and Safari. The measuring and
walking scripts are in my scratch folder, not the repository.

---

## Limitations

- **No browser test holds the jump, the switch or the CSS.** Only the walk
  does. See *Mutation*.
- **The switch is forgotten** when the Timeline is left. See *Choices*.
- **Only today's month.** See *Choices*.
- **The month is fixed when the Timeline opens.** A Timeline left open past
  midnight on the last day of a month still shows the old month until it is
  opened again. Today's date box behaves the same way.
- **Chromium only.**

---

## Concepts a learner may not know

- **A history entry**: each address the browser has been to in a tab. A
  link to `#something` adds one, even on the same page; `preventDefault()`
  on the press stops that.
- **`scrollIntoView()`**: scrolls the page until an element is in view. It
  respects the element's `scroll-margin-top`, which lock.css sets so the row
  does not land flush against the top.
- **`focus({ preventScroll: true })`**: moves the keyboard's place to an
  element without scrolling a second time.
- **`aria-pressed`**: tells a screen reader that a button is a switch, and
  whether it is on.
- **`aria-hidden="true"`**: hides an element from a screen reader but not
  from the eye.
- **`position: sticky`**: an element scrolls with the page until it reaches
  a set distance from the top, then stays there while its container is in
  view.
- **A container query** (`@container (min-width: 1200px)`): a CSS rule that
  depends on the width of a box rather than of the window. Here the box is
  the page, so it amounts to the same thing.
- **`Date.UTC(year, month, 0)`**: day 0 of a month is the last day of the
  month before. That is how the last day of a month is found without a
  table of month lengths.
- **`(day + 6) % 7`**: JavaScript numbers the week from Sunday (0) to
  Saturday (6). Adding 6 and taking the remainder after dividing by 7
  renumbers it from Monday (0) to Sunday (6).
- **A data attribute as a CSS hook** (`data-shows`, `data-zoom`): markup
  says what each part is for, and CSS decides what to show at each width.
