# Neuron — the locked feature list

**Locked:** 2026-10-10, by her husband, in the final reconciliation between
the roadmap and the designer's v3 delivery (`designs/AIJournal-v3/`).

**What this document is.** The complete list of what Neuron does and does not
do. Every row of the reconciliation table was ruled on, and the rulings are
final. It replaces `requirements.md`, `feature-reconciliation.md` and
`ui-handover.md`, which were retired the same day and are in git history.
When the designs disagree with it, this document wins. What the designer is
asked to change is [ui-handover-v4.md](ui-handover-v4.md).

**How work uses it.** Work proceeds one feature at a time, in the order in
[roadmap.md](roadmap.md). A feature may be split into blocks while it is being built, but its
scope is the one written here. A new idea that arrives during a feature is
recorded and decided separately; it does not grow the feature.

**How to read each entry.**

- **Ref** is the row number in the reconciliation table, so every ruling can
  be traced.
- **Status** is what exists today:
  - *Built*: works end to end and is tested.
  - *Drawn*: the screen exists in the web app, and its control says "This is
    not built yet."
  - *Not drawn*: only the designs have it.
  - *Nothing*: no screen and no code.
- **UX open** marks a feature whose behaviour is decided but whose screens
  and flow are not final. Its final flow is settled when the designer
  delivers the updated screens. Search, Ask, Reflections and Looking back are
  a large overhaul and wait for those screens (2026-10-13).

---

## 1. Accounts

**Ref 1. Create an account and sign in.** Keep. *Built.*
A person signs up with an email, a password of at least 8 characters typed
twice, and a name, and signs in with email and password. The email is unique
regardless of upper or lower case. The timezone comes from the browser at
sign-up.

**Ref 2. Show password.** Keep. *Built* (feature 1).
Every password field has a control that shows or hides what was typed,
without clearing it.

**Ref 3. The menu says "You".** Keep as it is. *Built.*
The name is collected at sign-up but is not shown in the menu, and there is
no way to change it for now. This may be revisited later.

**Ref 4. Forgot and reset password.** Keep. *Built* (feature 2). Until
feature 8 the email is written to the API's log, not sent (ADR-022).
A person asks for a reset link by email. The link works once and expires
after 30 minutes. The answer is the same whether or not the email has an
account, so nobody can use it to discover who has one. Setting a new password
signs out every device and returns the person to sign in.

**Ref 6. Devices and signing out.** Keep. *Built* (feature 3).
Account lists the devices where the person is signed in. They can sign out
one device, or every device at once. A device is named from its browser's
`User-Agent` header by Neuron's own small function, such as "Firefox on
Linux" (her decision, 2026-10-15).

**Ref 7. Change the timezone.** Keep. *Built* (feature 3).
A person picks a new timezone from a list. Entries already written stay on
the day they were filed. A day with entries always exists, even when a move
west puts it in the future (her decision; ADR-015, amendment of
2026-10-15).
**Final rule: a day ends at midnight in the person's timezone.** The designs
say 4am; the designs are wrong on this point, whether or not they are
updated.

**Ref 8. Delete the account.** Keep. *Drawn.*
A hard delete of the account and all of its data, and nothing else. It is
the only blocking dialog in the product. Its safe choice is "Export
instead". Afterwards every device is signed out.

## 2. Writing

**Ref 9. Write an entry.** Keep. *Built.*
A plain-text entry, filed on today by the server.

**Ref 10. Delete an entry.** Keep. *Built.*
Confirmed in place, removed from the screen at once, kept hidden in the
database until the account is deleted. No undo.

**Ref 11. Edit an entry.** Keep. *Built* (feature 1).
A typed entry is edited in its own row. It keeps its original time and gets
no "edited" mark. A failed save keeps the changed words. Voice memos cannot
be edited.

**Ref 12. Drafts.** Keep. *Nothing.*
Unfinished writing is saved on the server, so it survives a failed save, a
reload and being signed out. **UX open:** the flow stays on the composer,
and the composer needs some changes from the designer first (2026-10-13).

**Ref 13. Enter saves.** Keep. *Built* (feature 1).
Enter saves the entry; Shift with Enter starts a new line. On a phone (a
touch-only screen), Enter starts a new line and only the button saves (her
decision, 2026-10-15). The same rule holds in the editor of an entry.

**Ref 14. Today opens at the newest entry.** Keep. *Built* (feature 1).
Like a chat: Today opens scrolled to the bottom, saving scrolls to the
bottom, and editing does not jump the reader away from where they are.

**Ref 15. The text box grows.** Keep as built. *Built.*
It grows to four lines, then scrolls.

