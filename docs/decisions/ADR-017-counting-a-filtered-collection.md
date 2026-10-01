# ADR-017: Counting a Filtered Collection

**Status:** Accepted
**Date:** 2026-10-01 (Day 14)

**Cites:** ADR-005, which settled that a collection is a bare array and an
empty one is a complete answer. This ADR confirms that decision rather than
amending it.

---

## Context

Day 13 added pagination to `GET /entries`. The listing returns a page; it does
not say how many entries the filter matches. `GET /entries/count` existed from
Day 8 and took no filters at all, so counting a search returned the size of
the whole journal.

Two consequences, found in the Day 14 audit:

- **A client paginating a search cannot know what it is paginating.** It can
  only discover the end by asking for a page and getting a short one.
- **`/entries/count?word=sister` answered with a plausible number that was
  quietly wrong**, which is worse than refusing.

The screens need this. The timeline shows *"148 entries · 31 recordings ·
4h 12m not yet read"*, and search results need to say how many matched.

---

## Decision

**`GET /entries/count` takes the same filters as `GET /entries`.** The listing
stays a bare array. The total is a separate resource, not an envelope around
the collection.

Five conditions, all of them the owner's:

1. **One query builder, two endpoints.** Both go through the same
   `whereFor(userId, filters)`. Three separate `where` clauses is how the
   original bug happened, and the next filter would have recreated it.
2. **Unknown query parameters are refused.** `forbidNonWhitelisted` is already
   global, so `?wrod=sister` is a 400 rather than a count of everything. The
   failure mode of the old bug was a filter silently ignored.
3. **The invariant is a test.** For each supported filter, the count equals
   the length of every page concatenated — walked a page at a time, because
   the point is that it matches what a paginating client can actually reach.
4. **Pagination does not need the count.** A client stops when a page is
   shorter than the limit. The count is for display, not for control flow.
5. **`/count` counts entries and nothing else.** The timeline's three-part
   total is its own summary endpoint, built when audio exists. No recordings
   field is added here in advance.

---

## Alternatives rejected

**An envelope: `{ items: [...], total: 148 }`.** Rejected because it changes
the shape of a settled collection response to serve a single screen. ADR-005
decided what a collection looks like and nothing here is a reason to reopen
it. It would also have moved every existing client and every e2e test that
asserts a bare array.

**A header: `X-Total-Count: 148`.** Rejected because it hides the total where
clients forget to look, and in a browser it needs
`Access-Control-Expose-Headers` as well — one more thing to forget.

---

## What this cost, and what it caught

**One extra round trip per screen that wants a total.** The two requests run
in parallel, and a journal has no write pressure that would make them
disagree in any way a user would see.

**It caught a regression in the refactor itself.** Collapsing three `where`
clauses into one changed `?word=` — an empty search term — from returning
nothing to returning everything, because "empty" and "absent" look the same to
a filter object. Day 5 chose that behaviour deliberately: a search box that
answers a request for nothing with the whole journal is wrong. The rule now
lives in `whereFor` as `IsNull()` on a `NOT NULL` column, so the listing and
the count agree on it without either special-casing it first. Two unit tests
from Day 5 failed and are the reason it was noticed.

---

## Revisit when

- A second filter arrives — most likely a date range for the timeline. The
  test in condition 3 has a case per filter, so adding one without adding its
  case is the thing to watch for.
- The timeline's summary endpoint is built. That is where recordings and
  unread minutes go, and `/count` should not grow toward it.
