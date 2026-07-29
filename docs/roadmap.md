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
| supertest — what it does that a unit test cannot | Day 1 worker | Day 1 | ❌ Owed → Day 5 |
| Unit vs e2e — what each catches, what each cannot | Day 1 worker | Day 1 | ❌ Owed → Day 5 |
| Why `build`/`test`/`lint` all miss a type error in a spec | Day 2 audit | Day 2 | ❌ Owed → Day 5 |
| Raw SQL, prepared statements, parameter binding | Day 2 worker | Day 2 | ❌ Owed → Day 3 |

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
| 4 | A client sent `{}` and the server returned a 500. | Validation at the boundary. DTOs. HTTP status semantics. Why errors are a design surface. |
| 5 | I changed something and don't know what I broke. | Unit vs integration vs e2e. What is worth testing and what isn't. **Writing** tests, not just reading them. |
| 6 | My DB password is in a committed file. | Configuration, environments, secret handling, config validation at boot. |
| 7 | **Review day.** Audit, refactor, document. | Everything above, written down as handbook entries. |

**Why this order:** persistence before abstraction (you can't appreciate a
repository pattern until you've felt SQL sprawl); validation before testing
(you need behavior worth asserting); config last, because you only feel the
pain once there's something environment-specific to configure.

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
- Rich text vs plain text for entries — deferred until the data model forces it.
- Which AI provider, and does that decision need to be reversible? (Phase 3)
- TypeScript 7 (Go-native compiler) is released but blocked by `ts-jest` and
  `typescript-eslint` peer ranges. Revisit when the ecosystem catches up —
  likely around Phase 3.
