# Neuron — Requirements

Status: written on 2026-10-08. Brought up to date on 2026-10-10, at the
close of Screens Day.

This document says what Neuron must do, what it must not do, and what is
still undecided. It collects decisions that are spread across the roadmap,
the feature reconciliation and the ADRs, and it points back to them. When
this document and one of those sources disagree, the source is right and
this document is out of date.

The sources are:

- [roadmap.md](roadmap.md) for the plan, day by day.
- [feature-reconciliation.md](feature-reconciliation.md) for every scope
  ruling made against the designs.
- [decisions/](decisions/) for the architecture decision records (ADRs). An
  ADR is a short document that records one technical decision, the options
  that were compared, and the reason for the choice.
- [ui-handover.md](ui-handover.md) for what the designer has been asked to
  draw.

Wording in the designer's screens (`designs/AIJournal-v3/`) is placeholder
text. It shows where words go. It is not a requirement, and nothing in this
document is taken from it.

---

## 1. What Neuron is

Neuron is a private journal on the web. A person writes short entries
through the day, says how the day felt, and later looks back over past days.
Later phases add search, and a way to ask questions of your own journal and
get answers that cite the entries they came from.

Neuron is also a learning project. It is a public 40-day build (Day 0 to
Day 39) whose main purpose is understanding backend architecture. This shapes
the requirements in two ways:

1. A feature is in scope when it teaches something new, or when the product
   is not honest without it. A feature that only repeats a lesson already
   learned is deferred, even if it is useful.
2. The simplest correct solution is required. A new technology is adopted
   only when a real problem shows that the current one is not enough. The
   rules for this are in [constitution.md](constitution.md).

The project is finished when it is deployed, reachable on the public
internet, and good enough to demonstrate (Day 39).

---

## 2. Who uses it

There is one kind of user: a person keeping their own journal. There are no
administrators, no shared journals and no teams.

There are no tiers. There is no Free plan and no Pro plan, and every user
gets every feature, including the AI features when they are built. A free
trial followed by a subscription is a possible later model and is not
decided. (Decision of 2026-10-04, ADR-016.)

---

## 3. Functional requirements

Each requirement below is marked with its state:

- **Built** means it exists and is tested today.
- **Day N** means it is planned for that day of the roadmap.
- **In, not scheduled** means it is in scope but no day is assigned.

### 3.1 Accounts and signing in

1. A person creates an account with an email address, a password, and a
   name. **Built.**
   - The email is the identifier. Two accounts cannot share an email, and
     the comparison ignores upper and lower case.
   - The password has a minimum length, which is defined once in
     `packages/contracts`.
   - The create-account screen asks for the password twice. The two are
     compared in the browser only, because this guards against a typing
     mistake and nothing about it needs to reach the API.
   - The name is required, is trimmed of surrounding spaces, and is at most
     60 characters.
2. The account's timezone is taken from the browser when the account is
   created. The person never types it. If the browser sends no timezone, or
   an invalid one, registration is refused. There is no default timezone,
   because a default would silently put a person's entries on the wrong
   days. **Built.**
3. A person signs in with email and password. **Built.**
4. A person stays signed in when they reload the page. **Built.**
5. A person can sign out of the device they are using. If the API cannot be
   reached, signing out changes nothing rather than pretending to succeed.
   **Built.**
6. A person can sign out of every device at once. **Built in the API**; the
   control is drawn on Account and is wired on **Day 34**.
7. A person who forgets their password can reset it through a link sent by
   email. The reset token is stored hashed, works once, and expires. The
   answer is the same whether or not the email has an account, so the
   feature cannot be used to discover who has an account. Changing the
   password ends every session. **Day 20.**
8. A person can see the devices where they are signed in, and end any one
   of those sessions. **Day 34.**
9. A person can change their timezone. **Day 34.** Until then, an account's
   timezone is fixed at the value it was created with.
10. A person can delete their account. This is a hard delete: the account
    and all of its data are removed, and nothing else is. **Day 34.**

Not in scope: signing in with an emailed code or a passkey, signing in with
another service (such as Google), and using the product without an account.
An account is required before anything can be written.

### 3.2 Days

A day is the main thing in Neuron. Entries and mood belong to a day.
(ADR-015.)

1. A day ends at midnight in the person's own timezone. An entry written at
   23:59 and one written at 00:01 are on different days, even if they were
   written in one sitting. **Built.** (This replaced an earlier 4am rule on
   Day 17b.)
