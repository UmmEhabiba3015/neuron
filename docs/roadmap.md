# Neuron — Roadmap (v5.0)

**Status:** Rewritten 2026-11-18 after the v4 reconciliation, replacing
v4.0, and confirmed by Umer. The scope of every feature is
in [features.md](features.md); this file only says the order and what each
feature teaches. The order is the one suggested in the reconciliation and
taken by Umer (row 45), with going live placed right after the redraw
(follow-up Q6). The rulings are in
[learning/reconciliation-v4/rulings.md](learning/reconciliation-v4/rulings.md).

Earlier plans are in git: v4.0 with `git show a5312ab:docs/roadmap.md`, and
the day-numbered plans with `git show 4e49fc1:docs/roadmap.md`.

---

## How the work runs

1. **One feature at a time.** A feature is finished, audited and merged
   before the next one starts.
2. **A feature is split into blocks while it is built.** The split is made at
   the feature's opening, in its overview, and can change as decisions are
   made.
3. **The feature's scope is the one in `features.md`.** Anything new that
   comes up while building is recorded and decided on its own. It does not
   silently grow the feature.
4. **Every screen comes from the designer's v4 delivery**, built on the
   reusable components the redraw creates. A feature whose screens need a
   change from the designer waits for it; the list of what he owes is
   [design-asks-v4.md](design-asks-v4.md).
5. **A feature that is not built is not drawn** and has no menu item. Each
   feature adds its own screens and its menu item when it ships.
6. **Each feature has a branch**, `feature-<short-name>`, made from `main`,
   and closes through a pull request.
7. **No LinkedIn posts while building.** When the project is finished, it
   is presented in public feature by feature.

## Where the project stands (2026-11-18)

Built: features 1, 2, 3, 5, 6, 7 and 9, the first review point, and the
Postgres move (feature 8, block 2, ADR-028). The designer's v4 delivery
(dated 30 October) was added to the repository on 2026-11-03 and reconciled
on 2026-11-18. Feature 11, next in
v4.0, now comes after the redraw, going live, Drafts and Looking back. 613
API unit tests, 72 API end-to-end tests, 318 web tests and 6 component
tests, 10 contract checks. 28 ADRs.

## The order of the work

| Order | Feature | Refs | Depends on |
|---|---|---|---|
| 1st | **17, The redraw** | 47, 3, 39, 40, 1, 48 (routes and the public auth pages) | The design asks for the name field, the delete password and the second reset field |
| 2nd | **8, Going live**, on a subdomain of a domain Umer owns | 41, 4 (real mail) | The redraw, so what is deployed is the new app |
| 3rd | **4, Drafts and saving** | 12, 9, 22, 23 | The designer's loader, error box and "Keep this memo?" |
| 4th | **14, Looking back**, with **keyword search** (the first half of 10) | 17, 18, 19, 46, 26; 11 and 16 narrowed with the past-day page | The redraw |
| 5th | **11, Background work and transcription** | 24 | 5, 9 (built) |
| 6th | **10, Search by meaning** | 27, 25 (its open question) | 11, 14 |
| 7th | **12, Ask** | 28, 34, 43, 44, 45 | 9, 10, 11 |
| 8th | **13, Reflections** | 32, 45 | 9, 11, 14 |
| then | **Review point 2** | | |
| last | **15, The words**, then **16, Security pass, real user test, final audit** | 35, 38 | Everything |
| when it arrives | **The public page**, designed and built by the designer, joined to the app's public routes | 48 | The redraw's route split |
| when chosen | **The name and its domain**: the app moves from the subdomain to its own domain, and the rest of findability is done | 49, 48 | Umer |

## The features, by number

Numbers are names and do not change. Feature 17 is new.

