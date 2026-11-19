# Neuron — the locked feature list

**Locked:** 2026-11-18 by Umer, with Habiba and Mubeen (the designer), in
the reconciliation with the designer's v4 delivery (`designs/AIJournal-v4/`).

**What this document is.** The complete list of what Neuron does and does not
do, as it stands now. When the designs disagree with it, this document wins.
The rulings behind it are in
[learning/reconciliation-v4/rulings.md](learning/reconciliation-v4/rulings.md);
earlier versions are in git history. What the designer is asked for is
[design-asks-v4.md](design-asks-v4.md).

**How work uses it.** Work proceeds one feature at a time, in the order in
[roadmap.md](roadmap.md). A feature may be split into blocks while it is
built, but its scope is the one written here. A new idea that arrives during
a feature is recorded and decided separately. Small details are settled while
building.

**How to read each entry.**

- **Ref** is a stable number. A dropped Ref keeps its number.
- **Status** is what exists today: *Built* (works end to end and is
  tested); *Built, to change* (works, and its entry here describes a change
  still to build); *Drawn* (the screen exists and says "This is not built
  yet."); *Nothing*.
- Every screen is drawn from the designer's v4 design, on reusable
  components (Ref 47). Today's screens are still v3's until the redraw.

---

## 1. Accounts

**Ref 1. Create an account and sign in.** *Built.*
A person signs up with a name, an email, and a password of at least 8
characters typed twice, and signs in with email and password. The email is
unique regardless of upper or lower case. The timezone comes from the
browser at sign-up. The word is "Sign in", paired with "Sign out".

**Ref 2. Show password.** *Built.*
Every password field has a control that shows or hides what was typed,
without clearing it.

**Ref 3. The menu.** *Built, to change.*
Five items: Today, Reflections, Timeline, Ask, You. An item appears only
once its feature is built. The name is not shown in the menu.

**Ref 4. Forgot and reset password.** *Built.*
A person asks for a reset link by email. The link works once and expires
after 30 minutes. The answer is the same whether or not the email has an
account. The new password is typed twice. Setting it signs out every device
and returns the person to sign in. Until a mail service is chosen (feature
8) the email is written to the API's log (ADR-022).

**Ref 6. Devices and signing out.** *Built.*
Account lists the devices where the person is signed in, each named by
Neuron's own small function ("Firefox on Linux"). They can sign out one
device, or every device at once.

**Ref 7. Change the timezone.** *Built.*
A person picks a new timezone from a list. Entries already written stay on
the day they were filed. A day ends at midnight in the person's timezone.

**Ref 8. Delete the account.** *Built.*
A hard delete of the account and all of its data, confirmed with the
password. It is the only blocking dialog in the product; its safe choice is
"Export instead". Afterwards every device is signed out. Every table that
holds the person's data is deleted with it.

## 2. Writing

**Ref 9. Write an entry.** *Built, to change.*
A plain-text entry, filed on today by the server, which decides its time
and day. Pressing Save sends it at once: the words stay in the box and Save
shows a loader until the server confirms it; then the entry joins the list.
If saving fails, an error box says so, the words stay, and Save works again.
Nothing retries on its own.

**Ref 10. Delete an entry.** *Built.*
From Today or the Timeline. Confirmed in place, removed from the screen at
once, kept hidden in the database until the account is deleted. No undo.

**Ref 11. Edit an entry.** *Built, to change.*
A typed entry is edited in its own row on Today. It keeps its original time
and gets no "edited" mark. A failed save keeps the changed words. An entry
from an earlier day cannot be edited. Voice memos cannot be edited.

**Ref 12. Drafts.** *Nothing.*
Unfinished writing in the composer is kept in this browser, so it survives a
reload. It is cleared when the person signs out, and does not follow them to
another device. Nothing on screen marks it as a draft.

**Ref 13. Enter saves.** *Built.*
Enter saves the entry; Shift with Enter starts a new line. On a touch-only
screen, Enter starts a new line and only the button saves. The same rule
holds in the editor of an entry.

**Ref 14. Today opens at the newest entry.** *Built.*
Today opens scrolled to the bottom, saving scrolls to the bottom, and
editing does not jump the reader away from where they are.

**Ref 15. The text box grows.** *Built.*
It grows to four lines, then scrolls.

## 3. Mood

**Ref 16. Today's mood.** *Built, to change.*
One of five words, Light, Good, Even, Low, Hard, each with its colour. It is
set, changed or cleared on Today, for today only. Earlier days show their
mood on the Timeline, and it cannot be changed.

**Ref 46. The mood graph.** *Nothing.*
On the Timeline, a week's mood as one smooth curve through the days
written, with the ground under it coloured by the week's average mood. Each
point jumps to its day; weeks can be stepped through, skipping weeks with
nothing written. The rules are in
`designs/AIJournal-v4/system/modules/components/moodgraph/README.md`. It is
the one mood chart in the product.

## 4. Looking back

**Ref 17. The Timeline.** *Built, to change.*
One page holding today and every earlier day, newest first, read like a week
of journal entries. Older days are fetched from the API as the person goes
back, and shown on the same page. A day has no page of its own. A day with
no entries does not appear. An entry or memo can be deleted here, never
edited. Today's new entries join today's day.

**Ref 18. The calendar.** *Built, to change.*
On the Timeline's date card, beside the list on a wide screen. Choosing a
date scrolls the list to that day, which arrives with a passing wash and a
held frame. A cited date in Ask and a reflection's "N entries" open the
Timeline the same way.

**Ref 19. Move the calendar between months.** *Nothing.*
From the first month written to this month, never a future month.

## 5. Voice

**Ref 21. Record a voice memo.** *Built.*
From the recorder, a person records a memo, which becomes an item on today.
A memo is an entry of another kind, stored in the same table.

**Ref 22. The recorder.** *Built, to change.*
Start, pause, resume, stop and keep, cancel; asking for the microphone, and
what the screen says when it is refused or missing. Keep this out of memory
sits on the recorder. The recorder shows the day, never a time. Leaving
while recording asks "Keep this memo?" with Keep and Discard. Refreshing the
page loses a recording that has not been kept. The waveform is a fixed
decorative shape, the same on every memo; it never follows the sound.

**Ref 23. Saving, playing and deleting a memo.** *Built, to change.*
After Stop and keep, the memo waits on the recorder with a loader while it
uploads, and moves to Today once saved; its time is when it was saved. If
the upload fails, the recorder shows the error box and Try again. A saved
memo can be played and deleted.

**Ref 24. Transcription.** *Nothing.*
A memo is turned into text in the background. The transcript is saved as the
entry's content and cannot be edited. A memo without a transcript yet is a
normal state. A memo kept out of memory is not transcribed; if it is later
put in memory, it is transcribed then.

## 6. Memory and AI

**Ref 25. Keep this out of memory.** *Built.*
An entry or memo can be kept out of memory, so that it is never sent to an
AI model: never used by Ask, by reflections, or by anything else that feeds
text to a model. It is set before saving, from the composer or the recorder.
It goes one way: an entry kept out can later be put in memory; an entry in
memory can never be kept out. An entry in memory shows nothing; one kept out
shows a quiet "Out of memory" menu, whose "Use in memory" asks once. Keyword
search finds it. **Open:** whether search by meaning finds it (an outside
embedding service would receive its text). Decided before feature 10.

**Ref 26. Keyword search.** *Exists in the API; no screen uses it.*
On the Timeline, as the list's sticky running head, with a switch between
keyword and by meaning. Matching days stay and the rest hide; the words are
marked. Memos without a transcript are hidden while a search runs.

**Ref 27. Search by meaning.** *Nothing.*
"Felt overwhelmed at work" finds entries that say the same thing in other
words. The other side of the Timeline's switch.

**Ref 28. Ask your journal.** *Drawn.*
A chat. A person asks a question and gets an answer, written word by word,
that cites the entries it came from; a cited date opens the Timeline at that
day. Ask reads entries and transcripts only: never reflections, never an
entry kept out of memory, never a deleted entry. It has an empty session, a
question that failed to send, an answer the journal cannot give, and
loading. Ask has no search.

**Ref 43. Ask's sessions and History.** *Nothing.*
Every visit to Ask opens a new session. A day's sessions are kept together;
earlier days are read-only. A History drawer folds days into weeks, months
and years.

**Ref 44. Bookmarks and Copy in Ask.** *Nothing.*
A message can be copied or bookmarked. A Bookmarks drawer lists the open
day's bookmarks and jumps to one. How the backend stores them is designed
when Ask is built.

**Ref 45. Thumbs up and down.** *Nothing.*
On Ask's answers and on Reflections' notes: Helpful or Not helpful, one at a
time. Not helpful asks "What was wrong?" in one line. Ratings and their
written reason are saved and never sent to a model. Nothing uses them yet.

**Ref 32. Reflections.** *Nothing.*
A weekly reflection, read as a booklet: the week, one leaf per note, a
signed last leaf, and Earlier weeks below. A week runs Monday to Sunday in
the person's timezone; its reflection is written automatically after the
week ends. An empty week gets no reflection; a thin week gets a short one.
A new account sees the week so far until its first reflection. Every number
and picture is computed by Neuron's code, never by a model; only the
sentences are written by a model. Entries kept out of memory are left out of
every number and every sentence. A note's "N entries" opens the Timeline on
those days, with a way back.

**Ref 34. What the model can see.** *Drawn.*
A page explaining in plain words what the AI may read and what it never
reads, with live counts ("144 of 148").

**Ref 35. The privacy page's words.** *Drawn, no words.*
Written after the app is built, together with the support words. Every
sentence in the designs is placeholder.

## 7. Your data and support

**Ref 36. Export.** *Built.*
One ZIP: PDF, JSON and audio files. A quiet "Ready" state offers the file
again. An empty account is told there is nothing to export. Reflections and
Ask conversations are exported too, in the JSON and the PDF, once they
exist. Ratings are not exported.

**Ref 37. Counts and "Keeping since".** *Built.*
Your data shows how many entries and recordings there are. You shows the
month the journal was started.

**Ref 38. Support resource.** *Drawn, no words.*
A page of support resources, always available from the composer's More
options and from Privacy. Never triggered by anything the person writes. Its
words are written with the privacy page.

## 8. Across every feature

**Ref 39. Loading, failure and not-found states.** *Built, to change.*
Every action has its waiting and failing (ADR-021). A page that is loading
draws a skeleton of itself. A refusal that belongs to no single field, such
as a rate limit, is shown in an error modal.

**Ref 40. Every screen size, keyboard use and accessibility.** *Built.*
Every screen works at phone, tablet and desktop widths; every task works
with the keyboard alone; a screen reader announces saving and the mood.

**Ref 41. Running it for real.** *Postgres locally only.*
Deployment, managed Postgres, continuous integration, logging and error
tracking, a real mail service, and rate limiting on the AI endpoints. On a
subdomain of a domain Umer owns, until the product has its own domain.

**Ref 47. Reusable components.** *Nothing.*
The web app is built on React components that mirror the designer's v4
modules: his layout primitives, components and sections, from the bottom
up. The stylesheet is v4's `dist/system.css`, never edited. Behaviour is
written in React; the designer's scripts are never run. A feature that is
not built is not drawn. (ADR-029.)

**Ref 48. A public page, and being found.** *Nothing.*
- A simple public page says what the product is. The designer designs and
  builds it.
- The public page, sign in and create account send their HTML from the
  server and make sense to search engines and AI models without JavaScript.
- Public and private routes are kept apart. Nothing behind sign-in is ever
  indexed.
- With the product's own domain: `robots.txt`, a sitemap, "do not index" on
  private pages and reset links, page metadata, Search Console, and which AI
  crawlers are allowed.

**Ref 49. The product's name.** *Not chosen.*
"Journal" is a placeholder. Umer chooses the name and buys its domain.

---

## Not in the product

| Ref | What | Note |
|---|---|---|
| 5 | A "too many attempts" message on sign in | A rate limit, if added, uses the error modal (Ref 39) |
| 20 | Today repeating your last entry after weeks away | |
| 29 | An AI note under every entry | May be reconsidered later, as a new decision |
| 30 | The AI asking follow-up questions inside a day | |
| 31 | A recent overview on Today | People open Reflections directly |
| 33 | Choosing when a reflection arrives; "That's not right" | Thumbs (Ref 45) are the only rating |
| | A page for a single past day; editing an earlier day's entry; changing an earlier day's mood | The Timeline holds every day (Ref 17) |
| | Drafts on the server; unsent entries in the list; automatic retry | See Refs 9 and 12 |
| | A memo draft, playback before a memo is kept | See Ref 22 |
| | Monthly reflections; Ask reading reflections | See Refs 28 and 32 |
| | Markdown export | Export is PDF, JSON and audio |

**Out of scope (Ref 42):** tiers and paywalls, guest use, offline use,
import, trackers beyond mood, notifications, Timeline totals, distress
detection and the crisis card, rich text, mood charts and analytics other
than the mood graph (Ref 46), photo and file attachments, a native mobile
app.

## Not yet decided

- Whether search by meaning finds an entry kept out of memory (Ref 25).
  Before feature 10.
- Which AI provider and which embedding model: the cheapest that gives good
  quality, researched first.
- The hosting (ADR-027 is proposed). Feature 8.
- The product's name and domain (Ref 49).
- The privacy and support words (Refs 35, 38). After the app is built.

---

## Rules every feature keeps

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
13. An entry kept out of memory never reaches an AI model (Ref 25).
14. Text an AI model wrote (a reflection, an answer) is never sent to a model
    again. When an entry it used is deleted, its words stay as written and
    its link to that entry stops working.
15. Ratings are never sent to a model (Ref 45).
16. Every table that holds a person's data is deleted with their account and
    is covered by the deletion's test (Ref 8).
17. Nothing behind sign-in is ever indexed by a search engine or an AI
    crawler (Ref 48).

## Quality every feature meets

1. Waiting and failing are designed for each action, not added afterwards.
   (ADR-021.)
2. Slow work, such as transcription and AI calls, runs in the background,
   not inside a request (feature 11).
3. Every change passes lint, typecheck, build and every test suite before it
   is merged.
4. A feature that is not built is not drawn and has no menu item.

## Technology today

Each choice has an ADR and can be revisited.

1. A pnpm workspace: `apps/api`, `apps/web`, `packages/contracts`. (ADR-001,
   ADR-019.)
2. The API is NestJS on Node.js 24 or later. (ADR-002.)
3. Postgres 17 through TypeORM, locally in Docker (ADR-010, ADR-028);
   managed Postgres comes with feature 8.
4. The web app is Next.js with React, on components mirroring the
   designer's v4 modules and v4's `dist/system.css` (ADR-029).
5. Not chosen yet: the AI provider, the embedding model, the vector store,
   the queue, object storage, the mail service, and hosting. Each is chosen
   when its feature needs it.
