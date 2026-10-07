# ADR-015: The Day Is the Aggregate, Not the Entry

**Status:** Accepted
**Date:** 2026-09-23 (Day 12)
**Amended:** 2026-10-07 (Day 17b). Points 3 and 5 of the decision are
replaced. See *Amendment — 2026-10-07*, at the end.

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
5. **The boundary is computed in UTC for now.** A 4am boundary is meaningless
   without a timezone, and `users` has no column for one. **Deferred by the
   owner on 2026-09-25**, not overlooked: see *The timezone is deferred*, below.
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

## The timezone is deferred, and this is what that means

The day is resolved at write time, so the server has to answer "which day is
this?" at the moment of the insert. Doing that correctly needs the writer's
timezone, and nothing in the system knows it.

**Decision: use UTC, and revisit.** Three options were on the table — default
to UTC; have the client send its timezone on each write; store it on the user
at registration. The last two differ only in how they are wrong when someone
travels, and neither is obviously better until there is a real user in a real
second timezone.

**What is actually being deferred is a decision, not a column.** The offset is
applied when the day is computed, so switching from UTC to a stored or
client-sent timezone changes that one calculation and the rows already written
keep the day they were given. **No entry silently moves**, which is the whole
point of resolving at write time.

**What is wrong in the meantime, stated plainly.** For a user more than four
hours from UTC the boundary lands at the wrong local hour, and for a user far
enough east or west some late-night entries land on the neighbouring day.
There is currently one user, and she is at UTC+5, so a 4am UTC boundary is
09:00 for her — wrong in exactly the way this will eventually need fixing.

**Revisit when** the first real user is in a second timezone, or when a day
boundary is visibly wrong on a screen.

## Costs accepted

- **A write is now two writes** — resolve or create the day, then insert the
  entry. They must be one transaction, and Day 13 has to make that true.
- **A timezone change does not retroactively move existing entries.** This is
  deliberate and matches the reasoning above, but it means two entries written
  the same wall-clock hour in different timezones can land on different days.
  It is also what makes the deferral above safe.
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

---

## Amendment — 2026-10-07: midnight, in the person's own timezone

Two points of the decision change. Both were decided by the owner on
Day 17b. Everything else in this ADR stands, above all point 2: a day is
resolved once, at write time, and an entry never moves.

### Point 3 is replaced: a day ends at midnight, not at 04:00

The owner chose midnight and gave no reason beyond the choice. The section
*Why 4am, and why that is not arbitrary* is kept as the argument that was
made on Day 12. It is no longer the rule.

**The cost she accepted.** A sitting that crosses midnight is split. A
person who writes at 23:40 and again at 00:30 has two entries on two days.
That is the case 4am existed to prevent, and it is the first thing to look
at again if a real person reports an entry "on the wrong day".

**What it bought.** One rule fewer to explain, and one calculation fewer to
get wrong: `dayFor` asks for the calendar date of an instant in a timezone
and does no arithmetic on hours.

### Point 5 is replaced: the boundary is in the user's timezone

This answers the question the section *The timezone is deferred* left open,
with the third of its three options: the timezone is stored on the user.

- **It is an IANA name**, such as `Asia/Karachi`. Not a country, because one
  country can hold several timezones. Not an offset such as `+05:00`,
  because an offset is true for only part of the year where clocks change
  for summer. Node accepts an offset as a timezone, so the API's check
  refuses one by name.
- **It comes from the browser at registration**, in the request body. Nobody
  is asked for it.
- **There is no default.** A registration with a missing or invalid timezone
  is a 400. A default would start a person on the wrong days and nothing
  would ever report it.
- **Existing accounts were given `UTC`** by the migration, because that is
  the zone their days were worked out in.
- **Nothing already written moved.** Days and entries written under the 4am
  UTC rule keep the dates they were given.
- **The timezone leaves the API in no response.** No screen reads it.

### What is wrong now, stated plainly

- **A timezone cannot be changed.** No route sets it after registration. A
  person who moves keeps the old one, and an account the migration set to
  `UTC` stays there. The owner's own first account is one of these.
- **A browser that hides its timezone and reports `UTC`** creates an account
  in `UTC` with no refusal. This is the silent wrong day that "no default"
  was meant to stop, arriving another way.
- **A timezone name the browser knows and the server's Node does not** is
  refused, and the person can do nothing about it.

All three have the same repair: a way to set the timezone after
registration. It is drawn in the designs (`docs/ui-handover.md` §12) and no
day builds it yet.

### Revisit when

- A real person reports an entry on the wrong day. Check first whether it
  crossed midnight, and second whether their stored timezone is right.
- The settings route for the timezone is scheduled. Until it is, the three
  items above stay true.
