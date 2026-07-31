# Neuron — 30-Day Roadmap (v1.0, Ratified)

**Status:** Ratified 2026-07-29. Amendable — see *Rules for the roadmap itself*.
**Numbering:** Public LinkedIn numbering, **Day 0 → Day 29** (30 days total).
This is canonical. The v0.1 draft was one-indexed and off by one; every day
below shifted down by one when it was ratified.

**Constraints this was designed against:**

- ~7 hours/day of focused time
- Near-total beginner on the backend (NestJS, DI, databases, auth, testing)
- Day 29 = deployed, demo-quality, publicly reachable
- Primary learning emphasis: **backend architecture**

---

## The Organizing Idea

This roadmap is **not** a feature checklist divided by 30. It is ordered so
that each day creates the *problem* that the next day solves. You should
rarely be told "today we use X." You should arrive at X because yesterday
hurt.

The spine is four questions, in this order:

1. **Can I store and retrieve a thought?** (persistence, data modeling, HTTP)
2. **Whose thought is it?** (identity, ownership, multi-tenancy)
3. **Can I find a thought I half-remember?** (search → semantic search → RAG)
4. **What do my thoughts mean together?** (aggregation, insight, scheduled work)

Everything else is optional.

### Scope decisions

**In the core path:** journaling, mood, search, memory chat (RAG), weekly
insights, auth, deployment.

**Explicitly deferred:** habit tracking, notifications, calendar view,
file/image attachments, monthly insights, rich-text editing, analytics
dashboards.

Deferred does not mean bad. It means these features teach concepts the core
path already teaches, so they cost time without buying understanding. If a day
ends early, pull one forward — but only if it introduces a *new* problem.

---

## Learning Debt

A construct specific to this project, and it needs to be tracked as
deliberately as technical debt.

Worker agents produce correct code faster than a human can learn the concepts
inside it. Every time that happens, the repo gains code its owner cannot
explain. That is **learning debt**, and unlike technical debt it does not
show up in any linter.

The rule: **a concept a worker introduced is not "done" until it can be
explained without reading the code.** Shipping is not the completion
criterion; comprehension is.

### Open learning debt

