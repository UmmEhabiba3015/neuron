# Neuron — Roadmap (v2.0)

**Status:** Revised 2026-09-04, replacing v1.0 (ratified 2026-07-29).
**Numbering:** Public LinkedIn numbering, **Day 0 → Day 39**. This is canonical.

**What changed in v2.0, and why:**

1. **The plan is now 40 days rather than 30.** This is not a slip being
   ratified after the fact. Days 0 through 8 delivered more than the original
   plan asked for — migrations, an ORM, and a configuration story all arrived
   early because real problems forced them — and the original 30 days had no
   room for a frontend beyond a single day. Forty days is what the actual scope
   costs at the standard this project has been holding.
2. **Frontend designs now exist.** They are shared at a fixed point (Day 12,
   the design review) so that the API is shaped by what the screens actually
   need, instead of the screens being bent around whatever the API happened to
   return.
3. **The days are honest about where the project really is.** Day 8 did not
   deliver authentication; it delivered ownership and a migration story.
   Day 9 carries the difference.

**Constraints this was designed against:**

- ~7 hours/day of focused time, taken as whole days rather than spread thin
- A learner who was a near-total beginner on the backend at Day 0 and is not
  one now
- Day 39 = deployed, demo-quality, publicly reachable
- Primary learning emphasis: **backend architecture**, with frontend treated as
  a real but secondary skill

---

## Where The Project Actually Stands (as of Day 8, verified 2026-09-04)

Everything in this section was re-run and confirmed rather than copied from a
previous report.

**Shipped and working.** A NestJS API in a pnpm workspace that stores journal
entries in SQLite. Data access lives behind a repository. Input is validated at
the boundary by `class-validator` and a globally registered pipe. Configuration
is checked once at boot and the application refuses to start when it is wrong.
Schema changes happen through TypeORM migrations and never at boot. A `users`
table exists, and `entries.user_id` exists with a real foreign key.

**The numbers.** 874 lines of production code. 108 unit tests and 35
end-to-end tests, all passing. Ten architecture decision records. Typecheck,
lint and build all clean.

**Not built yet, and worth saying plainly.** Nothing authenticates. No endpoint
knows who is calling it. There is no way to create a user. There is no frontend
at all. There is no AI in the product yet.

**The one structural weakness in the codebase.** The test suite is good at
checking that pieces work and has been repeatedly bad at checking that pieces
are *connected*. Three times in three days, deleting a single line disconnected
an entire day's work while every test stayed green: `validate,` on Day 6, the
`APP_PIPE` provider on Day 7, and `synchronize: false` on Day 8. Each was found
by mutation during an audit, not by a test. Each now has a test. **The rule this
produced: a test that does not fail when the wiring is removed has not been
written.** Every future day is expected to include one mutation check.

---

## The Organizing Idea

This roadmap is **not** a feature checklist divided by forty. It is ordered so
that each day creates the *problem* that the next day solves. You should rarely
be told "today we use X." You should arrive at X because yesterday hurt.

The spine is five questions, in this order:

1. **Can I store and retrieve a thought?** (persistence, data modeling, HTTP)
2. **Whose thought is it?** (identity, ownership, multi-tenancy)
3. **Can a person actually use this?** (frontend, the auth boundary across two apps)
4. **Can I find a thought I half-remember?** (search → semantic search → RAG)
5. **What do my thoughts mean together?** (aggregation, insight, scheduled work)

Question 3 is new in v2.0 and it is deliberately placed before the AI work.
A retrieval feature with no interface is a feature nobody can judge.

### Scope decisions

**In the core path:** journaling, mood, search, memory chat (RAG), weekly
insights, auth, a real frontend, deployment.

**Explicitly deferred:** habit tracking, notifications, calendar view,
file and image attachments, monthly insights, rich-text editing, analytics
dashboards.

Deferred does not mean bad. It means these features teach concepts the core
path already teaches, so they cost time without buying understanding. If a day
ends early, pull one forward — but only if it introduces a *new* problem.

