# Neuron — handoff, written for a fresh reader

**Written 2026-10-07**, at the close of Day 17, in the middle of Phase 3.
**Every number in this file was re-run on the day it was written**, not
copied from an earlier report.

You do not need to have followed this project to read this. It assumes you
know software but not this codebase.

**This is not the document for restarting a Master Thread.** That is
`docs/master-state.md`, read after `master-prompt.md`, `constitution.md` and
`roadmap.md`. This file is for a person.

---

## 1. What this is

Neuron is a private journal: typed entries, a mood for each day, and later
voice memos, search and a memory the person can ask questions of. It is being
built as a deliberate learning project by Umm E Habiba, a 2022 computer
engineering graduate returning after a career break. The aim is that she can
explain every decision in it, and the product is the vehicle for that.

She works with an AI "Master Thread" that teaches, writes decision records
and audits. Separate AI "workers" write the code from written prompts. She
makes the decisions. Her husband, a senior engineer, sets scope and
guardrails from time to time.

---

## 2. Where it stands today

**It is a working product for one feature: writing.** A person can create an
account, sign in, stay signed in across a reload, type an entry, see it
appear, and delete it. That is true on her own laptop against her own
database.

| Part | State |
|---|---|
| `apps/api`, NestJS on SQLite | Accounts, sessions with rotating refresh tokens, entries, days with a 4am boundary, mood, pagination, soft delete |
| `apps/web`, Next.js | Sign in, create account, and the Today screen, reading and writing real data |
| `packages/contracts` | One file holding every fact both applications state: wire shapes, the mood words, page sizes, the password minimum |

**The numbers.** 211 API unit tests, 279 API end-to-end tests, 41 web tests,
6 checks on the shared package. Lint, typecheck and build clean for both
applications. 21 architecture decision records. Ten migrations.

**Not built, said plainly.** No AI of any kind. No voice. No search screen.
No Timeline and no way to see any day except today. No sign-out control. No
forgot-password. No export and no account deletion. The mood buttons and the
"keep this out of memory" option are drawn and do nothing.

---

## 3. What happened in Days 15 to 17

**Day 15, the browser.** The refresh credential lives in an `HttpOnly`,
`SameSite=Strict` cookie and the access token in memory. Her reason: an
attacker who gets script onto the page should not be able to carry the
long-lived credential away. CORS allows one origin, which has no default.
ADR-018.

**Day 16, two applications.** The same facts were written in both
applications with nothing connecting them, so a shared package now holds
them. Her rule for it: *facts about data crossing the boundary between the
two apps, not implementation or behaviour belonging to either app.* This
reversed part of the Day 1 decision, which expected generated types, and the
record says so. ADR-019.

**Day 17, the first real user.** She used the screen and reported what felt
wrong, which changed the day. Writing an entry waits for the API, because
the server decides an entry's time and day. Deleting an entry shows at once.
Deleting is a soft delete with an automatic filter. ADR-020 and ADR-021.

**The designer replied on Day 17.** `designs/AIJournal-v3/` is his answer to
`docs/ui-handover.md`, and it accepts every scope decision: no guests, no
tiers, no offline, an account required.

---

## 4. What comes next

| Day | What it is |
|---|---|
| 17a | Bring the web app in line with the new designs |
| 17b | A timezone for each user. Today the day ends at 4am UTC, which is 9am for her |
| 17c | Seeing a day other than today |
| 18 | Drafts, saving as she types, editing an entry |
| 19–20 | Responsive layout and accessibility; forgot password |
| 21–27 | Search, embeddings, background work, and answers from her own entries |
| 28–39 | Scheduled work, deployment, export and account deletion, hardening |

The lettered days were inserted during Days 16 and 17. The plan is no longer
held to forty days; her husband said so on 2026-10-04.

---

## 5. Things that are deliberately unfinished

- **A failed delete can be missed** if the person has scrolled away. She kept
  this design after the worker and the Master Thread both advised against it.
- **Deleted writing is still stored**, hidden, until the account is deleted.
  Every later feature that reads entries must leave it out.
- **The day boundary is in UTC.** Day 17b.
- **The web app is drawn on the previous stylesheet.** Day 17a.
- **No test proves that an out-of-date answer about today is thrown away.**
  Found by the Day 17 audit, and scheduled as the first part of Day 17a.
- **The built API reads a TypeScript file from `packages/` at runtime.** A
  deployment that copies only the build folder will not start.
- **Worker prompts and reports are not in git.** They exist on one laptop.

The full list is the *Known Debt* table in `docs/master-state.md`.

---

## 6. How this project works, if you want to judge it

- **No day begins with code.** Problem, questions to her, a decision, a
  written record, then a worker prompt.
- **Every worker is audited by re-running everything**, and by one deliberate
  break of the day's work to see whether a test notices. On Day 17 one such
  break went unnoticed, and it is written down, not smoothed over.
- **A concept a worker introduced is not done until she can explain it.**
  Open items block the next day.
- **Each day opens by asking two of the previous day's ideas from memory.**
- **Decisions are hers and are recorded with her reasons**, including the
  ones made against advice.

What to be honest about: the sessions are long, her answers get shorter late
in them, and many arrive as pasted text. The memory questions at the start
of each day are how the project checks that the understanding is real.

---

## 7. Where to look

```
docs/master-state.md        where the project is; start with its first two sections
docs/roadmap.md             the plan, day by day
docs/decisions/             ADR-001 to ADR-021, the reason for every decision
docs/handbook/              one entry per completed phase
docs/ui-handover.md         what was asked of the designer
docs/SETUP.md               running it on a new machine
designs/AIJournal-v3/       the designer's current delivery; V3-REVISION.md first
apps/api/                   the API
apps/web/                   the web app; lib/session.ts and lib/today.ts hold its logic
packages/contracts/         what both applications agree on
```

---

## 8. Questions worth asking her

1. Why does writing an entry wait for the server, while deleting one does
   not?
2. What can a shared type not catch, and what catches it instead?
3. Why does the API, and not the browser, decide which day it is?
4. What does CORS protect, and what does it not?
5. Why is the soft-delete filter automatic, and where does it still have
   holes?
