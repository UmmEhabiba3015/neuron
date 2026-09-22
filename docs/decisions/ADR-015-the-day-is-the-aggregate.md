# ADR-015: The Day Is the Aggregate, Not the Entry

**Status:** Accepted
**Date:** 2026-09-23 (Day 12)

**Amends:** the roadmap's Day 13, which planned to model mood as a property of
an entry. Mood is a property of a *day*.

---

## Decision

1. **A `days` table.** One row per user per calendar day that has content. It
   carries the date, the mood, and the user it belongs to.
2. **An entry belongs to a day.** `entries` gains `day_id`, and the day is
   resolved at write time rather than derived at read time.
3. **The day boundary is 04:00 local time, not midnight.**
4. **A day is stored as a date, not as an instant.** `2026-08-09`, not a
   timestamp.
5. **`users` gains a timezone**, because a 4am boundary is meaningless without
   one.
6. **An empty day does not exist.** No row is created for a day with no
   content, and a day whose last item is deleted is removed.

---

## Why this is a decision and not a detail

The design of record models the product around a day, in `00-flow.md` §0, as
the first of four structural decisions:

> **A day is a document, and the day ends at 4am.** Either way it has a date, a
> URL, a mood and a boundary — which is what makes citations, export
> granularity, timeline rows and "open the original" possible at all.

The API built through Day 11 has no day. `entries.created_at` records the
instant a row was written. That is a different fact, and six things in the
designs depend on the first one rather than the second:

| Design surface | Needs |
|---|---|
| `/d/{date}` | a day with a URL |
| Timeline, calendar zoom | which dates have content |
| Mood | somewhere to hang that is not an entry |
| The monotonic total | a count of days, entries and recordings |
| Export granularity | a day-shaped unit |
| Citations | a stable, openable parent |

## Why 4am, and why that is not arbitrary

`00-flow.md` argues it directly, and the reasoning is a product decision rather
than a technical one:

> The boundary is **4am, not midnight**, because this product's stated hour is
> 1am and cutting a person's Tuesday night in half at 00:00 is a database
> decision leaking into a life.

The brief says the bar is *"safe to open at 1am."* An entry written at 01:30 on
Tuesday belongs to Monday's document, because that is the day the person was
having. Midnight would split the single most important session in the product.

## Why the day is resolved at write time

The alternative is computing the day from `created_at` on every read, as
`date(created_at, '-4 hours')`. Rejected for three reasons:

1. **It is not stable under travel.** The same instant resolves to different
   days depending on the timezone in force when the query runs. A journal entry
   must not move between days because its author got on a plane.
2. **It cannot be indexed usefully** without a generated column, which is the
   same storage with less clarity.
3. **The day has its own data.** Mood belongs to the day, so the day must exist
   as a row regardless of how it is derived.

Resolving once, at write time, records what the product actually means: *this
is the day the user was having when they wrote this.*

## Costs accepted

- **A write is now two writes** — resolve or create the day, then insert the
  entry. They must be one transaction, and Day 13 has to make that true.
- **A timezone change does not retroactively move existing entries.** This is
  deliberate and matches the reasoning above, but it means two entries written
  the same wall-clock hour in different timezones can land on different days.
- **Deleting the last item on a day must delete the day**, or the calendar will
  show marks for days with nothing in them, which the flow forbids
  ("an empty day does not exist").
- **The existing rows need backfilling.** Every current entry gets a day
  computed from its `created_at` at the user's timezone, defaulting to UTC.

## Revisit when

- A user asks to move an entry to a different day. Nothing in the designs
  offers this, and adding it makes `day_id` user-editable.
- Timezone-aware backfill becomes user-visible — the first support question
  about an entry on the wrong day.