---

## A Note On Pace

Days 0 through 8 took longer than nine days. That is worth being straight about
rather than quietly re-baselining.

Some of the overrun bought something real. Day 8's detour into TypeORM and
migrations was forced by an actual problem — a `NOT NULL` column cannot be
added to a populated table by a `CREATE TABLE IF NOT EXISTS` at boot — and it
made Day 13 easier rather than harder. That is the roadmap working as intended.

Some of it did not. Gaps between working days cost more than the work itself,
because every return begins with reloading context that was already paid for
once.

**The target from here is a working day that ends with something merged.** Not
a longer day. A finished one. A day that ends with a decision made, a worker
run, an audit done, and a merge is a day that compounds; a day that ends
mid-block has to be partly repeated. The single highest-value change available
right now is not working harder, it is not stopping in the middle.

Days 20, 27, 34 and 38 exist as slack. They are real days with real work in
them, but they are the first places to absorb an overrun, and using them for
that is expected rather than a failure.

---
## Phase 0 — Setup (Days 0–1) — complete

| Day | What happened |
|---|---|
| 0 | Repo initialized. Public build announced. |
| 1 | pnpm workspace wired, NestJS scaffolded, `GET /entries` returning a hardcoded array. ADR-001 (monorepo), ADR-002 (NestJS). Not audited on the day; audited retroactively on Day 2, and the cost was real — lint failing on committed code, two contradictory ADRs, and a README describing directories that did not exist. |

---

## Phase 1 — The Request (Days 2–7) — complete

**Goal: one feature, end to end, that she fully understands.**

| Day | Problem solved | The idea that came out of it |
|---|---|---|
| 2 | Restart the server and the data is gone. | Files vs SQLite vs Postgres. What a migration is. ADR-003. |
| 3 | SQL strings scattered through the controller. | What a repository is, and what may cross its boundary. ADR-004. |
| 4 | A client sent `{}` and the server returned a 500. | Validation at the boundary; 400 vs 404; status codes are HTTP vocabulary and belong only in the controller. The load-bearing fact was **type erasure** — she watched `{ content: string }` vanish from the compiled JavaScript. ADR-005. |
| 5 | I changed something and don't know what I broke. | Reading and judging a suite. **Three real defects found inside a fully green 39-test suite**, all by her, all confirmed over real HTTP. The idea: **a missing test is usually a missing decision.** ADR-006. |
| 6 | My database path is in a committed file. | Configuration checked once at boot, refusing to start when wrong. The idea: **the dangerous configuration bug is not the one that crashes — it is the one that starts.** ADR-007. |
| 7 | 91 lines of hand-written parsing in a controller. | `class-validator` and a globally registered pipe. The idea: **a library knows about shapes; it does not know about your product** — which is why two rules stayed hand-written. ADR-008. |

---

## Phase 2 — Identity & Ownership (Days 8–14)

**Goal: the single most important backend-architecture lesson — data belongs
to someone.**

