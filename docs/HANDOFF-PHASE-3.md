# Neuron — handoff, written for a fresh reader

**Written 2026-10-04**, at the end of Day 14 and the start of Phase 3.
**Every number in this file was re-run on the day it was written**, not copied
from an earlier report.

You do not need to have followed this project to read this. It assumes you
know software but not this codebase.

**This is not the document for restarting a Master Thread.** That is
`docs/master-state.md`, which carries the full continuity record and is read
after `master-prompt.md`, `constitution.md` and `roadmap.md`. This file is for
a person.

---

## 1. What this is

**Neuron is a journalling API, built as a deliberate learning project.**
Umm E Habiba is building it to return to backend engineering. The product is
real and the code is production-standard, but the *purpose* is understanding
rather than shipping — which explains several things that would otherwise look
odd, such as hand-writing database migrations a tool could generate.

The governing document is `docs/constitution.md`. Its central rule:

> Implementation is never the first step. Understand → research → discuss →
> compare → decide → design → implement → review → refactor → document.

A second rule shapes the whole repository: **learning debt**. If code is
introduced that its owner cannot explain, that is tracked like technical debt
and must be repaid before the next day's work begins.

---

## 2. Where it stands today

| | |
|---|---|
| **Days complete** | 0–14 of a 40-day plan |
| **Phase** | Phase 2 (identity and ownership) closed. Phase 3 (the interface) just opened |
| **Tests** | **149 unit, 160 end-to-end**, all passing |
| **Code** | 55 production files, ~2,400 lines, excluding tests |
| **ADRs** | 17 architecture decision records |
| **Branch** | `main`, clean, everything committed |

Typecheck, lint and both application builds are clean.

### What works

A journal API with real multi-tenant identity.

- **Accounts.** Register and log in with an email and a password. Passwords are
  hashed with argon2id and are not recoverable by design.
- **Sessions.** 15-minute access tokens, 30-day refresh tokens that rotate on
  every use. Logging out takes effect on the **next request**, not whenever the
  token happens to expire. "Log out everywhere" works. Replaying a rotated
  refresh token revokes every session for that user.
- **Ownership.** Every read and write is scoped to its owner inside the SQL
  `WHERE` clause rather than checked afterwards. Asking for someone else's
  entry returns 404, never 403 — a 403 would confirm the entry exists.
- **Days.** A day is a first-class object with its own row, and **the day ends
  at 4am rather than midnight**, because something written at 1am belongs to
  the night before. Mood attaches to the day, not to an entry.
- **Entries.** Create, read, update, delete, keyword search, pagination.

### The two applications

```
apps/api     NestJS + TypeORM + SQLite.  Everything above.
apps/web     Next.js.  One screen, three breakpoints, WIRED TO NOTHING.
```

`apps/web` renders the designs faithfully and makes **zero network calls**.
Connecting the two is what Phase 3 is for, and it is where the project is
stopped right now.

---

## 3. The decision that is open, and why she paused

**This is the live question, and it is the thing most worth your input.**

A browser has to keep a credential somewhere so a user stays logged in after
closing the tab. There are two realistic options and they are not equivalent.

| | `localStorage` | HttpOnly cookie |
|---|---|---|
| Can page JavaScript read it? | **Yes** | **No** |
| If an attacker gets JS on the page | Steals the 30-day token, uses it from **their own machine** | Can act as the user **only inside the open tab** |
| Attack window | 30 days, survives closing the tab and shipping a fix | Page lifetime, plus 15 minutes |
| Complexity | Low. The API already works this way | Higher. API change, CORS with credentials, CSRF |

Her own analysis of this was thorough and is the reason the decision is close
rather than obvious. Two findings from it worth repeating:

1. **Refresh-token reuse detection does not save `localStorage`.** It only
   fires when the real client and the thief collide. A patient attacker waits
   until the user stops using that device, and then nothing stale is ever
   presented. *"Reuse detection catches a careless thief. A patient one gets
   through."*
2. **An HttpOnly cookie does not prevent the attack, it bounds it.** The
   attacker's JavaScript can still call `/auth/refresh` and get a fresh access
   token, because the browser attaches the cookie automatically. What they
   cannot do is carry the credential off the device. *"HttpOnly doesn't prevent
   XSS. It bounds XSS in time and place."*

### The complication she raised last

**There will be a mobile app**, using this same backend. That is in the brief
— *"mobile is the product"* — and one native screen is already designed.

