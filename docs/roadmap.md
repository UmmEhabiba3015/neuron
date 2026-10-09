# Neuron — Roadmap (v3.0)

**Status:** Rewritten 2026-10-10 at the hand-off, replacing v2.0 (2026-09-04).
**Numbering:** Public LinkedIn numbering, **Day 0 to Day 39**. It is
canonical, because published posts cannot be renumbered. A day inserted
between two numbered days takes a letter (17a) or a name (Screens Day), so
every later day keeps its number.

**What changed in v3.0.** Nothing in the plan ahead moved. The document was
cut from about 690 lines to the plan and its current state. The full v2.0,
with the Day 12 design review, the scored predictions and the learning-debt
history, is in git:

```bash
git show 340077b:docs/roadmap.md
```

**Constraints:** about 7 focused hours a day, taken as whole days; Day 39 is
deployed, demo-quality and publicly reachable; backend architecture is the
main subject, frontend real but secondary. **The plan may be extended by as
many days as the work needs** (her husband, 2026-10-04); finishing soon is
still the aim.

---

## Where the project stands (2026-10-10)

Days 0 to 17c and Screens Day are done and merged. **The next day is 18.**

A person can create an account, sign in, sign out, write and delete entries,
set a day's mood, and look back through the Timeline as a list or a calendar.
Every screen of the designer's prototype is drawn; a control whose feature is
not built says "This is not built yet." and sends nothing, and all of them are
listed in `apps/web/lib/unbuilt.ts` with their day. 246 API unit tests, 365
API end-to-end tests, 171 web tests, 7 contract checks. 21 ADRs.

Still not built: any AI, voice, real search, editing, drafts, forgot
password, changing the timezone or name, devices, export, account deletion.

---

## The organizing idea

The roadmap is ordered so that each day creates the problem the next day
solves. She should rarely be told "today we use X". She should arrive at X
because yesterday hurt.

The spine is five questions:

1. **Can I store and retrieve a thought?** Persistence, data modelling, HTTP.
2. **Whose thought is it?** Identity, ownership.
3. **Can a person actually use this?** The frontend, and the auth boundary
   across two apps.
4. **Can I find a thought I half-remember?** Search, then semantic search,
   then retrieval-augmented answers.
5. **What do my thoughts mean together?** Aggregation, scheduled work,
   deployment.

## Scope

The live statement of scope is [requirements.md](requirements.md), hers.
In brief:

- **In and scheduled:** journaling, mood, days in the user's timezone, the
  Timeline and calendar, editing, drafts, forgot password, search, memory
  chat, weekly reflections, export, account deletion, devices, deployment.
- **In, with no day yet:** voice memos (record, store, transcribe), "keep
  this out of memory" (before Day 22), the support page's words, what the
  privacy page says about training, moving the calendar between months.
- **Out:** tiers (refused, ADR-016), guest use, offline, import, a native
  mobile app, trackers beyond mood, notifications, distress detection, rich
  text, mood charts, monthly insights, photo and file attachments.

---

## Phase 0 — Setup (Days 0–1) — done

| Day | What happened |
|---|---|
| 0 | Repository started; the build announced in public |
| 1 | pnpm workspace, NestJS scaffold, `GET /entries` returning a fixed array. ADR-001, ADR-002 |

## Phase 1 — The Request (Days 2–7) — done

Goal: one feature end to end that she fully understands. Handbook:
[phase-1-the-request.md](handbook/phase-1-the-request.md).

| Day | Problem | The idea that came out of it |
|---|---|---|
| 2 | Restart the server and the data is gone | SQLite; what a migration is. ADR-003 |
| 3 | SQL strings scattered through the controller | A repository, and what may cross its boundary. ADR-004 |
| 4 | `{}` answered with a 500 | Validation at the boundary; status codes live in the controller; type erasure. ADR-005 |
| 5 | I changed something and don't know what broke | Three real defects found in a green suite: a missing test is usually a missing decision. ADR-006 |
| 6 | The database path is in a committed file | Configuration checked once at start: the dangerous bug is the one that starts. ADR-007 |
| 7 | 91 lines of hand-written parsing | `class-validator` and a global pipe; a library knows shapes, not your product. ADR-008 |

## Phase 2 — Identity and Ownership (Days 8–14) — done

Goal: data belongs to someone. Handbook:
[phase-2-identity-and-ownership.md](handbook/phase-2-identity-and-ownership.md).

| Day | Problem | The idea that came out of it |
|---|---|---|
| 8 | Who is making this request? | Sessions versus tokens (ADR-009). A non-additive schema change forced TypeORM and migrations (ADR-010) |
| 9 | Storing a password is a liability | argon2id, deliberately slow; registration and login. ADR-011, ADR-012 |
| 10 | Authenticated is not authorized | Ownership in the `WHERE` clause; `404` never `403`; routes closed by default. ADR-013 |
| 11 | Logging out does nothing | Sessions checked on every request; rotating refresh tokens; reuse ends everything. ADR-014 |
| 12 | The designs exist and the API never saw them | The designs model days, not entries. Email login; voice in scope; no tiers. ADR-015, ADR-016 |
| 13 | Mood has nowhere to live | The `days` table, its business key, mood, pagination |
| 14 | Review day | A 20-mutation sweep found states nobody had tested; the handbook began. ADR-017 |

## Phase 3 — The Interface (Days 15–20) — open

Goal: a person who is not her can use this.