| Day | Problem to solve | What she should be able to explain afterward |
|---|---|---|
| 8 | Anyone can read anyone's entries. Who is making this request? | **Done, partly.** The decisions were made — sessions vs tokens, why "just use JWT" is not an answer (ADR-009) — and then the day went somewhere the plan did not. `users` needed a second table and `user_id` needed a non-additive schema change, which fired two of ADR-004's named revisit conditions at once, so the project moved to **TypeORM with migrations** (ADR-010). `users` and `entries.user_id` exist. **Nothing yet knows who is asking.** |
| 9 | Storing a password is a liability — and there is still no way to create a user at all. | Hashing vs encryption. Why bcrypt and argon2 are deliberately slow. Registration and login. **Plus the identity work Day 8 did not reach:** issuing and verifying a token, and an endpoint that can name its caller. This is a heavy day; if it splits, it splits at "a user exists" / "a request is identified", and Day 20 absorbs it. |
| 10 | Authenticated is not the same as authorized. | Ownership enforcement, request context, guards. Where tenancy bugs actually live. **This is the day `select: false` on `entries.user_id` stops being a safety net and becomes a thing a query must opt into by name.** |
| 11 | Tokens don't expire, and logging out does nothing. | Expiry, refresh, revocation, and the trade-offs of each. This is where her Day 8 objection gets answered in code: she argued that a stolen token stays cryptographically valid after logout, and she was right. |
| 12 | **Design review. The screens exist; the API was built without seeing them.** | See the section below. This is where the frontend designs are shared, the API is checked against what the screens actually need, and both the roadmap and the designs are amended. **No implementation on this day.** |
| 13 | Mood is part of the product but isn't modeled. | Data modeling for a second entity. Relationships. A migration on a live schema. Easier than it would have been, because Day 8 already built all three mechanisms. |
| 14 | **Review day.** Audit, refactor, document. | The handbook entries for Phase 2. This is also where the Phase 1 documentation debt gets paid. |

**Why identity comes before AI:** a retrieval system that leaks another user's
memories is the worst possible bug in this product, and retrieval cannot be
designed safely while tenancy is still fuzzy.

---

## Phase 3 — The Interface (Days 15–20)

**Goal: a person who is not her can use this.**

This phase is new in v2.0. In v1.0 the frontend was one day (the old Day 12)
and that was never realistic — it would have produced a screenshot rather than
a product.

| Day | Problem to solve | What she should be able to explain afterward |
|---|---|---|
| 15 | There is no UI, and the token has to live somewhere in a browser. | Next.js rendering models — what runs on the server and what runs in the browser, and why that question decides everything else. Cookies vs `localStorage` for the token, and why the answer is a security decision rather than a convenience one. CORS: what it actually protects against. |
| 16 | Two apps now describe the same data, in two places, and they will drift. | Sharing types across a monorepo. This is the day `packages/` earns the workspace ADR-001 argued for on Day 1 — or fails to, and gets removed. Either outcome is a real result. |
| 17 | The journal screen works and feels broken. | Loading, empty and error states as first-class design concerns rather than afterthoughts. Optimistic updates. What a user sees while a request is in flight. |
| 18 | Writing an entry is the product, and the editor is an afterthought. | The core writing experience. Autosave and what it means for the API — does a draft hit the server, and if so how often, and what happens on a failed save. This is likely to produce a real API change. |
| 19 | It works on her laptop, at her screen size, signed in as herself. | Responsive layout, keyboard access, and a genuine pass at accessibility rather than a checklist. |
| 20 | **Slack / overflow.** | Deliberately light. First call on absorbing an overrun from Day 9 or Phase 2. |

---

## Phase 4 — Memory (Days 21–27)

**Goal: the product's actual differentiator. Discovered, not prescribed.**

| Day | Problem to solve | What she should be able to explain afterward |
|---|---|---|
| 21 | I want to find the entry about my sister. `LIKE '%sister%'` misses it. | Keyword search, full-text search, indexes. Why lexical matching has a ceiling. **The escaping work from Day 5 dies here, and that was predicted on Day 5** — the durable artifact was the claim, not the SQL. |
| 22 | I searched "felt overwhelmed at work" and it matched nothing, though three entries describe exactly that. | Embeddings. Vector similarity. pgvector vs a dedicated vector database, and why the boring answer usually wins. |
| 23 | A 2000-word entry embedded as one vector retrieves badly. | Chunking, and why chunk size is a real trade-off rather than a config value to copy. |
| 24 | The request now takes nine seconds because it waits on an AI call. | Synchronous vs asynchronous processing. Queues, workers, job state, failure and retry. |
| 25 | I can retrieve chunks. I want an answer. | RAG end to end. Context assembly, prompt design, grounding and citation. |
| 26 | It confidently made something up. | RAG failure modes. Evaluation. Cost and latency budgets. When retrieval is the bug and when the prompt is. |
| 27 | **Review day + slack.** | Audit, refactor, document. Second call on absorbing an overrun. |

