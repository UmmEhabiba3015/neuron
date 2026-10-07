# ADR-020: Deleting an Entry Is a Soft Delete

**Status:** Accepted
**Date:** 2026-10-07 (Day 17)

**Amends:** ADR-006, which had `DELETE /entries/:id` answer 200 with the
deleted entry so that a screen could offer an undo. It now answers 204.
**Amends:** ADR-015, under which deleting a day's last entry deleted the day
row. The row now stays.

---

## Context

The product owner's husband ruled on 2026-10-04 that deleting one entry is a
soft delete with no undo: the entry disappears from the product at once and
cannot be brought back by the person, and its row stays in storage, hidden,
until the whole account is deleted. Account deletion is a hard delete and is
a later day.

Until now the API removed the row, so no query ever had to think about a
deleted entry. Once the row stays, every query that touches entries has to
leave it out, and there are seven of them: the listing, the count, two
single-entry reads, the update, the delete, and the count that decides
whether a day is empty.

---

## Decision

**An entry has a `deleted_at` column. Empty means alive. A time means
deleted, and the API then behaves as if the entry had never existed.**

1. **The filter is automatic, not remembered.** The column is declared with
   TypeORM's `@DeleteDateColumn`, so every `find` and `count` on entries
   leaves deleted rows out without anyone writing the condition. A query has
   to ask explicitly to see them, and nothing in the application does.
2. **A deleted entry answers 404 on every route**: fetching it, editing it,
   and deleting it a second time. This is ADR-013's rule that "not yours" and
   "does not exist" look the same, extended to "deleted".
3. **`DELETE /entries/:id` answers 204 with no body.**
4. **The day row stays when its last entry is deleted, and keeps its mood.**
5. **`GET /days?from=&to=` lists a date only if it has at least one entry
   that is not deleted.** A mood alone does not list a date.
6. **There is no undo and no timed removal.** Nothing in the API turns a
   deleted entry back into a live one.

---

## The reasoning, which is the owner's

**Why automatic.** Asked what happens if the condition is added to the shared
query builder and forgotten elsewhere, she named it at once: a deleted entry
could still be fetched by its address, and perhaps edited, and lint,
typecheck and build would not notice, because the forgotten query is valid
code. Asked how to prevent that, she said the filtering should be automatic
at the query level, so that a new query excludes deleted entries unless it
explicitly asks otherwise. That is what the decorator does. It is the same
idea as ADR-017's "one query builder, two endpoints", one level down.

**Why 204.** The 200 with a body existed for an undo that no longer exists,
and the client already holds the entry it asked to delete.

**Why a mood alone does not list a date.** An empty day is supposed to behave
as if it does not exist. On the screen the mood row only appears beneath
entries, so a day with a mood and nothing else is a day the person emptied.

---

## What the automatic filter does not cover

Three holes. The first two were known before the code was written, and the
worker found the third:

- **`update` is not filtered.** The decorator applies to reads. An edit by id
  would still change a deleted entry, so the update carries its own
  condition. This hole is quieter than it sounds: with the condition removed,
  the route still answers 404, because the read that follows the write is
  filtered and finds nothing. The route says nothing happened while the
  deleted entry's content has been overwritten. Only a test that reads the
  row from the database sees it.
- **Raw SQL is not filtered.** Any hand-written query bypasses it.
- **A hard `delete` by criteria is not filtered.** Nothing hard-deletes an
  entry today. Account deletion will, and it will want to reach deleted rows
  too. Any other hard delete would reach them without having asked to.

The filter also reaches further than "every `find` and `count`": it is added
to query builders, joins and subqueries that select from the entity. That is
why the range listing needs no condition written by hand.

**TypeORM's own `softDelete` is not used.** It writes the database's
`CURRENT_TIMESTAMP`, which the tests cannot control and which has a different
format from every other time in this project. The application sets the
column itself from its own clock, and a test refuses the word `softDelete`
anywhere in the source.

So the mechanism closes most of the gap and tests close the rest: for each
route, an entry is created, deleted, and then listed, counted, fetched,
edited and deleted again, and every one must answer as if it never existed.

---

## Why the day row has to stay

Deleting the day was ADR-015's reading of "an empty day does not exist".
Since Day 16 an entry's `day_id` is a foreign key, and a soft-deleted entry
still points at its day, so the database would refuse to delete that day. The
rule is kept a different way: the row stays and decision 5 keeps it off the
calendar.

---

## Accepted costs

- **Deleted writing is still stored.** A person who deletes an entry has not
  erased it. The product must say so truthfully; the handover asks the
  designer to reword "Then it is gone, not hidden."
- **Anything that later reads entries outside the entity must filter by
  hand**: search indexes, embeddings and exports in particular. A deleted
  entry reaching the AI features would be a serious defect.
- **The mood of an emptied day is still stored too**, and so is a mood set
  on a date that has no entry. `GET /days/:date` returns it to anyone who
  asks for that exact date, and the calendar never points to it.
- **The table only grows.** Nothing removes a deleted row until the account
  goes.
- **Writing an entry costs one extra read.** TypeORM reads the new row back
  after the insert because of the decorator.
- **The new code does not run on a database without the column.** The
  migration has to run before the API starts.
- **Two dates with a mood can behave differently for a moment in a reader's
  mind**: `GET /days/:date` still answers with the mood of an emptied day,
  while the range listing leaves that date out.

---

## Revisit when

- **Account deletion is built.** That is the hard delete that finally
  removes these rows.
- **Phase 4 reads entries for search or memory.** Every such read has to be
  checked against this ADR before it ships.
- **Mood is wired on the screen.** Whether a mood may be set on a date with
  no live entry is a product question nobody has answered. The API allows it
  today, and by decision 5 such a mood is never shown on a calendar.
- **An undo is wanted after all.** The data to support one exists; the
  decision not to offer it is a product decision, not a technical limit.