2. The API decides which day an entry belongs to, at the moment it is
   written. The browser's clock never decides a date. **Built.**
3. Once an entry is filed on a day, it stays on that day. It does not move
   if the person later changes timezone. **Built.**
4. A day that has not happened yet, judged in the person's timezone, does
   not exist. Asking for it gives "not found". **Built.**
5. When the last entry of a day is deleted, the day's record stays (so its
   mood is kept), but the day is no longer listed. **Built.**

### 3.3 Entries

1. A person writes a plain-text entry and it appears on today. Writing
   waits for the API to answer, because the API sets the entry's time and
   day. **Built.**
2. Entries are plain text. There is no rich text and no markdown.
3. A person can delete an entry. **Built.**
   - The screen asks for confirmation in place before deleting.
   - The entry disappears from the screen immediately, without waiting for
     the API.
   - Deleting is a soft delete: the row is marked as deleted and kept until
     the account is deleted. A deleted entry is "not found" everywhere.
   - There is no undo.
4. Enter saves an entry, and Shift with Enter starts a new line. **Day 18.**
   How a person on a phone makes a new line is decided on **Day 19**,
   because a phone keyboard has no Shift with Enter.
5. A draft is saved on the server, so that unfinished writing is not lost.
   **Day 18.** How often a draft is saved, and what the person sees when a
   save fails, are decided on Day 18.
6. A person can edit an entry they have already saved. **Day 18.** The API
   has supported this since Day 5 (`PATCH /entries/:id`); nothing in the
   web app uses it yet.
7. A person can mark an entry "keep this out of memory". A marked entry is
   visibly marked and is never used by the AI features. **In, not
   scheduled**; it must exist before the Phase 4 retrieval work is written.

### 3.4 Mood

1. A day has at most one mood, chosen from five words: Light, Good, Even,
   Low, Hard. The list is defined once in `packages/contracts`. **Built.**
2. A person can set, change, or clear the mood of today or of any past day.
   The change shows on screen immediately. **Built.**

Not in scope: tracking anything other than mood (habits, sleep, and so on),
and charts of mood over time.

### 3.5 Looking back

1. The Timeline lists past days, newest first. **Built.**
2. A past day has its own page showing its entries and mood. On it a person
   can change the mood and delete entries, but cannot write a new entry.
   **Built.**
3. A day with no entries has no page. **Built.**
4. A calendar view, as another way of looking at the same timeline.
   **Built** for the current month (Screens Day): beside the list on a wide
   screen, behind a List / Calendar switch on a narrow one. Moving to another
   month is **in, not scheduled**.

### 3.6 Voice memos

1. A person can record a voice memo, which is stored and can be played
   back. **In, not scheduled.** The Talk screen is drawn; its record control
   is not built. The audio is kept in object storage (a
   service for storing files, separate from the database).
2. A recording is an entry with a different kind. There is one entries
   table for both.
3. A recording is transcribed to text, and the transcript is saved as the
   entry's content. The transcript cannot be edited. Transcription runs in
   the background (Day 24 introduces background work).

### 3.7 Search and memory (Phase 4, Days 21 to 27)

1. A person can search their entries by keyword. **Built** in a simple
   form (`LIKE` matching, with `%` and `_` treated as ordinary characters).
   Replaced by full-text search on **Day 21**.
2. A person can search by meaning, so that "felt overwhelmed at work" finds
   entries that describe that feeling in other words. **Days 22 and 23.**
3. A person can ask a question of their own journal and get an answer that
   cites the entries it came from. **Days 25 and 26.**
4. Every search and every AI feature only ever sees the asking person's own
   entries, and never sees entries marked "keep this out of memory".

### 3.8 Insights (Phase 5)

1. A weekly reflection is generated on a schedule, without the person
   asking for it. **Day 28.**
2. Reflections and the ask-a-question feature have screens, and answers
   appear as they are generated. **Day 30.**

### 3.9 Your data

1. A person can export their journal as Markdown, as JSON, and as audio
   files. **Day 34.**
2. A static, human-written page of support resources is always available
   in the product. **In, not scheduled.**

---

## 4. Rules the system must keep

These apply to every feature, present and future.

1. Every route is closed by default. A new route requires a signed-in user
   unless it is explicitly marked public. (ADR-013.)
2. Every read and write is limited to the owner in the database query
   itself, not checked afterwards. Asking for something that belongs to
   another person gives "not found", never "forbidden", so a person cannot
   tell whether it exists. (ADR-013.)
