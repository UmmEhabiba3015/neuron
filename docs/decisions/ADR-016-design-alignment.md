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

## Decision 3 — Tiers and guest sessions are deferred, and that is recorded

The designs carry a full commercial model — free and Pro at $9.99, a paywall
with rules, guest sessions that carry over on signup. **None of it is being
built**, and none of it blocks a frontend.

- **Tiers.** Every screen the frontend can build in Phase 3 is a free-tier
  screen. The Pro surfaces (`/ask/{id}`, `/reflection/{week}`) are the RAG work
  in Phase 4 and cannot be built before it.
- **Guest sessions.** A real feature with a real cost — browser-held state,
  quota warnings, and a claim path that migrates content into an account. It is
  deferred until there is a frontend to hold the guest state.

Recorded so that their absence is a decision rather than an omission.

---

## What this ADR does not change

The review found the API **lean rather than bloated**: every field it returns
is used by a screen. The roadmap predicted an "unused field" category and it
came up empty. ADR-005's empty-collection semantics, ADR-006's literal `%` and
`_` in search, and ADR-013's 404-never-403 all survive contact with the designs
unchanged.
