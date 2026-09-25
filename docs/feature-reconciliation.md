# Feature reconciliation — the roadmap's scope against the designs'

**Status:** Draft for decision. Nothing here is settled except where it says
"Settled", which means an ADR already carries it.
**Date:** 2026-09-25 (Day 12, continued)

Two feature sets were written independently. The roadmap's came from the
project's own learning goals; the designs' came from a product brief written
outside this thread. Day 12 is where they meet. This document lists both and
marks every conflict, so the conflicts get decided rather than discovered.

**The asymmetry worth stating first.** The roadmap is a *learning* plan whose
product scope is deliberately small: "success is measured by engineering
understanding, not by feature count" (`constitution.md`). The designs are a
*product* handover whose scope is a complete commercial application. Neither is
wrong. They were answering different questions.

---

## List A — what the roadmap decided

Taken from `roadmap.md` (scope decisions and the five phases) and the sixteen
ADRs. Grouped by whether it exists today.

### Built and working (Days 0–11)

| Feature | Where it was decided |
|---|---|
| Journal entries: create, read, update, delete | ADR-005, ADR-006 |
| Entries belong to users; ownership enforced in the query | ADR-009, ADR-013 |
| Keyword search over entry text, `%` and `_` literal | ADR-006 |
| Entry count | Day 8 |
| Registration and login, argon2id password hashing | ADR-011, ADR-012 |
| Sessions, refresh-token rotation, logout, logout-everywhere | ADR-014 |
| Validation at the boundary, unknown fields rejected | ADR-006, ADR-008 |
| Configuration checked once at boot | ADR-007 |
| Schema changes through migrations | ADR-010 |

### Planned, not yet built

| Feature | Day | Phase |
|---|---|---|
| Mood | 13 | 2 |
| A real frontend (Next.js) | 15–20 | 3 |
| Shared types across the monorepo | 16 | 3 |
| Loading, empty and error states | 17 | 3 |
| The writing experience; autosave | 18 | 3 |
| Responsive layout and accessibility | 19 | 3 |
| Full-text search and indexes | 21 | 4 |
| Embeddings and semantic search | 22 | 4 |
| Chunking | 23 | 4 |
| Background processing, queues, job state | 24 | 4 |
| RAG: ask questions of your own history, with citations | 25–26 | 4 |
| Weekly insights, generated on a schedule | 28 | 5 |
| Pagination and read-pattern work | 29 | 5 |
| The insight and chat interfaces, streaming | 30 | 5 |
| Deployment, Postgres, CI, observability | 31–33 | 5 |
| Rate limiting and a security pass | 35 | 5 |

### Explicitly deferred by the roadmap

Habit tracking · notifications · monthly insights · rich-text editing ·
analytics dashboards · photo and file attachments.

Two more were added on Day 12 by ADR-016: tiers and the paywall, guest
sessions.

---

## List B — what the designs require

Taken from `ai-journal-brief-v2.md`, `00-flow.md` and the 40 screens.

### The ten routes

| Route | What it is | API support today |
|---|---|---|
| `/` | Today — composer, mic, the day's items, mood | partial |
| `/talk` | Voice capture, full screen | none |
| `/timeline` | Timeline, list and calendar zoom | none |
| `/d/{date}` | A day | none |
| `/e/{id}` | An entry, memo, or conversation | partial |
| `/ask` | Ask and search, one field | partial |
| `/ask/{id}` | An answered question, Pro | none |
| `/reflection/{week}` | A weekly reflection, Pro | none |
| `/you` + 6 children | Account, plan, privacy, data, trackers, notifications | none |
| `/in` · `/new` · `/restore` | Sign in, create, restore | partial, and **undrawn** |

### Features the designs introduce that the roadmap never had