A native app cannot use a browser cookie. iOS stores credentials in the
**Keychain**, which is stronger than either option above. So the two clients
were never going to share a mechanism.

**My recommendation, for what it is worth:** cookie for web, token-in-body for
native, with `/auth/refresh` accepting either. The native app does not make
`localStorage` better; it makes the body path necessary regardless, and adding
it does not require weakening the web.

**Nothing has been built either way.** No ADR written, no code committed. The
decision is genuinely open.

---

## 4. Things that are deliberately unfinished

These are decisions, not oversights. Each is recorded in the roadmap or an ADR.

| | What | Where it is decided |
|---|---|---|
| **A user cannot be deleted** | Every foreign key is `ON DELETE NO ACTION`, so accounts with sessions or entries cannot be removed. That is the ORM generator's default rather than anyone's decision | Open question since Day 8. Has slipped past Days 10, 11 and 14 |
| **No timezone** | The 4am day boundary is computed in UTC. For a user at UTC+5 that is 9am local — wrong in the way this will eventually need fixing | ADR-015, with its revisit trigger |
| **`entries.day_id` is nullable** | The last step of expand-backfill-contract is pending | Roadmap, Day 27 |
| **No AI** | The product's whole differentiator. Phase 4, Days 21–27 | Roadmap |
| **Voice memos, import, export, tiers** | All decided as in-scope or deferred, none built | ADR-016, `docs/feature-reconciliation.md` |

**The oldest and sharpest of these is user deletion.** It has now slipped three
times. A product holding people's private journals should have a position on
what happens when someone wants their account gone — cascade, orphan, or refuse
account deletion entirely. The last is a legitimate answer but has to be said
out loud rather than arrived at by a generator default.

---

## 5. How this project works, if you want to judge it

Three habits, all of which have caught real defects:

**Every day ends with a mutation test.** Delete the line that makes the day's
work load-bearing and run everything. If the suite still passes, the day
shipped untested wiring. This exists because it happened three times in three
days early on. Day 14 ran 20 such mutations across the whole phase: 17 were
caught, and the 3 that were not became the day's work.

**Generated migrations are read before they are run.** TypeORM's generator
produced broken or destructive SQL on **five** migrations — one would have
dropped a unique index, another created a `NOT NULL` column and then copied
rows without a value, which passes on an empty database and fails the moment
one user exists. All five were hand-written instead. One went from 506
generated lines to 96. The five are listed in
`docs/handbook/phase-2-identity-and-ownership.md` §6; the migration files
themselves mostly no longer say so, because a later pass stripped comments
project-wide.

**Mistakes are recorded rather than tidied away.** Day 14's commit log contains
a bug I reported that did not exist, and the reason my test was wrong. That is
on purpose: `git log` is part of the documentation here.

---

## 6. Where to look

```
docs/constitution.md              why this project exists and how it works
docs/roadmap.md                   all 40 days, current status, open questions
docs/handbook/                    the arguments, one entry per completed phase
docs/decisions/ADR-*.md           17 decisions, each with alternatives rejected
docs/feature-reconciliation.md    the designs' features vs the roadmap's
designs/AIJournal-handover/       40 screens, a brief, a flow, a direction lock
```

**If you read three things:** `docs/handbook/phase-2-identity-and-ownership.md`
for what has actually been learned, `docs/roadmap.md` §"Where The Project
Actually Stands" for the current state, and `docs/decisions/ADR-014-sessions-and-revocation.md`
for the best example of how decisions get made here — it opens by quoting her
own objection to an earlier decision, in her words, and then answers it.

**To run it:**

```
pnpm install
pnpm --filter @neuron/api start:dev     # localhost:3000
pnpm --filter @neuron/web dev           # localhost:3001
pnpm --filter @neuron/api test          # 149
pnpm --filter @neuron/api test:e2e      # 160
```

Note the frontend does not call the backend yet. That is Phase 3.

---

## 7. Questions worth asking

If you want to pressure-test the project rather than admire it:

- **Why SQLite?** (ADR-003. It has a stated expiry: Postgres on Day 31.)
- **Why hand-write migrations a tool can generate?** (§5 above.)
- **Why 404 instead of 403 for another user's entry?** (ADR-013.)
- **What happens when someone asks for their account to be deleted?** (Nothing
  good. §4.)
- **The designs describe a free and a paid tier, voice memos and transcription.
  None of it is built. Is the scope real?** (`docs/feature-reconciliation.md`
  lists both feature sets side by side and marks every conflict.)