## 3. Mood

**Ref 16. A mood for each day.** Keep. *Built.*
One of five words, Light, Good, Even, Low, Hard, each with its colour. It can
be set, changed or cleared for today or any past day.

## 4. Looking back — UX open for the whole section

The designer will redesign this whole flow. The functions below are decided.
Their position and look will change.

**Ref 17. Timeline and a past day's page.** Keep. *Built.* **UX open.**
A list of past days, newest first, and a page for each day with its entries
and mood. A day with no entries has no page.

**Ref 18. Calendar.** Keep. *Built for the current month.* **UX open.**
A month view of the same days.

**Ref 19. Move the calendar between months.** Keep. *Nothing.* **UX open.**

## 5. Voice

**Ref 21. Record a voice memo.** Keep. *Drawn.*
From the record screen, a person records a memo, which becomes an item on
today. A memo is an entry of another kind, stored in the same table.

**Ref 22. The recorder.** Keep, with a limit. *Ready state drawn.*
- Kept: start, pause, resume, stop and keep, cancel; asking for the
  microphone, and what the screen says when it is refused or missing.
- **The waveform is a static picture.** It does not show the actual sound of
  the recording, live or after saving.

**Ref 23. Play back, delete, retry an upload.** Keep. *Nothing.*
A saved memo can be played and deleted. If the upload fails, the memo stays
on the page with a retry, and the screen says plainly that it is lost if the
page is closed.

**Ref 24. Transcription.** Keep. *Nothing.*
A memo is turned into text in the background. The transcript is saved as the
entry's content and cannot be edited. A memo without a transcript yet is a
normal state.

## 6. Memory and AI

**Ref 25. Keep this out of memory.** Keep. *Drawn.*
Any entry or memo can be marked so that it is never sent to an AI model:
it is never used for Ask, reflections, the recent overview, or anything
else that feeds text to a model. **It is still found by keyword search and
by search by meaning**, because those search the product's own database.
The mark stays visible. It can also be set from the composer before saving.
**It must be built before Ask.**

*Open, decided when search by meaning is built:* turning an entry into a
vector needs an embedding model. If that model is an outside AI service,
the entry's text is sent to it, which this rule forbids for a marked entry.
The choice is between an embedding model run by the product itself, or not
embedding marked entries (so meaning search would miss them).

**Ref 26. Keyword search.** Keep. *Exists in the API; no screen uses it.*
**UX open.**

**Ref 27. Search by meaning.** Keep. *Nothing.* **UX open.**
"Felt overwhelmed at work" finds entries that say the same thing in other
words.

**Ref 28. Ask your journal.** Keep. *Drawn.* **UX open.**
A person asks a question and gets an answer that cites the entries it came
from.

The designer will reimagine Refs 26 to 28 together.

**Ref 31. Recent overview.** Keep. *Not drawn in the web app.* **UX open.**
A short reflection over a recent period, shown above the composer on Today.
Probably drawn from the weekly reflection. How the backend produces it is
decided when it is built.

**Ref 32. Reflections.** Keep, deferred. *Not drawn.* **UX open.**
A reflection over a period of the journal, weekly or monthly or similar, on
a new page of its own. The period and the page are decided when the designer
delivers that page.

**Ref 34. What the model can see.** Keep. *Drawn.*
A page explaining in plain words what the AI may read and what it never
reads.

**Ref 35. Privacy page wording.** Keep. *Drawn, no words.* **UX open.**
**Done last.** The words depend on what the AI features actually do and
which provider they use.

## 7. Your data and support

**Ref 36. Export.** Keep, changed. *Drawn.*
**PDF, JSON and audio files. Markdown is removed.** A quiet "Ready" state
offers the file again if the download did not start. An empty account is
told there is nothing to export.

**Ref 37. Counts and "Keeping since".** Keep. *Drawn.*
Your data shows how many entries and recordings there are. You shows the
month the journal was started.

**Ref 38. Support resource.** Keep. *Drawn, no words.*
A page of support resources, always available from the composer's More
options and from Privacy. It is never triggered by anything the person
writes. Its words are hers to write.

## 8. Across every feature

**Ref 39. Loading, failure and not-found states.** Keep. *Built for every
built feature.* Each new feature designs its own waiting and failing.

**Ref 40. Every screen size, keyboard use and accessibility.** Keep. *Drawn
at three widths; no accessibility pass yet.*

**Ref 41. Running it for real.** Keep. *Nothing.*
Deployment, Postgres, continuous integration, logging and error tracking,
and rate limiting on the AI endpoints. No screens involved.

---

## Dropped on 2026-10-10