| Feature | Notes |
|---|---|
| **A day as a first-class object**, ending at 4am | The structural one. ADR-015 |
| **Voice memos** — record, store, play back | The brief's primary input mode |
| **Transcription** of audio to text | Pro only; the commercial engine |
| **A free and a Pro tier**, $9.99/mo | Free spends $0.00 on AI |
| **Guest sessions** held in the browser, claimed on signup | |
| **Import** from Day One, Apple Notes, plain text | "The highest-leverage feature in the brief" |
| **Export** — markdown, JSON, audio files | Free forever, including after cancelling |
| **Up to three user-chosen trackers** beyond mood | Opt-in, changeable |
| **Crisis detection** and a resource card | Keyword-matched on free, no model |
| **Per-entry AI opt-out**, visibly marked | "Keep this out of memory" |
| **A monotonic total** — entries, recordings, unread minutes | Never falls; the conversion mechanism |
| **The continuity line** / verbatim echo on return | |
| **Notifications** — two, both optional | Pro only |
| **Panels and one blocking dialog** | Delete-everything is the only dialog |
| **A calendar** as a zoom level of the timeline | |
| **Drafts persisted on every keystroke** | |

---

## The conflicts, and what each one costs

### 1. Auth identifier — SETTLED

**Roadmap/API:** unique `name` + password.
**Designs:** email + code, or passkey.
**Decision: email + password.** Codes and passkeys deferred. ADR-016.

### 2. Voice memos — SETTLED

**Roadmap:** deferred as "file and image attachments."
**Designs:** the primary input mode and the entire commercial model.
**Decision: in scope.** Capture, storage and playback around Days 18–19;
transcription waits for the async work on Day 24. ADR-016.

### 3. Mood belongs to a day, not an entry — SETTLED

**Roadmap Day 13:** mood as a second entity, implicitly on entries.
**Designs:** mood is a property of the day, editable later from `/d/{date}`.
**Decision: the `days` table.** ADR-015.

### 4. Tiers and the paywall — DEFERRED, needs confirming

**Designs:** free vs Pro is load-bearing. Which features a user can reach
depends on their tier, and the flow's riskiest decisions are all about it.
**Roadmap:** no concept of a tier anywhere.
**Current position:** deferred (ADR-016 §3). Every screen the frontend can
build in Phase 3 is a free-tier screen.
**The cost of deferring:** none until the AI surfaces exist in Phase 4. At that
point "who is allowed to call this" becomes real.

### 5. Guest sessions — SETTLED. Not building them.

**Designs:** the first run has no sign-in wall at all. You write first and are
asked to keep it afterwards.
**Roadmap:** everything is behind `APP_GUARD`; a new route is closed by default.
**Decision (2026-09-25): no guest access. An account is required to write.**

The reason to take it seriously was the cold-start problem — the brief argues
that asking for an account before someone has anything worth keeping is the
wrong order. The reason it loses is that it contradicts ADR-013's
closed-by-default guard, which is one of the stronger decisions in the
codebase, and it buys a funnel improvement for a product that has no funnel
yet.

**What this costs, stated plainly.** `08-first-run.html` cannot be built as
drawn: it shows a live composer and microphone with no account. That screen
needs redrawing as a sign-in or sign-up screen, which the designs are missing
anyway — `/in`, `/new` and `/restore` are in the route table and were never
drawn. **These are now the same piece of design work rather than two.**

Also gone with it: the "keep this" panel, the guest strip on Today, the
browser-quota warning, and the claim-on-signup path that migrates local
content into a new account. None of them are needed now.

### 6. Import — UNDECIDED

Not in the roadmap at all. The brief calls it "the highest-leverage feature",
because it is what makes memory work on day one instead of in month two.
**Bearing on the learning goals:** file parsing and bulk insert are real
backend work, and it is the one feature that makes the Phase 4 RAG work
demonstrable without waiting months for a corpus to accumulate.

### 7. Export — UNDECIDED

Not in the roadmap. The designs make it a promise: free forever, including
after cancelling, no email gate.
**Cheap to build** — it is a read and a serialisation — and it is the one
feature the designs treat as an ethical commitment rather than a feature.

### 8. Crisis detection — SETTLED. No detection. The resource stays.

