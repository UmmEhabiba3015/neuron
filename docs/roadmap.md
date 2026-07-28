# Neuron — 29-Day Roadmap (v0.1 DRAFT)

**Status:** Draft, pending pushback. Not agreed yet.
**Created:** Day 2 (2026-07-28)
**Constraints this was designed against:**

- ~7 hours/day of focused time
- Near-total beginner on the backend (NestJS, DI, databases, auth)
- Day 30 = deployed, demo-quality, publicly reachable
- Primary learning emphasis: **backend architecture**

---

## The Organizing Idea

This roadmap is **not** a feature checklist divided by 29. It is ordered so that
each day creates the *problem* that the next day solves. You should rarely be
told "today we use X." You should arrive at X because yesterday hurt.

The spine is four questions, in this order:

1. **Can I store and retrieve a thought?** (persistence, data modeling, HTTP)
2. **Whose thought is it?** (identity, ownership, multi-tenancy)
3. **Can I find a thought I half-remember?** (search → semantic search → RAG)
4. **What do my thoughts mean together?** (aggregation, insight, scheduled work)

Everything else is optional.

### Scope decisions

**In the core path:** journaling, mood, search, memory chat (RAG), weekly
insights, auth, deployment.

**Explicitly deferred:** habit tracking, notifications, calendar view, file/image
attachments, monthly insights, rich-text editing, analytics dashboards.

Deferred does not mean bad. It means these features teach concepts the core path
already teaches, so they cost time without buying understanding. If a day ends
early, pull one forward — but only if it introduces a *new* problem.

---

## Phase 1 — The Request (Days 2–8)

**Goal: one feature, end to end, that you fully understand.**

No auth. No AI. No frontend polish. A single journal entry, created and read
over HTTP. The point is not the feature — it's building the mental model of
what a backend *is* before adding anything to it.

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 2 | The repo is scaffolding, not a project. What am I building, and in what shape? | Why a monorepo (or not). Why NestJS. What a framework does that raw Node doesn't. |
| 3 | Restart the server and the data is gone. Where should data actually live? | Files vs SQLite vs Postgres vs document DBs. What a migration is and why it exists. |
| 4 | SQL strings are scattered through my controller. | Raw SQL vs query builder vs ORM. What a repository is. Why data access gets its own layer. |
| 5 | A client sent `{}` and the server returned a 500. | Validation at the boundary. DTOs. HTTP status semantics. Why errors are a design surface. |
| 6 | I changed something and don't know what I broke. | Unit vs integration vs e2e. What is worth testing and what isn't. |
| 7 | My DB password is in a committed file. | Configuration, environments, secret handling, config validation at boot. |
| 8 | **Review day.** Audit, refactor, document. | Everything above, written down as handbook entries. |

**Why this order:** persistence before abstraction (you can't appreciate a
repository pattern until you've felt SQL sprawl); validation before testing
(you need behavior worth asserting); config last, because you only feel the pain
once there's something environment-specific to configure.

---

## Phase 2 — Identity & Ownership (Days 9–15)

**Goal: the single most important backend-architecture lesson — data belongs to
someone.**

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 9 | Anyone can read anyone's entries. Who is making this request? | Sessions vs tokens vs JWT. Statefulness. Why "just use JWT" is not an answer. |
| 10 | Storing a password is a liability. | Hashing vs encryption. Why bcrypt/argon2 are deliberately slow. Registration and login flows. |
| 11 | Authenticated ≠ authorized. | Ownership enforcement, request context, guards. Where tenancy bugs actually live. |
| 12 | Tokens don't expire, and logout does nothing. | Expiry, refresh, revocation, and the tradeoffs of each. |
| 13 | There's no UI. Where does the token live in the browser? | Next.js rendering models, cookies vs localStorage, CORS, the auth boundary across two apps. |
| 14 | Mood is part of the product but isn't modeled. | Data modeling for a second entity. Relationships. Migration on a live schema. |
| 15 | **Review day.** Audit, refactor, document. | |

**Why here:** ownership must be understood *before* AI. A retrieval system that
leaks another user's memories is the worst possible bug in this product, and
you cannot design retrieval safely if tenancy is still fuzzy.

---

## Phase 3 — Memory (Days 16–22)

**Goal: the product's actual differentiator. Discovered, not prescribed.**

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 16 | I want to find the entry about my sister. `LIKE '%sister%'` misses it. | Keyword search, full-text search, indexes. Why lexical matching has a ceiling. |
| 17 | I searched "felt overwhelmed at work" and it matched nothing, though three entries describe exactly that. | Embeddings. Vector similarity. pgvector vs a dedicated vector DB — and why the boring answer usually wins. |
| 18 | A 2000-word entry embedded as one vector retrieves badly. | Chunking. Why chunk size is a real tradeoff, not a config value to copy. |
| 19 | The request now takes 9 seconds because it waits on an AI call. | Sync vs async processing. Queues, workers, job state, failure and retry. |
| 20 | I can retrieve chunks. I want an answer. | RAG end to end. Context assembly. Prompt design. Grounding and citation. |
| 21 | It confidently made something up. | RAG failure modes. Evaluation. Cost and latency budgets. When retrieval is the bug vs when the prompt is. |
| 22 | **Review day.** Audit, refactor, document. | |

**Why this order:** every step here exists because the previous step visibly
failed. Skipping Day 16 to "just do embeddings" would remove the entire reason
embeddings are interesting.

---

## Phase 4 — Insight, Deployment, Hardening (Days 23–30)

**Goal: make it real, and make it survivable.**

| Day | Problem to solve | What you should be able to explain afterward |
|-----|------------------|---------------------------------------------|
| 23 | Weekly summaries have to run without a user clicking anything. | Scheduled work vs queued work. Idempotency. What happens when a job runs twice. |
| 24 | The timeline query loads every entry ever written. | Read patterns, pagination, aggregation, N+1. Measuring before optimizing. |
| 25 | It only runs on my laptop. | Containers, environments, managed Postgres, build vs runtime config. |
| 26 | Deploying by hand is a coin flip. | CI, running migrations in production, secret management, rollback. |
| 27 | Something broke in prod and I have no idea what. | Structured logging, error tracking, health checks, what "observability" actually buys. |
| 28 | Anyone can hammer my AI endpoint and spend my money. | Rate limiting, abuse, input hardening, a real security pass. |
| 29 | Buffer / overflow day. | (Deployment always takes longer than planned. This day is deliberately empty.) |
| 30 | **Final audit + retrospective.** | The full handbook. Every "why" from the success criteria, answered in writing. |

**Why deployment is on Day 25, not Day 30:** first deployments fail in ways
nobody predicts. Four days of slack after the first deploy is the difference
between a live demo and a screenshot of localhost.

**Why deployment isn't on Day 5:** deploying an app with no auth, no data model,
and no config story teaches you how to click buttons on a hosting dashboard,
not how systems are built.

---

## Rules for the roadmap itself

1. **This roadmap will change.** If a day surfaces a better learning
   opportunity, we take it and push the rest down. The buffer on Day 29 exists
   partly for this.
2. **Review days are not optional.** Days 8, 15, 22 are where the audit and
   refactor loop lives. Skipping them to build more features defeats the point.
3. **No day begins with implementation.** Problem → research → discussion →
   decision → ADR (if significant) → design → implement → review.
4. **Every phase ends with written documentation**, not just working code.

---

## Open questions

- Does the monorepo earn its complexity? (Day 2, ADR-001)
- Rich text vs plain text for entries — deferred until the data model forces it.
- Which AI provider, and does that decision need to be reversible? (Phase 3)