3. Passwords are stored as argon2id hashes, never in a form that can be
   reversed. (ADR-011.)
4. Access tokens last 15 minutes and are kept only in the browser's memory.
   Refresh tokens last 30 days, rotate on every use, and live in an
   `HttpOnly`, `SameSite=Strict` cookie that page scripts cannot read. If an
   old refresh token is used again, every session for that user is ended.
   Signing out takes effect on the very next request. (ADR-014, ADR-018.)
5. The API accepts requests from exactly one web origin, which must be
   configured; there is no default. (ADR-018.)
6. Input is validated when it arrives. A request with an unknown field is
   refused with a 400. (ADR-005, ADR-006, ADR-008.)
7. Configuration is checked once when the API starts, and the API refuses
   to start if any value is unusable. (ADR-007.)
8. The database schema changes only through migrations, never
   automatically at startup. (ADR-010.)
9. Facts that both apps depend on, such as wire shapes, the mood words, page
   sizes and the password minimum, are defined once in
   `packages/contracts`. Behaviour belonging to one app stays in that app.
   (ADR-019.)
10. Lists are paginated, and a count accepts the same filters as the list
    it counts. (ADR-017.)

---

## 5. Non-functional requirements

1. The interface works on phone, tablet and laptop widths, can be used with
   a keyboard alone, and gets a real accessibility pass. **Day 19.**
2. The screen shows something sensible while waiting and when a request
   fails. Waiting and failing are designed for each action, not added
   afterwards. (ADR-021.)
3. Requests to the AI endpoints are rate-limited, and the project gets a
   security review. **Day 35.**
4. Slow work, such as transcription and AI calls, runs in the background
   rather than inside a request. **Day 24.**
5. The system is observable in production: structured logs, error
   tracking, and health checks. **Day 33.**
6. Every change is checked by lint, typecheck, build and the test suites
   before it is merged.
7. Every screen of the design is drawn before its feature is built (Screens
   Day). A control whose feature is not built says "This is not built yet."
   and sends nothing; where data does not exist yet, the same sentence
   stands in its place, and no sample content is shown. Every such control
   is listed in `apps/web/lib/unbuilt.ts` with its day, and each must work or
   be gone before the first real user test (**Day 36**).

---

## 6. Technology

These are the current choices. Each is recorded in an ADR with the reason,
and each can be revisited.

1. A pnpm workspace (monorepo) holding `apps/api`, `apps/web` and
   `packages/contracts`. (ADR-001, ADR-019.)
2. The API is NestJS on Node.js 24 or later. (ADR-002.)
3. The database is SQLite through TypeORM until Day 31, when it moves to
   managed PostgreSQL. (ADR-003, ADR-010.)
4. The web app is Next.js with React.
5. Deployment uses containers, continuous integration, and migrations run
   as part of release. **Days 31 and 32.**
6. The AI provider is not chosen yet. It is decided in Phase 4.

---

## 7. Out of scope

These were considered and ruled out. Each can be raised again, but none is
being built.

- Tiers, plans, and a paywall.
- Using the product without an account (guest sessions).
- Working offline.
- A native mobile app. This is a separate, later project.
- Importing from other journal apps.
- A running total of entries, recordings and minutes on the Timeline.
- Trackers other than mood, and habit tracking.
- Notifications.
- Automatic detection of distress in entries. The static resource page in
  3.9 stays; only the detection is ruled out, because a keyword list either
  misses the dangerous cases or fires on ordinary grief and venting.
- Rich text and markdown.
- Mood charts and analytics dashboards.
- Monthly insights.
- Photo and file attachments.

---

## 8. Open questions

These have no decision yet. They are listed so that they are decided rather
than discovered.

1. On which day are voice memos built? They are in scope, and the roadmap
   has no day for capture and playback.
2. On which day is "keep this out of memory" built? It must come before
   the Day 22 retrieval work.
3. How often does a draft save, and what does a failed save look like?
   Day 18.
4. How does a person on a phone make a new line in an entry? Day 19.
5. Which AI provider, and does that choice need to be easy to reverse?
   Phase 4.
6. Is a free trial followed by a subscription ever introduced? Not decided,
   and not part of this project's 40 days.
7. What does the support page say? Its screen is drawn; the words are the
   owner's to write.
8. What does the privacy page say about training on a person's writing?
   Nothing in these requirements decides it yet.
9. On which day can the calendar move to another month?