**Why this order:** every step exists because the previous step visibly failed.
Skipping Day 21 to "just do embeddings" would remove the entire reason
embeddings are interesting.

---

## Phase 5 — Insight, Deployment, Hardening (Days 28–39)

**Goal: make it real, and make it survivable.**

| Day | Problem to solve | What she should be able to explain afterward |
|---|---|---|
| 28 | Weekly summaries have to run without a user clicking anything. | Scheduled work vs queued work. Idempotency. What happens when a job runs twice. |
| 29 | The timeline query loads every entry ever written. | Read patterns, pagination, aggregation, N+1. Measuring before optimizing. |
| 30 | Insights exist in the database and nowhere on screen. | The insight and chat interfaces. Streaming a response into a UI, and what that costs in complexity. |
| 31 | It only runs on my laptop. | Containers, environments, managed Postgres, build-time vs runtime configuration. **This is where SQLite is left behind, and where ADR-003's stated revisit condition finally fires.** |
| 32 | Deploying by hand is a coin flip. | CI, running migrations in production, secret management, rollback. Day 8's migration work is what makes this a real conversation rather than a hosting tutorial. |
| 33 | Something broke in production and I have no idea what. | Structured logging, error tracking, health checks, and what observability actually buys. |
| 34 | **Slack / overflow.** | Third call on absorbing an overrun. Deployment always takes longer than planned. |
| 35 | Anyone can hammer my AI endpoint and spend my money. | Rate limiting, abuse, input hardening, and a real security pass. |
| 36 | Nobody has ever used this except me. | A real user test with a real person. Findings become a backlog, and the backlog gets triaged rather than implemented wholesale. |
| 37 | The findings from Day 36. | Fix what a real person actually tripped over. |
| 38 | **Slack / polish.** | Final buffer. |
| 39 | **Final audit and retrospective.** | The full handbook. Every "why" from the success criteria, answered in writing. |

**Why deployment is on Day 31 and not Day 39:** first deployments fail in ways
nobody predicts. Eight days of slack after the first deploy is the difference
between a live demo and a screenshot of localhost.

---
## Day 12 — The Design Review

Frontend designs exist. They were made outside this thread and have not been
seen by anyone who has been building the API.

**This is the day they are shared.** It is placed here on purpose. Earlier, and
the API would be shaped by screens before ownership and auth are settled, which
are the two things most likely to change what a screen can show. Later, and the
API would be finished and the screens would have to bend around it. Day 12 is
after auth is real and before the frontend is built, which is the only window
where both documents can still move.

**Nothing is implemented on Day 12.** The output is an amended roadmap, an
amended set of designs, and — if the gap is large enough — an ADR.

### What has to be established on the day

For each screen, three questions, asked in this order:

1. **What does this screen need from the API that does not exist yet?**
2. **What does the API already return that this screen has no place for?** An
   unused field is a maintained field, and it is cheaper to notice now.
3. **What is on this screen that no data model can currently support?** This is
   the expensive category, because the answer is a migration.

Then one question about the set as a whole: **is there a screen that only makes
sense if two requests happen together?** That is where pagination, batching or
a combined endpoint gets decided, and deciding it after the screens are built
means rebuilding them.

### Frontend changes to expect, and why

These are raised now so the designs can be revisited before the day rather than
argued about during it. Each one comes from something the API already does, or
already cannot do.

**1. Every list needs an empty state, and it is not an error.** ADR-005
established that an empty collection is a complete answer. `GET /entries` on a
new account returns `[]` and that is success. If the designs show a journal
list with no "you haven't written anything yet" state, one is needed — and it
is the first screen a new user ever sees, so it is not a minor case.