The brief calls the crisis path a non-negotiable. `00-flow.md` §4.3 then
records honestly that its own answer "does not meet it and cannot be closed
inside a zero-spend constraint", and that voice memos are not covered at all.

**Decision (2026-09-25): the product does not try to detect distress.**

The designs describe two separate things, and only the first is being dropped:

1. **Keyword detection** that triggers a card after an entry is saved. **Not
   building it.** A phrase list tuned to avoid false alarms catches almost
   nothing, and tuned to catch more it fires on grief, venting and fiction —
   and the brief is explicit that every wrong one costs real trust. It also
   cannot see voice memos, which §4.3 concedes is precisely where the risk is
   highest. A detector that misses the dangerous case and insults the ordinary
   one is worse than no detector.

2. **A static, always-present resource** in settings and the composer
   overflow, human-written, never generated. **This stays.** Dropping it would
   be a different decision from dropping detection, and a worse one: it costs
   nothing, it is honest about what it is, and removing it would leave a
   product explicitly built for people without a support network with no
   route to help at all.

**What this means for the design.** State 6 of the states pack — the crisis
card that appears beneath a completed entry — is not built. The resource
becomes what §4.3 already admits it mostly is: a link that is always there
rather than one that arrives at the right moment. **The shortfall the designs
recorded is not solved by this decision; it is accepted, and written down here
instead of being implied by an empty backlog.**

### 9. Trackers beyond mood — CONFLICT

**Designs:** up to three further trackers, user-chosen, opt-in.
**Roadmap:** "full habit tracking" is explicitly deferred, on the grounds that
"every tracked variable is a daily tax."
**Note:** the brief agrees with the roadmap here and cut the same feature for
the same reason, then kept three. The disagreement is about the number, not the
principle.

### 10. Notifications — CONFLICT, and both sides already lean the same way

**Roadmap:** deferred.
**Designs:** two, both optional — and then `00-flow.md` removes them from free
entirely, because a daily nudge without an AI opening line "becomes a bare
'time to write' nudge, closer to the pressure mechanic the brief bans."
**Effectively already deferred by both.**

### 11. Per-entry AI opt-out — UNDECIDED

Drawn on two screens ("Keep this out of memory", with a visible mark on
excluded entries). It is a column and a filter, cheap now and expensive later,
because Phase 4 retrieval has to honour it from the first line of code.

### 12. The monotonic total — UNDECIDED

`GET /entries/count` exists and returns one number. The designs need three
(entries, recordings, unread minutes) and make the third the conversion
mechanism. Cheap, but it depends on voice being modelled.

### 13. Rich text — RESOLVED, both agree

Roadmap deferred it; the brief cut markdown outright ("journal writing is
prose"). No screen renders formatted text. **Plain text stands.**

### 14. Analytics and mood charts — RESOLVED, both agree

Roadmap defers analytics dashboards. The brief cut correlations as
"statistically meaningless on 30 days of self-reported data". No screen shows a
chart. **Neither wants it.**

---

## What I would recommend, and why

**Take, because they are cheap now and expensive later:**

- **Per-entry AI opt-out** (#11). One column. If Phase 4 retrieval is built
  without it, every retrieval path has to be revisited.
- **Export** (#7). A read and a serialisation, and the designs treat it as a
  promise rather than a feature.
- **The three-part total** (#12), once voice is modelled.

**Take, because it makes the learning goals reachable:**

- **Import** (#6). It is honest backend work, and without it the Phase 4 RAG
  work has no corpus to be impressive against for two months.

**Keep deferred:**

- **Tiers** (#4) until Phase 4 makes entitlement real.
- **Notifications** (#10) — both documents already want this.
- **Trackers beyond mood** (#9) — the brief's own reasoning argues against
  them, and mood alone teaches the same data modelling.

**Decided on 2026-09-25, both by the owner:**

- **Guest sessions** (#5) — **not building them.** An account is required.
- **Crisis detection** (#8) — **no detection.** The always-present resource
  stays, because that is a separate decision and dropping it would be a worse
  one.
