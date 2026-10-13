# Neuron — Roadmap (v4.0)

**Status:** Rewritten 2026-10-10, replacing v3.0. **Work is planned by
feature, not by day** (her husband, 2026-10-10). The scope of every feature
is locked in [features.md](features.md); this file only says the order and
what each feature teaches. The order was confirmed by her husband on
2026-10-13, with Drafts placed fourth.

The day-numbered plans (v2.0 and v3.0, Days 0 to 39) are in git:

```bash
git show 4e49fc1:docs/roadmap.md
```

---

## How the work runs now

1. **One feature at a time.** A feature is finished, audited and merged
   before the next one starts.
2. **A feature is split into blocks while it is built.** The split is made at
   the feature's opening, in its overview, and can change as decisions are
   made. Blocks are not days; a block takes as long as it takes.
3. **The feature's scope is the one in `features.md`.** Anything new that
   comes up while building, whether a screen change or a new rule, is
   recorded and decided on its own. It does not silently grow the feature.
4. **Features that wait for the designer.** Search, Ask, Reflections and
   Looking back are a large overhaul of their screens and flow, so they wait
   for the designer's new UI, and Drafts waits for small changes to the
   composer (her husband, 2026-10-13). If one reaches its
   turn before its UI has arrived, work moves to the next feature that is
   ready, and returns when the UI arrives. The privacy wording is written
   last, whatever happens.
5. **Each feature has a branch**, `feature-<short-name>`, made from `main`,
   and closes through a pull request.
6. **No LinkedIn posts while building** (her husband, 2026-10-13). When the
   project is finished, it is presented in public feature by feature.

## Where the project stands (2026-10-10)

Built: accounts (sign up, sign in, staying signed in, sign out), writing and
deleting entries, mood, the Timeline as a list and a month calendar, and a
past day's page. Every screen of the designer's v3 prototype is drawn, and
every control whose feature is not built says "This is not built yet."
246 API unit tests, 365 API end-to-end tests, 171 web tests, 7 contract
checks. 21 ADRs.

## The features, in order

"Refs" are the row numbers in `features.md`. "Screens" says whether the
feature can be built on today's screens, or waits for the designer.

| # | Feature | Refs | The problem it starts from, and what it teaches | Screens |
|---|---|---|---|---|
| 1 | **Finish writing** | 11, 13, 14, 2 | Writing is the product and a saved entry cannot be changed. `PATCH /entries/:id` exists and nothing calls it. Editing end to end, keyboard handling, scroll position | Ready |
| 2 | **Forgot password** | 4 | A forgotten password locks a person out for good. A mail service; a reset token stored hashed, single-use and expiring; the same answer whether or not the account exists; every session ended. Also makes `password_hash` required | Ready |
| 3 | **Account and devices** | 6, 7 | A person cannot see where they are signed in, or move timezone. Listing and ending sessions; changing a setting that dates depend on | Ready |
| 4 | **Drafts** | 12 | Unfinished writing is lost on a failed save, a reload or a sign-out. A `drafts` table, saving while the person types, and what a failed save shows. The composer needs some changes from the designer first | Waits for small UI changes |
| 5 | **Voice memos** | 21, 22, 23 | Recording is easier than typing, and audio does not belong in a database. Object storage, uploads, a second kind of entry, retry after a failed upload | Ready, with the static waveform from the v4 handover |
| 6 | **Your data** | 36, 8, 37 | A person cannot take their journal away or leave. Export as PDF, JSON and audio; a hard delete that settles every foreign key; counts | Ready, with PDF in place of Markdown |
| 7 | **Quality pass** | 40 | It works at one screen size and nothing tests a React component. Responsive layout, keyboard access, accessibility, a decision on a real-browser test, a lint rule so the browser's clock never makes a date | Ready |
| 8 | **Going live** | 41 | It only runs on her laptop. Containers, managed Postgres, continuous integration, migrations in production, secrets, logs, health checks. Before the AI work, so a first deployment has room to fail | None needed |
| 9 | **Keep out of memory** | 25 | Some entries must never reach an AI model. One column, honoured by every later AI feature from its first line | Ready |
| 10 | **Search** | 26, 27 | Keyword matching misses entries that say the same thing in other words. Full-text search and indexes, then embeddings, vector similarity and chunking. The embedding-model question in Ref 25 is decided here | **Waits for the designer** |
| 11 | **Background work and transcription** | 24 | A request should not wait on a slow model call. Queues, workers, job state, retry. Transcription is the first job | Ready |
| 12 | **Ask** | 28, 34 | Retrieved passages are not an answer. Retrieval-augmented answers with citations, failure modes, streaming, cost, and rate limiting on AI endpoints | **Waits for the designer** |
| 13 | **Reflections and the recent overview** | 32, 31 | Reflections must appear without anyone asking. Scheduled versus queued work, idempotency, a job that runs twice. The same mechanism removes expired sessions | **Waits for the designer** |
| 14 | **Looking back, redesigned** | 17, 18, 19 | The Timeline, a past day and the calendar in the designer's new flow, including moving between months | **Waits for the designer** |
| 15 | **The words** | 35, 38 | The privacy page and the support resource, written once the AI features exist | Last |
| 16 | **Security pass, real user test, final audit** | | Abuse and a security review; a person who is not her uses it; fixes from what they tripped over; the handbook completed and every "why" answered in writing | None needed |

**Review points** fall after feature 6 and after feature 13: an audit, a
sweep of several mutations, refactoring where justified, and a handbook
entry. Feature 16 is the third.

## Why this order

- **Features 1 to 7 finish the product a person can use without AI.** All
  but Drafts run on today's screens and can start now. Drafts is fourth
  because the composer needs some changes from the designer first, and three
  features give him time to deliver them.
- **Going live comes before the AI work**, because first deployments fail in
  ways nobody predicts, and moving to Postgres there settles the database
  before vectors are stored in it.
- **The AI features build on each other.** Keep out of memory must exist
  before any text reaches a model. Search creates the retrieval that Ask
  uses. Background work is needed by transcription, Ask and reflections.
- **The four features that wait for the designer come late**, which gives
  him time to deliver their new UI.

## Rules for the roadmap itself

1. **It will change.** A better order is taken when one appears. The scope
   does not change here; it changes only in `features.md`, by her or her
   husband.
2. **No feature begins with implementation.** Problem, research, discussion,
   decision, an ADR if significant, design, implementation, review.
3. **Every feature ends with an audit that includes one mutation**, and is
   merged through a pull request.
4. **Learning debt is repaid before the next feature starts.** The current
   list is in `master-state.md`.
5. **Finishing soon is the aim**, and there is no fixed end date.
