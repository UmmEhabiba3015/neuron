# ADR-016: Aligning the API With the Design of Record

**Status:** Accepted
**Date:** 2026-09-23 (Day 12)

**Amends:** ADR-011 and ADR-012, which made `name` the login identifier.
**Amends:** the roadmap's scope decisions, which deferred *"file and image
attachments."*

---

## Context

Day 12 is the day the frontend designs were shared. They are in
`designs/AIJournal-handover/` — 40 screens across three breakpoints, plus three
binding documents: the brief, the flow (`00-flow.md`, Stage 0 revision 5), and
the direction lock.

The review found the API supports roughly **one of the ten routes** the designs
describe. Two of the gaps were not gaps but **contradictions** — places where
the API and the designs had each made a decision, and the decisions disagreed.
The owner settled both. This ADR records them.

---

## Decision 1 — The login identifier becomes an email address

`00-flow.md` §3.1 step 6 specifies *"email + code, or passkey."* The API built
on Days 9–11 uses a unique `name`.

**`name` becomes `email`.** Password authentication is kept; the passkey and
emailed-code paths in the flow are **not** being built now and are recorded as
deferred below.

### Why email rather than name

- **A name is not an identifier a person can recover.** There is no "forgot my
  name" flow that works, and the designs have `/restore` — *"restore on a new
  device."* Restoration needs a channel, and the channel is email.
- **The designs never show a name field.** Nothing in 40 screens asks for one.
- **It is contained.** `name` is the login identifier in eight places, one
  migration, and the JWT payload. This is a Day 13 task, not a rewrite.

### What is explicitly deferred, not decided

**Emailed codes and passkeys are not being built.** Both need a mail transport
or WebAuthn, and neither teaches anything the roadmap has not already covered.
Password login stays. The designs are amended to show a password field.

### Costs accepted

- **`email` needs validating as an email**, which the current `name` does not.
- **The unique index moves**, and uniqueness should be case-insensitive.
  `UQ_users_name` becomes an index on a normalised email.
- **The JWT payload carries `name`.** It becomes `email`, which means existing
  tokens are invalid across the change. Acceptable: the only tokens that exist
  are the owner's own.
- **An email address is personal data in a way a chosen name is not.** It must
  never appear in a log line or an error message. ADR-011's rule that the
  password is never echoed now extends to the identifier.

---

## Decision 2 — Voice memos are in scope

The roadmap deferred *"file and image attachments."* The designs make voice the
product's **primary input mode**, and the brief agrees:

> Voice as the primary input, transcribed immediately.

More than that, voice **is the commercial model**. `00-flow.md` §4.1 makes the
free tier a journal you can talk into and the paid tier the thing that reads it
back. The conversion mechanism is a single string on the timeline — *"4h 12m
not yet read"* — and it is a fact about stored audio. Deferring voice defers the
business model along with it.

**Voice memos are in scope.** A memo is an item on a day, alongside a typed
entry, with a duration and an audio file.

### Why this is not the attachment feature the roadmap deferred

The roadmap deferred attachments because they are *"a content type nothing else
in the product can read"* — the brief's own words for why photos were cut. A
voice memo on the paid tier becomes **text**, which search, memory and
retrieval all read. It is the one media type that does not dead-end.

On the free tier it *is* the dead end, deliberately, and `00-flow.md` §4.1
records that as the riskiest decision in the document. That is a product risk
that has been argued and accepted, not an oversight.

### Costs accepted, and they are real

- **Object storage.** Audio is not going in SQLite. This arrives earlier than
  Day 31, which is where storage decisions were scheduled.
- **Upload is a different request shape** than anything the API does today —
  multipart or presigned, and large.
- **Offline capture.** `00-flow.md` requires recording offline and uploading
  later, with no error shown. That is client work with a server contract.
- **Transcription is a paid, asynchronous, failure-prone external call.** It
  belongs with the queue work on Day 24, not before it.
- **Storage is the only cost that never stops growing**, even for a dormant
  account. ~14MB per active user per month.

### What is deferred within voice

**Transcription itself.** Recording, storing and playing back audio is in scope
now. Turning it into text waits for the async work on Day 24, which is where
queues, job state and retry are taught. Until then every memo is in exactly the
state the free tier ships: kept as audio, never read.

---

## Decision 3 — Tiers are deferred; guest sessions are refused outright