| Ref | Feature | Why it existed |
|---|---|---|
| 5 | A "too many attempts" message on sign in | Designs |
| 20 | Today showing your last entry word for word after weeks away | Designs |
| 29 | An AI note under every entry, with a "That's not right" button | Designs |
| 30 | The AI asking follow-up questions inside a day | Designs, left from the old Pro tier |
| 33 | Choosing when a reflection arrives, and "That's not right" on a reflection | Designs |
| 36 (part) | Markdown export | Earlier scope; replaced by PDF |

## Out of scope, unchanged (Ref 42)

Tiers and paywalls, guest use, offline, import, trackers beyond mood,
notifications, Timeline totals, distress detection and the crisis card, rich
text, mood charts and analytics, photo and file attachments, a native mobile
app.

## What changed compared with the earlier records

1. **Monthly insights were out of scope.** Reflections may now be weekly or
   monthly (Ref 32), so a monthly reflection is no longer excluded.
2. **Export** is PDF, JSON and audio, not Markdown, JSON and audio.
3. **The name in the menu** (asked of the designer on 2026-10-07) is not
   built. The menu says "You".
4. **The recorder** gains pause, resume and the microphone states, and loses
   the measured waveform.
5. **A recent overview on Today** is in. It was not in the roadmap.
6. **The day ends at midnight** is now final regardless of the designs.
7. **"Out of memory" means "never sent to an AI model".** The old
   requirements said a marked entry was hidden from every search; it is not. Both
   searches find it.
8. **Rows 12 and 37 confirmed:** drafts survive signing out because they
   live on the server; Your data shows both counts and You shows "Keeping
   since".

## Not yet decided, and decided when its feature is built

- How often a draft is saved and what a failed save shows (Ref 12).
- How the recent overview is produced (Ref 31) and the reflection period
  (Ref 32).
- What Privacy says about training (Ref 35).
- May a mood be set on a day with no entries? (Today: yes.) An entry does
  not move when the timezone changes (decided 2026-10-15, feature 3).
- Which AI provider.

---

## Rules every feature keeps

Moved here from `requirements.md` when it was retired on 2026-10-10.

1. Every route is closed by default. A new route requires a signed-in user
   unless it is explicitly marked public. (ADR-013.)
2. Every read and write is limited to the owner in the database query
   itself. Asking for something that belongs to another person gives "not
   found", never "forbidden". (ADR-013.)
3. Passwords are stored as argon2id hashes. (ADR-011.)
4. Access tokens last 15 minutes and live only in the browser's memory.
   Refresh tokens last 30 days, rotate on every use, and live in an
   `HttpOnly`, `SameSite=Strict` cookie. Reusing an old refresh token ends
   every session. Signing out takes effect on the next request. (ADR-014,
   ADR-018.)
5. The API accepts requests from exactly one configured web origin. (ADR-018.)
6. Input is validated when it arrives; an unknown field is a 400. (ADR-005,
   ADR-006, ADR-008.)
7. Configuration is checked once at start; a bad value stops the start.
   (ADR-007.)
8. The schema changes only through migrations. (ADR-010.)
9. Facts both apps depend on live once in `packages/contracts`. (ADR-019.)
10. Lists are paginated, and a count accepts the same filters as its list.
    (ADR-017.)
11. A day ends at midnight in the person's timezone. The server files an
    entry on its day when it is written, and the browser's clock never makes
    a date. (ADR-015.)
12. Deleted entries are kept out of every reader: search, embeddings, Ask,
    reflections and export. (ADR-020.)
13. An entry marked out of memory never reaches an AI model (Ref 25).

## Quality every feature meets

1. Waiting and failing are designed for each action, not added afterwards.
   (ADR-021.)
2. Slow work, such as transcription and AI calls, runs in the background,
   not inside a request (feature 11 of the roadmap).
3. Every change passes lint, typecheck, build and every test suite before it
   is merged.
4. A control whose feature is not built says "This is not built yet." and
   sends nothing. Each is listed in `apps/web/lib/unbuilt.ts`, and every one
   must work or be gone before the real user test.

## Technology today

Each choice has an ADR and can be revisited.

1. A pnpm workspace: `apps/api`, `apps/web`, `packages/contracts`. (ADR-001,
   ADR-019.)
2. The API is NestJS on Node.js 24 or later. (ADR-002.)
3. SQLite through TypeORM, until managed Postgres in the *Going live*
   feature. (ADR-003, ADR-010.)
4. The web app is Next.js with React.
5. Not chosen yet: the AI provider, the embedding model, the vector store,
   the queue, object storage, the mail service, and hosting. Each is chosen
   when its feature needs it.