**2. Search needs a "no results" state that is visibly different from an empty
journal.** Same reason, different sentence. "You have no entries" and "no
entries match *sister*" are different messages, and the API deliberately
distinguishes them.

**3. Search needs to show what was searched for.** ADR-006 decided that `%` and
`_` are ordinary characters, so searching for `100%` is a legitimate query with
a real answer. The design should not assume the search term is cosmetic.

**4. Validation errors need somewhere to appear, per field.** The API answers a
bad body with a 400 carrying an array of messages — for example `content must
contain at least one character that is not whitespace`. If the designs only
have room for one global error banner, that array has nowhere to go. This is
the most likely place the designs and the API are already misaligned.

**5. An entry that is only whitespace is refused.** The editor should not let a
user write four spaces, press save, and receive an error they do not
understand. Either the button disables, or the message is written for a person.

**6. Editing does not change the entry's date.** ADR-006 decided `created_at`
records when the entry was written, not when it was last touched. If a design
shows "last edited", that field does not exist and would need a migration —
which is a real decision, not a small one.

**7. Deleting returns the deleted entry, which was chosen so undo is
possible.** ADR-006 made that choice explicitly. If the designs have no undo,
either add one or the API is returning something nobody wants.

**8. There is no draft or autosave concept in the API.** Day 18 is where this
is decided, and it will be much cheaper if the designs have already said
whether the editor saves as you type, saves on blur, or saves on a button.
These are three different APIs.

**9. Login has to fail visibly and vaguely.** "Wrong password" tells an
attacker the account exists. The design needs one failure state that covers
both cases, and that constraint should be in the design rather than discovered
in review.

**10. Nothing in the API supports a calendar or a mood chart yet.** Mood
arrives on Day 13 and analytics are explicitly deferred. If the designs contain
either, that is a scope conversation for Day 12 rather than a surprise on
Day 30.

### What to bring

The designs themselves, at whatever fidelity they exist, and a note of which
screens are considered settled versus still in flux. A design that is still
moving is more useful on this day than one that is frozen, because Day 12 is
allowed to change both documents.

---
## Learning Debt

A construct specific to this project, tracked as deliberately as technical
debt.

Worker agents produce correct code faster than a human can learn the concepts
inside it. Every time that happens, the repository gains code its owner cannot
explain. That is **learning debt**, and unlike technical debt it shows up in no
linter.

The rule: **a concept a worker introduced is not "done" until it can be
explained without reading the code.** Shipping is not the completion criterion;
comprehension is.

### Currently open

**Day 8's TypeORM debt blocks Day 9.** Direction from the project owner,
2026-09-04: the debt is repaid before the next day starts, and a request from
her to skip it is not sufficient to skip it. This overrides the usual rule that
she may choose to move on. See `docs/HANDOFF.md`.


| Concept | Introduced | Status |
|---|---|---|
| **TypeORM** — entities, the repository boundary, `select: false`, `Raw` vs `Like`, `synchronize`, migrations | Day 8 | 🔴 **Open, and blocking Day 9 by the owner's direction.** Partly addressed in-session — she predicted correctly that `select: false` means a query returns no `userId`. A full study prompt exists at `docs/learning/day-08/study-typeorm.md` and is designed to be run in a separate session. |
| `transform: true` on the validation pipe | Day 7 | 🟡 **Offered and declined.** Logged rather than forgotten. Worth picking up on Day 14. |
| Where validation belongs — boundary vs service | Day 4 | 🟡 **Partial.** She reasoned it out, got it wrong, and accepted the argument; the distinction was given to her rather than derived. **Re-test on Day 10**, when ownership checks arrive and the same question returns in a harder form. |
| Reading and judging a whole suite unprompted | Day 4 | 🟡 **Partial.** She has found real gaps when handed cases one at a time. Doing it across an entire suite without prompting is the remaining step. |
| Jest — runners, matchers, mocking | Day 1 | 🟡 **Basics only.** Sufficient for now and not worth a dedicated day. |