The designs carry a full commercial model — free and Pro at $9.99, a paywall
with rules, guest sessions that carry over on signup.

**Tiers are deferred.** Every screen the frontend can build in Phase 3 is a
free-tier screen. The Pro surfaces (`/ask/{id}`, `/reflection/{week}`) are the
RAG work in Phase 4 and cannot be built before it. Deferred, not refused: the
decision returns when entitlement becomes real.

**Guest sessions are refused.** Amended 2026-09-25, by the owner. This is
stronger than a deferral and the designs have to move, so the reasoning is
recorded rather than assumed.

The case for them is the cold-start problem, and the brief makes it well:
asking for an account before someone has written anything is the wrong order,
and the first traced path in `00-flow.md` §3.1 has a live composer and
microphone on a logged-out screen.

The case against is that ADR-013 made every route closed by default —
`APP_GUARD` plus an explicit `@Public()` — and called that a new route being
*closed until someone decides otherwise*. Guest access is a deliberate hole in
that, carrying browser-held state, quota warnings, and a claim path that
migrates content into an account at signup. **It buys a funnel improvement for
a product that does not have a funnel yet**, at the cost of the guard's
strongest property.

### What this costs, and it is a real cost

`08-first-run.html` cannot be built as drawn. It shows the working application
with no sign-in wall, which was a deliberate product decision and is now
reversed. That screen needs redrawing.

**This merges with an amendment the designs already owed.** `/in`, `/new` and
`/restore` are in the flow's route table and are not among the 12 drawn
screens, so auth had no interface either way. First-run and the three auth
screens are now one piece of design work rather than two.

Dropped with it: the guest strip on Today, the *keep this* panel, the
browser-quota warning, and the claim-on-signup migration.

### Amendment — 2026-10-04: tiers are refused, not deferred

Decided by the owner's husband, who set the project up. **There are no tiers.**
There is no Free and no Pro; every user gets the whole product, including
transcription and the AI surfaces when Phase 4 builds them. A free trial
followed by a subscription is a possible later model and is not decided.

What this changes. "Who is allowed to call this" never becomes an entitlement
question in this project, so Phase 4 needs no tier check. The designs' plan
page, upgrade screen and every sentence naming Free or Pro are removed; the
screens drawn as Pro are simply the product. `docs/ui-handover.md` §4 carries
the detail for the designer.

What this does not change. Decision 2's case for voice rested partly on voice
being the commercial model. That argument is gone, and voice stays in scope on
the other one: it is the convenient way to make an entry, and its transcript
is text the rest of the product can read.

---

## Decision 4 — The product does not try to detect distress

Amended 2026-09-25, by the owner.

The brief calls the crisis path a non-negotiable. `00-flow.md` §4.3 then
records, honestly and at length, that its own answer does not meet it: a
curated phrase list with no model behind it, which **does not cover voice
memos at all** — and a voice memo at 1am is precisely the case §4.3 identifies
as highest risk.

**The two halves of the designed feature are decided separately.**

**Keyword detection is not being built.** A phrase list tuned for precision
catches almost nothing, because distress rarely announces itself in matchable
language. Tuned for recall it fires on grief, venting and fiction, and the
brief is explicit that every uncorrectable false positive costs real trust.
There is no setting of that dial that is good. A detector that misses the
dangerous case and insults the ordinary one is worse than no detector, and
shipping one would let the product claim a safety property it does not have.

**The static, always-present resource stays.** Human-written, never generated,
in settings and the composer overflow, at every tier. Dropping it is a
different decision from dropping detection and a worse one: it costs nothing,
it claims nothing it cannot do, and a product explicitly built for people
without a support network should not have zero route to help.

**The shortfall is accepted, not solved.** `00-flow.md` §4.3 says the gap
"cannot be closed inside a zero-spend constraint" and points at on-device
transcription in the native passes as the thing that would close it. That
remains true and unbuilt. This ADR records the gap as a known, accepted
position rather than leaving it implied by an empty backlog.

State 6 of the states pack — the crisis card beneath a completed entry — is
therefore not built.

---

## What this ADR does not change

The review found the API **lean rather than bloated**: every field it returns
is used by a screen. The roadmap predicted an "unused field" category and it
came up empty. ADR-005's empty-collection semantics, ADR-006's literal `%` and
`_` in search, and ADR-013's 404-never-403 all survive contact with the designs
unchanged.