| Concept | Introduced | Owed since | Status |
|---|---|---|---|
| `@nestjs/testing` — `Test.createTestingModule`, DI in tests | Day 1 worker | Day 1 | ✅ **Repaid Day 2**, by experiment |
| DI resolves at runtime, not compile time | Day 1 worker | Day 1 | ✅ **Repaid Day 2** — predicted wrong twice, then proven live |
| Symbol injection tokens, factory providers | Day 2 worker | Day 2 | ✅ **Repaid Day 2** |
| Jest — runners, matchers, `describe`/`it`, mocking | Day 1 worker | Day 1 | 🟡 Partial — basics only |
| supertest — what it does that a unit test cannot | Day 1 worker | Day 1 | ✅ **Repaid Day 4 (evening)** — via the route-rename experiment; she explained that e2e names the path in the request and unit tests never mention it |
| Unit vs e2e — what each catches, what each cannot | Day 1 worker | Day 1 | ✅ **Repaid Day 4 (evening)** — predicted correctly that renaming `@Controller('entries')` → `'journal'` would leave all 29 unit tests green and break e2e. Ran it: **29 passed, 9 of 10 e2e failed** |
| Why `build`/`test`/`lint` all miss a type error in a spec | Day 2 audit | Day 2 | ✅ **Repaid Day 4 (evening)** — all four commands answered correctly with the mechanism for each, including that `ts-jest` transpiles rather than compiles |
| Raw SQL, prepared statements, parameter binding | Day 2 worker | Day 2 | ✅ **Repaid Day 4 (evening)** — she explained the parse-then-bind mechanism unprompted and in her own words: the database parses the instruction text first, so by the time values arrive the sentence structure is fixed and data cannot become instruction. Offered and skipped twice before this |
| 4xx vs 5xx — "could the client fix this by sending a different request?" | Day 3 | Day 3 | ✅ **Repaid Day 4** — got all three re-test questions right, and answered the third with the *rule* rather than the two instances, which is the distinction that had failed on Day 3 |
| `400` vs `404` — malformed request vs well-formed request for a thing that does not exist | Day 4 | Day 4 | ✅ **Repaid Day 4** — did not know it, was told once, then applied it correctly and unprompted to `POST {}` |
| **Empty collection is a complete answer, not a failure** | Day 4 | Day 4 | ✅ **Repaid Day 4 (evening)** — ran the experiment, then said it in her own words: *"even in that case the correct answer is no row contains the word and empty array can satisfy it."* That is the idea she could not reach earlier the same day |
| **Type erasure** — TypeScript annotations do not exist at runtime | Day 4 | Day 4 | ✅ **Repaid Day 4** — she compiled the project, read the emitted JavaScript, and saw `{ content: string }` become bare `body` herself. This is the load-bearing fact under all validation |
| Where validation belongs (boundary vs service) | Day 4 | Day 4 | 🟡 **Partial** — she reasoned it out and got it wrong (chose the service), then accepted the argument. The distinction between "is this well-formed?" and "is this allowed?" was given to her, not derived → re-test Day 10 when ownership checks arrive |
| **Reading and judging an existing test suite** | Day 4 | Day 4 | 🟡 **Partial** — she can now predict what unit vs e2e catches. What remains is looking at a suite and naming what it *fails* to cover, which is the skill the Day 3 `ORDER BY` bug needed → Day 5 |
| Route matching is declaration order, first match wins | Day 3 (her own bug) | Day 3 | ✅ **Repaid Day 3** — predicted "static before dynamic", disproven by her own unreachable `/entries/count` |
| Repository pattern — what it is, what crosses the boundary | Day 3 | Day 3 | ✅ **Repaid Day 3** — derived by her from the duplication before it was named |
| Where `id`/`createdAt` should be generated; UUID vs sequential ids | Day 3 | Day 3 | ✅ **Repaid Day 3** — she argued for DB-generated, changed position on evidence, and raised the enforcement objection now recorded in ADR-004 |
| `EntriesRepository` wiring — why the module needed a new provider | Day 3 worker | Day 3 | ✅ **Repaid Day 4 (evening)** — four-part prediction, all four correct. Removed from `providers`: typecheck ✅, build ✅, **server crashed at boot**, **29 unit tests still passed**, e2e failed. She predicted the unit-test result and its reason (spec files declare their own providers and never read `entries.module.ts`) |
| `@Body() body: unknown` vs a named DTO type at a trust boundary | Day 4 worker | Day 4 | ✅ **Repaid Day 4 (evening)** — explained that the compiler *believes* the label, so typecheck and build both pass and the failure surfaces at runtime |

Add a row whenever a worker introduces something unfamiliar. Close it only
when the explanation happens.

---

## Phase 0 — Setup (Day 0–1)

| Day | What happened |
|---|---|
| 0 | Repo initialized. Public build announced. |
| 1 | pnpm workspace wired, NestJS scaffolded, `GET /entries` returning a hardcoded array. ADR-001 (monorepo), ADR-002 (NestJS). **Not audited on the day** — audited retroactively on Day 2. |

---

## Phase 1 — The Request (Days 2–7)

**Goal: one feature, end to end, that you fully understand.**

No auth. No AI. No frontend polish. A single journal entry, created and read
over HTTP. The point is not the feature — it's building the mental model of
what a backend *is* before adding anything to it.

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 2 | Restart the server and the data is gone. Where should data actually live? | Files vs SQLite vs Postgres vs document DBs. What a migration is and why it exists. **Plus: repay testing debt** — what the three existing tests actually do. |
| 3 | SQL strings are scattered through my controller. | Raw SQL vs query builder vs ORM. What a repository is. Why data access gets its own layer. |
| 4 | A client sent `{}` and the server returned a 500. | ✅ **Done.** Validation at the boundary, DTOs, 400 vs 404, and the layering rule that status codes are HTTP vocabulary and belong only in the controller. The load-bearing fact turned out to be **type erasure** — she watched `{ content: string }` vanish from the compiled JavaScript, which is *why* runtime validation has to exist at all. ADR-005. |
| 5 | I changed something and don't know what I broke. | Unit vs integration vs e2e. What is worth testing and what isn't. **Writing** tests, not just reading them. ⚠️ **This day is overloaded — see below.** |
| 6 | My DB password is in a committed file. | Configuration, environments, secret handling, config validation at boot. |
| 7 | **Review day.** Audit, refactor, document. | Everything above, written down as handbook entries. |