| Day | Problem | What was done, or is planned |
|---|---|---|
| 15 | No UI, and the token must live somewhere in a browser | **Done.** Refresh credential in an `HttpOnly` cookie, access token in memory, one CORS origin. The web app signs in and shows entries. ADR-018 |
| 16 | Two apps describe the same data in two places | **Done.** `packages/contracts`; `entries.day_id` made `NOT NULL`. ADR-019 |
| 17 | The journal screen works and feels broken | **Done.** Writing (waits for the API) and deleting (soft, shows at once). ADR-020, ADR-021 |
| 17a | The designer replaced the stylesheet | **Done.** `lock.css` from the v3 delivery, byte for byte; sign in and create account rebuilt |
| 17b | A day ends at 4am in a timezone nobody chose | **Done.** A day ends at midnight in the user's IANA timezone, from the browser at registration; a required name. ADR-015 amended |
| 17c | A person can see today and nothing else | **Done.** The Timeline, a past day's page, signing out; every entry carries its day's `date` |
| Screens Day | Building a screen and its feature together mixes frontend into every backend day | **Done.** Every prototype screen in its main state; unbuilt controls say so and are listed with their day; the Timeline's calendar from real data |
| **18** | Writing is the product and the editor is an afterthought | **Next.** Drafts saved on the server (how often, and what a failed save shows); Enter saves and Shift with Enter makes a new line; editing a saved entry through `PATCH /entries/:id`. Likely an API change and a migration |
| 19 | It works on her laptop, at her screen size | Responsive layout, keyboard access, a real accessibility pass. How a phone makes a new line. **Her decision on one test that drives the app in a real browser**: no test reaches a React component today |
| 20 | Forgetting a password locks a person out for good | Forgot password: a mail service, a reset token stored hashed, used once and expiring, the same answer whether or not the account exists, and every session ended on a change. **This was the phase's slack day**; an overrun now goes to Day 27 |

## Phase 4 — Memory (Days 21–27)

Goal: the product's real difference, discovered rather than prescribed.
**"Keep this out of memory" must be built before Day 22.**

| Day | Problem | What she should be able to explain afterwards |
|---|---|---|
| 21 | `LIKE '%sister%'` misses the entry about my sister | Keyword search, full-text search, indexes, and why lexical matching has a ceiling |
| 22 | "Felt overwhelmed at work" matches nothing, though three entries say exactly that | Embeddings; vector similarity; pgvector versus a dedicated vector database |
| 23 | A 2,000-word entry embedded as one vector retrieves badly | Chunking, and why chunk size is a real trade-off |
| 24 | A request takes nine seconds because it waits on an AI call | Synchronous versus asynchronous work; queues, workers, job state, retry |
| 25 | I can retrieve passages; I want an answer | Retrieval-augmented generation end to end: context, prompt, grounding, citation |
| 26 | It confidently made something up | Failure modes, evaluation, cost and latency budgets |
| 27 | **Review day and slack** | Audit, a mutation sweep, refactor, the Phase 3 handbook entry if not written. First place to absorb an overrun |

Every step exists because the previous one visibly failed. Skipping Day 21
removes the reason embeddings are interesting.

## Phase 5 — Insight, Deployment, Hardening (Days 28–39)

Goal: make it real, and make it survivable.

| Day | Problem | What she should be able to explain afterwards |
|---|---|---|
| 28 | Weekly reflections must run without anyone clicking | Scheduled versus queued work; idempotency; a job that runs twice. The same mechanism removes expired sessions |
| 29 | The Timeline loads every entry ever written | Read patterns, pagination, aggregation, N+1; measure before optimizing |
| 30 | Insights exist and Ask is drawn but unwired | Wiring Ask and reflections; streaming an answer into a screen, and its cost |
| 31 | It only runs on her laptop | Containers, environments, managed Postgres, build-time versus run-time configuration. SQLite is left here, as ADR-003 said |
| 32 | Deploying by hand is a coin flip | CI, migrations in production, secrets, rollback |
| 33 | Something broke in production and nobody knows what | Structured logs, error tracking, health checks |
| 34 | A person cannot leave, export, or see where they are signed in | Export (Markdown, JSON, audio); account deletion as a hard delete, settling the foreign keys; the device list; **changing the timezone** (her decision, Day 17c). Was slack |
| 35 | Anyone can hammer the AI endpoint and spend money | Rate limiting, abuse, a security pass |
| 36 | Nobody but her has used it | A real user test. **Every control in `lib/unbuilt.ts` must work or be gone by now** |
| 37 | What Day 36 found | Fix what a real person tripped over, triaged rather than wholesale |
| 38 | **Slack and polish** | Final buffer |
| 39 | **Final audit and retrospective** | The handbook complete; every "why" from the success criteria answered in writing |

Deployment is Day 31 and not Day 39 because first deployments fail in ways
nobody predicts, and eight days of room is the difference between a live demo
and a screenshot of localhost.

---

## Rules for the roadmap itself

1. **It will change.** A better learning opportunity is taken and the rest
   moves down. Inserted days are lettered or named.
2. **Review days are not optional.** Days 14, 27 and 39.
3. **No day begins with implementation.** Problem, research, discussion,
   decision, an ADR if significant, design, implementation, review.
4. **Every phase ends with written documentation**: a handbook entry.
5. **Every day ends with an audit that includes one mutation.** A sweep of
   many is for review days only.
6. **Learning debt is tracked and repaid** before the next day's work. The
   current list is in `master-state.md`.
7. **A day ends merged**, through a pull request.
8. **Slack left:** Days 27 and 38.
