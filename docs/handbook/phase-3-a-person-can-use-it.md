# Phase 3 — A Person Can Use It

**Days 15 to 17c, Screens Day, and features 1, 2, 3, 5 and 6.** The
question: *can a person actually use this?*

Written on 2026-10-21 at the first review point. The day-numbered part is
taken from the old master state (`git show 340077b:docs/master-state.md`)
and the ADRs, not from memory; the features are recent.

---

## What the phase was for

At the end of Phase 2 the API knew whose thought each entry was, and there
was no way for a person to reach it except `curl`. The phase exists to put
a person in front of the journal: a screen, a credential that lives in a
browser, a day that means their day, and then everything a person needs
before any AI is involved — editing, a forgotten password, their devices,
their timezone, voice, and the right to take their data away or delete it.

Feature 4, Drafts, is not in it. Its screens had not arrived from the
designer, and by roadmap rule 4 the work moved on. The phase ends at the
review point with Drafts, the Quality pass and Going live still to come.

---

## The arguments worth keeping

### 1. The server decides what day it is

Every date the product shows comes from the API. The browser's clock never
makes one (Day 15, her rule since Day 17c). This looked like caution until
the timezone arrived: on Day 17c her own account was stored in `UTC`, so
between midnight and 05:00 Karachi time her browser's "today" was a day the
API answered "not found" for. In feature 3 the same rule made a harder case
visible. Moving west after midnight puts a day she already wrote **in the
future**, and the API had said a future day does not exist. Her decision
was to change the rule rather than move the entry: *a day with entries
always exists* (ADR-015, amended 2026-10-15).

What generalises: **one owner for a fact means one place to change when the
fact turns out to be more complicated.** Had the browser computed dates,
the Karachi-to-New-York case would have had two answers.

### 2. Wait, or show at once, is decided by who owns the data

ADR-021 chose per action, by asking whose data the screen would have to
show. Writing waits, because the server decides an entry's time and day.
Deleting and mood show at once, because the browser already knows the
answer. Feature 1 applied it to editing (wait), and feature 5 to a memo
(the row waits with no time, because the time is the server's). The rule
held for five features without being reopened, which is what a good rule
does.

### 3. An error message is an answer, and timing is a message too

Phase 2 found that a different message for "wrong password" and "no such
account" leaks who has an account. Feature 2 found the same leak in time:
if forgot-password sends an email only for real accounts and waits for it,
an attacker can tell real accounts by how long the answer takes. So the
answer is sent before any work is done.

The review point's mutation sweep then showed this rule was **guarded by
nothing**. Adding an `await` failed no test about it. A rule that lives
only in code and a comment is a rule the next change can undo silently;
the review gave it a test.

### 4. Hash by how guessable the secret is

Passwords are hashed with argon2id, slow on purpose, because people choose
guessable ones. Refresh tokens and reset tokens are hashed with SHA-256,
fast, because 32 random bytes cannot be guessed: her run put trying them
all at a billion a second at a number of years with 61 digits, against 11
for the age of the universe. Storing a hash at all is for the leaked
database: a copy of the table must not be a set of working links.

### 5. Two places that cannot share a transaction: decide which half may be left

Voice memos put bytes on disk and a row in the database. No transaction
covers both, so the order of the two writes decides what a crash leaves
behind.

- **Writing a memo** (ADR-023): the file first, the row after. A crash
  leaves a file nobody points at, which harms nobody. Her reasoning.
- **Deleting an account** (ADR-024): the rows first, in one transaction,
  the files after. A crash leaves files of an account that is gone.

The same leftover file is acceptable in one case and not the other. Her
argument: after a failed upload the person still has their journal; after a
delete they asked for everything to be gone. **The intent of the person
decides what counts as harmless**, not the shape of the leftover. The sweep
at start that finishes the delete also clears the upload leftovers, one
mechanism for both.

### 6. Ownership in the `WHERE` clause, tested from the victim's side

Feature 3's sign-out of one device and feature 5's audio route both put the
owner in the query (ADR-013). Their mutations removed the owner and failed
tests. The lesson from feature 3 was in her own prediction: with the owner
removed, **the attacker sees success and only the victim sees anything**, a
sign-out that looks like a bug. Nobody reports a security hole from that.
So the end-to-end test checks both sides: the attacker gets a `404`, and
the victim's session still works.

### 7. Facts both apps depend on, and a type that tells the truth

`packages/contracts` (ADR-019) holds the shapes and values both apps use.
Feature 5 made `Entry.content` `string | null`, because a memo has no words
until it is transcribed, rather than `''`, which would have given one value
two meanings. TypeScript then pointed at every screen that assumed text.
On Day 17b the opposite had happened: the web app built a request as a
plain object the compiler never compared with the contract, and all nine
checks passed with registration broken. **A shared type protects only the
code that is actually typed with it.**

### 8. A browser header is a guess, and old conventions leave traps

Feature 3 names a device from its `User-Agent`. Her run of
`navigator.userAgent` in Firefox disproved her prediction: "Safari" is not
in Firefox's string, but it is in Chrome's and Edge's, because browsers
copied each other's names to be let into sites. The order of the checks is
the whole rule. The raw header is stored and the name made when listed, so
a better rule renames every old row without a migration.

### 9. A condition that cannot be true is a trap for the day it can

"An empty search matches nothing" had been written as `content IS NULL`,
true of no row while `content` was `NOT NULL`. Feature 5 made it nullable,
and the same condition would have returned every memo. The worker caught
it. It is Phase 2's lesson from the other side: there, a condition that
could only be false looked like a working check; here, a condition that
could never be true was a working "nothing" until the schema changed.

---

## What was got wrong, and what it cost

- **Facts asserted before they were checked.** On Day 17b the Master Thread
  said the web typecheck would fail on a contract change; it did not. In
  feature 1 it wrote a spec saying Show password did not exist (it did) and
  that `/reset` had two password fields (it had one). In feature 2 it told
  her the configuration would refuse the log mailer in production; the
  configuration has no idea of production. In feature 6 it said a wording
  would fit on one line before anyone had measured it. Each was corrected
  within its block, and each cost her a decision made on a false premise.
  The rule stands: read the code before describing it, prefer a run to an
  assertion.
- **Scope narrowed before it was confirmed.** On Screens Day she asked for
  "the frontend, like the prototype", and a narrower first build cost a
  second worker. On Day 17 the roadmap had no day for seeing any day but
  today; she found it by using the product for a morning.
- **A test result believed before checking that the test ran.** On Day 17b
  a mutation was "caught" by `npx jest`, which skips the migration tests.
  Only the nine named commands count.
- **A file hidden from git while every check passed.** `data/` in
  `.gitignore` matched a page called `data`. Since then every close compares
  `git status --short` with the report's file list.
- **Predictions skipped.** At this review point the mutation sweep was run
  without her predictions, at her request to go through the whole review.

---

## What the next phase inherits

- **No test reaches a React component.** Feature 1 proved what it costs:
  `event.preventDefault()` removed, all web tests passing. The Quality pass
  (feature 7) decides.
- **Production does not exist yet.** The log mailer (ADR-022), audio on the
  API's disk (ADR-023), and the sweep at start (ADR-024) each name feature
  8, Going live, as the day they change.
- **The server trusts the browser in two places it has said so:** a memo's
  claimed duration (ADR-023), and nothing limits how often a password or a
  reset can be tried. Feature 16 decides.
- **Drafts** waits for the designer's composer changes.
- **English only, for now.** The export's PDF draws Latin letters; the
  first entry in another script reopens ADR-025.