**Why this order:** persistence before abstraction (you can't appreciate a
repository pattern until you've felt SQL sprawl); validation before testing
(you need behavior worth asserting); config last, because you only feel the
pain once there's something environment-specific to configure.

### Day 5 was cleared in advance, on Day 4 evening

Day 5 was originally carrying eight owed items and was over capacity. **Six
were closed on the evening of Day 4**, in a single session, by explanation and
experiment rather than by instruction. Two had been owed since Day 1, one since
Day 2 and offered twice before.

What closed: prepared statements · which command catches a spec type error ·
unit vs e2e (route-rename experiment) · supertest · `EntriesRepository` wiring ·
the empty-collection idea · why `unknown` beats a named DTO at a trust boundary.

**The two experiments worth repeating on later days**, because both produced a
result that contradicts intuition:

1. **Rename `@Controller('entries')` to `'journal'`.** The application is
   completely broken — every existing client gets a 404 — and **all 29 unit
   tests still pass.** 9 of 10 e2e tests fail. Unit tests verify that the pieces
   work; e2e verifies that the pieces are *connected*.
2. **Delete `EntriesRepository` from the module's `providers` array.**
   `typecheck` ✅, `build` ✅, **server crashes at boot**, and **29 unit tests
   still pass** — because every spec file declares its own `providers` list and
   never reads `entries.module.ts`. Only the e2e suite loads `AppModule`, so
   only the e2e suite can catch broken production wiring.

**Day 5 therefore starts with room.** What remains for it:

- Reading and judging an existing suite — naming what it *fails* to cover. This
  is the skill the Day 3 `ORDER BY` bug actually needed.
- `docs/learning/day-02/testing-literacy.md` experiments 2–5, unrun since Day 2.
- The `PATCH`/`DELETE` work the day was scheduled for, which forces the
  unknown-fields decision recorded in *Open questions*.

**Direction set by the project owner's husband (Day 4):** she is not required to
write test suites by hand. AI-generated tests are the norm and that is accepted.
The goal is that she can *read* a suite, explain what each kind of test does,
and judge what a suite misses. Day 5 should follow **read → predict → break →
observe**, not "write from scratch."

The pattern still worth naming: **learning debt compounds faster than technical
debt**, because the same worker that repays velocity accrues more of it. But it
is also cheaper to repay than expected — six items took one evening once they
were asked as direct questions with an experiment attached.

---

## Phase 2 — Identity & Ownership (Days 8–14)

**Goal: the single most important backend-architecture lesson — data belongs
to someone.**

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 8 | Anyone can read anyone's entries. Who is making this request? | Sessions vs tokens vs JWT. Statefulness. Why "just use JWT" is not an answer. |
| 9 | Storing a password is a liability. | Hashing vs encryption. Why bcrypt/argon2 are deliberately slow. Registration and login flows. |
| 10 | Authenticated ≠ authorized. | Ownership enforcement, request context, guards. Where tenancy bugs actually live. |
| 11 | Tokens don't expire, and logout does nothing. | Expiry, refresh, revocation, and the tradeoffs of each. |
| 12 | There's no UI. Where does the token live in the browser? | Next.js rendering models, cookies vs localStorage, CORS, the auth boundary across two apps. |
| 13 | Mood is part of the product but isn't modeled. | Data modeling for a second entity. Relationships. Migration on a live schema. |
| 14 | **Review day.** Audit, refactor, document. | |

**Why here:** ownership must be understood *before* AI. A retrieval system
that leaks another user's memories is the worst possible bug in this product,
and you cannot design retrieval safely if tenancy is still fuzzy.

---

## Phase 3 — Memory (Days 15–21)

**Goal: the product's actual differentiator. Discovered, not prescribed.**

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 15 | I want to find the entry about my sister. `LIKE '%sister%'` misses it. | Keyword search, full-text search, indexes. Why lexical matching has a ceiling. |
| 16 | I searched "felt overwhelmed at work" and it matched nothing, though three entries describe exactly that. | Embeddings. Vector similarity. pgvector vs a dedicated vector DB — and why the boring answer usually wins. |
| 17 | A 2000-word entry embedded as one vector retrieves badly. | Chunking. Why chunk size is a real tradeoff, not a config value to copy. |
| 18 | The request now takes 9 seconds because it waits on an AI call. | Sync vs async processing. Queues, workers, job state, failure and retry. |
| 19 | I can retrieve chunks. I want an answer. | RAG end to end. Context assembly. Prompt design. Grounding and citation. |
| 20 | It confidently made something up. | RAG failure modes. Evaluation. Cost and latency budgets. When retrieval is the bug vs when the prompt is. |
| 21 | **Review day.** Audit, refactor, document. | |

**Why this order:** every step here exists because the previous step visibly
failed. Skipping Day 15 to "just do embeddings" would remove the entire reason
embeddings are interesting.

---

## Phase 4 — Insight, Deployment, Hardening (Days 22–29)

**Goal: make it real, and make it survivable.**

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 22 | Weekly summaries have to run without a user clicking anything. | Scheduled work vs queued work. Idempotency. What happens when a job runs twice. |
| 23 | The timeline query loads every entry ever written. | Read patterns, pagination, aggregation, N+1. Measuring before optimizing. |
| 24 | It only runs on my laptop. | Containers, environments, managed Postgres, build vs runtime config. |
| 25 | Deploying by hand is a coin flip. | CI, running migrations in production, secret management, rollback. |
| 26 | Something broke in prod and I have no idea what. | Structured logging, error tracking, health checks, what "observability" actually buys. |
| 27 | Anyone can hammer my AI endpoint and spend my money. | Rate limiting, abuse, input hardening, a real security pass. |
| 28 | Buffer / overflow day. | (Deployment always takes longer than planned. This day is deliberately empty.) |
| 29 | **Final audit + retrospective.** | The full handbook. Every "why" from the success criteria, answered in writing. |

**Why deployment is on Day 24, not Day 29:** first deployments fail in ways
nobody predicts. Five days of slack after the first deploy is the difference
between a live demo and a screenshot of localhost.

**Why deployment isn't on Day 4:** deploying an app with no auth, no data
model, and no config story teaches you how to click buttons on a hosting
dashboard, not how systems are built.

---

## Rules for the roadmap itself

1. **This roadmap will change.** If a day surfaces a better learning
   opportunity, we take it and push the rest down. The buffer on Day 28 exists
   partly for this.
2. **Review days are not optional.** Days 7, 14, 21 are where the audit and
   refactor loop lives. Skipping them to build more features defeats the point.
3. **No day begins with implementation.** Problem → research → discussion →
   decision → ADR (if significant) → design → implement → review.
4. **Every phase ends with written documentation**, not just working code.
5. **Every day ends with an audit.** Day 1 shipped unaudited and the cost was
   real: lint failing on committed code, two contradictory ADRs, and a README
   describing directories that didn't exist. The audit is not a formality.
6. **Learning debt is tracked, not assumed away.** A worker shipping code is
   not the same as the concept being learned.

---

## Open questions

- ~~Does the monorepo earn its complexity?~~ **Resolved** — ADR-001.
- ~~Where does the storage-outcome → HTTP-status mapping belong?~~ **Resolved**
  — ADR-005. The controller, and only the controller. The rule generalises:
  each layer reports outcomes in its own vocabulary, and translation happens
  where the vocabulary changes.
- **Should `POST` reject unknown fields, or ignore them?** Opened Day 4.
  `{"content":"x","id":"mine"}` currently returns 201 and silently drops `id`.
  Safe today because the service reads only `content`. Day 5's `PATCH` forces
  the decision.
- Rich text vs plain text for entries — deferred until the data model forces it.
- Which AI provider, and does that decision need to be reversible? (Phase 3)
- TypeScript 7 (Go-native compiler) is released but blocked by `ts-jest` and
  `typescript-eslint` peer ranges. Revisit when the ecosystem catches up —
  likely around Phase 3.