| # | Feature | Refs | The problem it starts from, and what it teaches |
|---|---|---|---|
| 1 to 3, 5 to 7, 9 | *Built* | | See `master-state.md` |
| 4 | **Drafts and saving** | 12, 9, 22, 23 | Unfinished writing is lost on a reload, and a save gives no sign it is under way. Browser storage and when to clear it, a visible wait, an error box; the recorder holding a memo until it is saved, and asking before it is abandoned |
| 8 | **Going live** | 41 | It only runs on her laptop. Containers, managed Postgres, continuous integration, migrations in production, secrets, logs, health checks, a real mail service. On a subdomain first, so the move to the real domain is a configuration change |
| 10 | **Search by meaning** | 27, 25 | Keyword matching misses entries that say the same thing in other words. Embeddings, vector similarity and chunking. Opens with the postponed question: does it find entries kept out of memory? |
| 11 | **Background work and transcription** | 24 | A request should not wait on a slow model call. Queues, workers, job state, retry. Transcription is the first job; a memo kept out of memory is not transcribed. The first call to a model adds its guard test |
| 12 | **Ask** | 28, 34, 43, 44, 45 | Retrieved passages are not an answer. Retrieval-augmented answers with citations, streaming, sessions and their history, bookmarks, ratings that are stored and never sent, cost, rate limiting |
| 13 | **Reflections** | 32, 45 | Reflections must appear without anyone asking. Scheduled work in every person's timezone, a job that runs twice, numbers computed by code and words by a model. The same mechanism removes expired sessions and expired reset links |
| 14 | **Looking back, redesigned** | 17, 18, 19, 46, 26 | The Timeline becomes the one place to look back. Paging older days into one page, the jump to a day, the mood graph, the calendar across months, keyword search on Postgres with indexes; the past-day page is removed |
| 15 | **The words** | 35, 38 | The privacy page and the support resource, written once the AI features exist |
| 16 | **Security pass, real user test, final audit** | | Abuse and a security review; a person who is not her uses it; fixes from what they tripped over; the handbook completed |
| 17 | **The redraw** | 47, 3, 39, 40 | Every screen is hand-built from one global stylesheet, and almost nothing is reusable (`components/ui/` holds one file). Reusable components mirroring the designer's layers, from tokens up to screens; v4's stylesheet; skeletons; public and private routes apart. Habiba learns it on one complete example, in at most one day of work (row 39) |

**Review points** fall after feature 6 (done), after feature 13, and at
feature 16.

## The redraw, in more detail

Decided in the reconciliation (rows 34 to 40, follow-up Q4, Q5, Q7):

- **Bottom up:** tokens and the stylesheet, then layout primitives, then
  components, then sections, then each built screen. The React components
  mirror the designer's v4 modules; his contracts and generated types are the
  reference for their props.
- **Only what is built is redrawn:** sign in, create account, forgot and
  reset password, Today with the composer and mood, the recorder, the
  Timeline, You, Account and its timezone page, Your data, Privacy, and
  the support resource. Ask, Reflections and What it sees are not drawn
  until their features; the menu shows only the built items.
- **Logic does not change.** `lib/` and the API stay as they are, so their
  tests guard behaviour through the redraw. Component tests are rewritten
  with the components.
- **The stylesheet** is v4's `dist/system.css`, copied in and never edited;
  the app's own additions go in `live.css`; anything missing is reported to
  the designer.
- **Public and private routes** each get a Next.js route group; sign in and
  create account send real HTML from the server.
- **Afterwards:** `designs/AIJournal-v3/`, `docs/ui-handover-v4.md` and
  `apps/web/lib/unbuilt.ts` are removed.

## Why this order

- **The redraw comes first** because the v4 stylesheet no longer has 75 of
  the 121 classes the app uses, so every later feature would otherwise be
  built twice.
- **Going live comes next**, because first deployments fail in ways nobody
  predicts, and a subdomain removed the wait for a domain.
- **Drafts and Looking back need no AI**, and finish the product a person
  can use without it.
- **The AI features build on each other.** Background work comes before any
  model call; search by meaning builds the retrieval Ask uses; Reflections
  need the background jobs and the Timeline they link into.

## Rules for the roadmap itself

1. **It will change.** A better order is taken when one appears. The scope
   changes only in `features.md`, by Habiba or Umer.
2. **No feature begins with implementation.** Problem, research,
   discussion, decision, an ADR if significant, design, implementation,
   review.
3. **Every feature ends with an audit that includes one mutation**, and is
   merged through a pull request.
4. **Learning debt is repaid before the next feature starts.**
5. **Finishing soon is the aim**, and there is no fixed end date.