### Closed, with how it closed

Twenty-one items have been closed since Day 1. The full record is in the git
history of this file; what matters is the pattern rather than the list.

**Six items closed in a single evening on Day 4** — two of which had been owed
since Day 1 and one offered twice before. They closed when they were asked as
direct questions with an experiment attached, rather than explained. That is
the most useful finding this project has produced about how she learns, and it
is why every teaching block now carries a prediction and a command to run.

**The two experiments worth repeating on later days**, because both produce a
result that contradicts intuition:

1. **Rename `@Controller('entries')` to `'journal'`.** The application is
   completely broken — every existing client gets a 404 — and all unit tests
   still pass. Unit tests verify that the pieces work; end-to-end verifies that
   the pieces are connected.
2. **Delete `EntriesRepository` from the module's `providers` array.**
   Typecheck passes, build passes, the server crashes at boot, and the unit
   tests still pass — because every spec file declares its own providers and
   never reads `entries.module.ts`.

Add a row whenever a worker introduces something unfamiliar. Close it only when
the explanation happens.

---

## Rules for the roadmap itself

1. **This roadmap will change.** If a day surfaces a better learning
   opportunity, take it and push the rest down. That is what the slack days are
   for. v2.0 exists because v1.0 was followed rather than obeyed.
2. **Review days are not optional.** Days 14, 27 and 39 are where the audit and
   refactor loop lives. Skipping them to build more features defeats the point.
3. **No day begins with implementation.** Problem, then research, then
   discussion, then decision, then an ADR if it is significant, then design,
   then implementation, then review.
4. **Every phase ends with written documentation**, not just working code.
5. **Every day ends with an audit, and the audit includes a mutation.** Delete
   the line that makes the day's work load-bearing and run everything. If it
   all still passes, the day shipped untested wiring. This rule exists because
   that has now happened three times.
6. **Learning debt is tracked, not assumed away.** A worker shipping code is
   not the same as the concept being learned.
7. **A day ends merged.** A day that stops mid-block costs part of itself again
   on the next start.

---

## Open questions

- ~~Does the monorepo earn its complexity?~~ Answered provisionally by ADR-001
  and **genuinely tested on Day 16**, when a second application needs the same
  types. That is the day the answer is real rather than argued.
- ~~Where does the storage-outcome to HTTP-status mapping belong?~~ **Resolved**
  — ADR-005. The controller, and only the controller. The rule generalises:
  each layer reports outcomes in its own vocabulary, and translation happens
  where the vocabulary changes.
- ~~Should `POST` reject unknown fields, or ignore them?~~ **Resolved Day 5** —
  both `POST` and `PATCH` reject with a 400 (ADR-006).
- ~~What should search do with `%` and `_`?~~ **Resolved Day 5** — treat them as
  ordinary characters and escape them before they reach `LIKE`.
- **Does deleting a user delete their journal?** The foreign key currently says
  `ON DELETE NO ACTION`, which refuses. That is the generator's default rather
  than a decision. Day 10 or Day 11 must decide it deliberately.
- **When does `user_id` become `NOT NULL`?** Day 8 added it nullable because no
  user existed yet. That is the expand step of expand-backfill-contract, and
  the contract step is unscheduled. Day 10 is the natural home.
- **Where does the token live in the browser?** Day 15, and it is a security
  decision rather than a convenience one.
- Rich text versus plain text for entries — deferred until the data model
  forces it, most likely Day 18.
- Which AI provider, and does that decision need to be reversible? Phase 4.
- `better-sqlite3@13.0.3` sits outside `typeorm`'s `^12.0.0` peer range. It
  works and is pinned. It dissolves on Day 31 when Postgres arrives, so it is
  deliberately not being fixed.
- TypeScript 7 (the Go-native compiler) is released but blocked by `ts-jest` and
  `typescript-eslint` peer ranges. Revisit around Phase 4.
