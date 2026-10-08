# Day 17c — Worker report, web: the Timeline, a past day's page, and signing out

**Date:** 2026-10-08. Prompt: `docs/workers/day-17c-web-timeline-day-and-sign-out.md`.
Binding decisions: ADR-021, ADR-019, ADR-018.

---

## Read this first: the tests were written and were not run

The owner's instruction for this run was "run but do not run tests". So:

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| `pnpm typecheck` | clean |
| `pnpm build` | clean |
| `pnpm test` | **not run** |
| `pnpm test:e2e` | **not run** |
| `pnpm lint:web` | clean |
| `pnpm typecheck:web` | clean |
| `pnpm build:web` | clean, and it lists the four new routes |
| `pnpm test:web` | **not run** |

Three things follow, and none of them should be read as done.

1. **I do not know that the new tests pass.** I wrote them and read each one
   against the code by hand. That is not the same as running them.
2. **The mutation table is a list of predictions.** Acceptance asks for each
   change to be made and everything run. Nothing was run, so every row says
   what I expect to fail and is marked as not checked.
3. **"All nine checks pass when you start" was not measured**, for the same
   reason.

What was run in place of the tests: the six checks above, the two
compile-time proofs of Part 1, and the whole browser walk-through against the
real API on a throwaway database. The walk-through is real evidence for the
screens. It is not evidence for the edge cases the tests are about (a refresh
in flight during a sign-out, the page cap, a failed delete on a past day).

**Ports 3000 and 3001: nothing was listening on either** when I started. I
still ran my own API on 3100 and web app on 3101, with `DATABASE_PATH`
pointing at a file in my scratch folder. All three processes (API, web app,
browser) are stopped. The owner's database was not used: its SHA-256 began
`43176bfb` before the walk-through and after it.

`apps/api` was not touched. `packages/contracts` was changed for one
type-check and restored (its checksum is the same). Git was not touched. No
dependency was added. `app/styles/lock.css` is the designer's file, byte for
byte (`cmp` exits 0). None of the designer's scripts was run.

One thing to know about `pnpm lint`: the API's lint script runs with `--fix`,
which means it may rewrite files. It reported nothing, and the API worker
left the code lint-clean, so I believe it changed nothing. I cannot prove it,
because those files were already modified and uncommitted.

---

## What needs the Master Thread or the owner

1. **Run the tests and the seven mutations.** See *Mutation table*.
2. **A day's page asks the API which day is today before it asks for the
   day.** That is one extra request for each past day opened. It is the only
   way to learn that the date in the address is today's without using the
   browser's clock. See *Part 2*.
3. **Signing out with a 401 is not always "the session was already over".**
   The access token may only be old. I refresh once and send the sign-out
   again. See *Part 4* and answer 5b.
4. **Three choices about what a person sees are the owner's, and I made a
   first choice for each** so the screens could be built. See *Choices that
   are the owner's*.
5. **Create account does not measure identical to its comp, and has not
   since Day 17b.** Sign in does. See answer 5a.
6. **The designer has drawn no way from the Timeline list to a day.** I made
   the date the link. It goes to him. See *Part 3*.

---

## Files

**New**

| File | What it is |
|---|---|
| `lib/timeline.ts` | The Timeline's logic: loading, grouping by day, the cap, the states. |
| `lib/timeline.test.ts` | Its tests. |
| `app/components/Gate.tsx` | Stands in front of every new screen. Draws it only for a signed-in person. |
| `app/screens/DaySheet.tsx` | The entries of one day and the mood row, shared by Today and a past day. |
| `app/screens/LiveDay.tsx` | A past day's page. |
| `app/screens/Missing.tsx` | "Page not found" and "Nothing on this day". |
| `app/screens/LiveTimeline.tsx` | The Timeline. |
| `app/screens/You.tsx` | You, and Account. |
| `app/screens/AddressNotFound.tsx`, `app/not-found.tsx` | The same not-found screen for an address no page answers to. |
| `app/d/[date]/page.tsx`, `app/timeline/page.tsx`, `app/you/page.tsx`, `app/you/account/page.tsx` | The four new addresses. |

**Changed**

| File | Change |
|---|---|
| `lib/today.ts` | One store now serves Today and any other date. The mood body is the contract's `WireMood`. |
| `lib/session.ts` | `signOut`, and two guards that stop a late request signing a person back in. |
| `lib/format.ts` | `isCalendarDate`, and the month and day labels. |
| `app/components/Chrome.tsx` | Three destinations. They are `Link`s. A date box that can be a heading. The Back control. |
| `app/components/LiveScreen.tsx` | A wordmark that can be the destination's name. `PushedScreen`, for a page with a way back. |
| `app/components/Journal.tsx` | `MoodRow` takes its label: "Today felt" or "Day felt". |
| `app/screens/LiveToday.tsx` | Draws `DaySheet`. Nothing about its behaviour changed. |
| `app/styles/live.css` | Rule 5.4 deleted and replaced, two selectors added to section 2. |
| `lib/today.test.ts`, `lib/session.test.ts`, `lib/format.test.ts` | New tests. See *Existing tests that changed*. |

---

## Part 1 — what the contract gained

**The fixtures.** `entry` in `lib/today.test.ts` now says it returns a
`WireEntry`. The compiler then found one error, on that one function, which
builds every entry in the file:

```
lib/today.test.ts(21,59): error TS2741: Property 'date' is missing in type
'{ id: string; content: string; createdAt: string; }' but required in type 'WireEntry'.
```

It was repaired by giving every fixture entry a `date`.

**The mood body.** `lib/today.ts` now reads `const body: WireMood = …`. To
show the type does its job, I added a field `note` to `WireMood` in the
contract, ran `pnpm typecheck:web`, and restored the file:

```
lib/today.ts(533,13): error TS2741: Property 'note' is missing in type
'{ mood: "Light" | "Good" | "Even" | "Low" | "Hard" | null; }' but required in type 'WireMood'.
```

---

## Part 2 — a day's page

The address is `/d/2026-08-06`, which is what `00-flow.md` gives.

### One piece of code for today and for any other date

`lib/today.ts` had one function, `createToday`, that built the store for
Today. (A store here is an object that holds what the screen shows, and has a
function for each press.) It now has one private function, `createDay`, and
two ways in:

```ts
createToday(config)                 // as before, unchanged for its callers
createPastDay({ ...config, date })  // the same store, for one date
```

**Why this shape.** A past day and Today differ in exactly two places:

- **Which day is asked for.** Today asks `GET /days/today`. A past day then
  also asks `GET /days/:date`. That is one `if` inside the function that
  loads a day.
- **Whether an entry can be written.** `createPastDay` hands back the store
  without `type` and `save`. They are not hidden by a type only: the object
  does not carry them. A test checks that with `'save' in page`.

Everything else is the same lines of code for both: paging, deleting with a
confirmation, the mood sent one request at a time, the guard against an old
answer, and every failure. Nothing was written a second time.

I considered two other shapes and chose against both. A flag such as
`canWrite: false` would leave `save` on the object, where a component could
call it by mistake. A separate `lib/day.ts` would have been the second copy
the prompt forbids.

The same idea is in the components. `DaySheet` draws the entries and the mood
row for both screens, and `useFocusAfterDelete` moves the keyboard's focus
after a delete for both.

### What a past day's page can be

The store's `day.status` has three new values. They only ever happen on a
dated page.

| Status | When | What the screen shows |
|---|---|---|
| `notFound` | The address is not a calendar date. Or the API answered 404 (or 400) for the day. Or the day has no entries | "Page not found" |
| `emptied` | The day had entries when the page opened, and the last one was deleted here | "Nothing on this day", with "Back to Timeline" |
| `isToday` | The date in the address is today's | The person is sent to `/` |

- **Not found is decided by the status number and never by the message.** A
  test sends three different messages with a 404 and gets the same result.
- **An address that is not a date sends nothing at all.** `isCalendarDate`
  refuses `2026-02-31`, `2026-8-6`, `yesterday` and the empty text before any
  request. Seen in the browser: no request for either.
- **A failure to reach the server is `unreachable`, not `notFound`.** It
  shows the designer's "We could not reach the server. Try loading this day
  again." and "Try again". A press shows "Asking again." and counts, as on
  Today.
- **A failed delete puts the entry back**, as on Today. If it was the last
  entry, the day comes back from "Nothing on this day" with the entry and its
  sentence. This follows ADR-021's "show at once" for delete.
- **A session that ends** leaves for sign in. `Gate` does that for every new
  screen.

### The address of today's own date

`V3-REVISION.md` does not say what `/d/<today's date>` shows. So, as the
prompt asked, the person is sent to `/`, and this is a gap for the designer.

To know that the date is today's, the page has to ask. The browser's clock is
not allowed to answer. So **every past day's page first asks
`GET /days/today`**, and only then asks for the day. Seen in the browser for
`/d/2026-08-06`:

```
GET /days/today
GET /days/2026-08-06
GET /entries?date=2026-08-06&limit=200&offset=0
```

The cost is one small request each time a day is opened. I think it is the
right price for the rule. If the Master Thread disagrees, the alternative is
to let `/d/<today>` be a page of today with no composer, which I think is
worse.

### In the browser

| Step | Result |
|---|---|
| Open `/d/2026-08-06` from the Timeline | Two entries, "Day felt", no composer, no text field anywhere. The one `h1` is the date, "Thu 6 Aug '26" |
| Press Low | Low is marked. `PUT /days/2026-08-06/mood {"mood":"Low"}` |
| Press the delete icon | Focus goes to "Keep entry" |
| Press "Delete entry" | The entry is gone. `DELETE /entries/…`. Focus is on the next entry's delete icon |
| Delete the last entry | "Nothing on this day. The last item on this day was deleted, so this day no longer appears in Timeline." Focus is on that heading. One link, "Back to Timeline", to `/timeline` |
| `/d/2027-10-08` (next year) | "Page not found". The API was asked and answered 404 |
| `/d/2026-02-31`, `/d/yesterday` | "Page not found". Nothing was asked |
| `/d/2019-01-01` (a past day with nothing on it) | "Page not found" |
| `/d/2026-08-06` after its entries were deleted | "Page not found" |
| `/d/2026-10-08` (today, for this account) | Lands on `/` |
| `/nowhere` | "Page not found" |

---

## Part 3 — the Timeline

**The data.** `lib/timeline.ts` asks `GET /days/today` once, then
`GET /entries` a page at a time at `MAX_PAGE_SIZE` (200). There is no request
per day. Seen in the browser:

```
GET /days/today
GET /entries?limit=200&offset=0
```

**Grouping.** `groupByDay` puts each entry under its `date`. It uses a `Map`
from date to entries, so entries of one date do not have to sit next to each
other in the list. The days are then sorted by their date, as text, newest
first. `createdAt` is used for one thing only: the order of the entries
inside one day.

**The month heading and the day label** are made from the date's text:
"August 2026" and "Sun 9". The comp shows no time of day beside an entry, so
none is drawn.

**The cap.** It is the same `MAX_PAGES` (20) that a day uses, so 4,000
entries at most. **When the cap is reached, the Timeline is shown and is not
a failure.** Today treats its cap as a failure, because one day with 4,000
entries means the API is misbehaving. A whole journal with 4,000 entries is a
real journal, and refusing to show it would be wrong. So:

- the state says `complete: false`;
- the foot of the list says the list stops there;
- the oldest day that arrived is left out, unless it is the only day. The
  list was cut somewhere inside that day or just after it, and the browser
  cannot know which. A day drawn with some entries missing would be a false
  statement about that day.

**What is the link.** The date of each day ("Sun 9") is a link to that day's
page. It is the only link in a day, however many entries the day has.

- **Keyboard:** Tab stops once on each day. Enter opens it.
- **Screen reader:** the link is named in full, for example "Thursday 6
  August 2026, 2 entries, link". The short text "Thu 6" is for the eye.
- **Size:** 44px tall at all three widths, which is the designer's minimum.
- **Today's row** leads to `/`, because the Timeline knows the API's date for
  today. Other rows lead to `/d/<date>`.

The designer did not draw this. In `02-timeline.html` the date is plain text
and a day is reached from the calendar, which is not built. The link is
underlined so that it is not told apart by colour alone. That is rule 5.4 in
`live.css`, and it is a question for him.

**Not drawn:** the calendar, the List/Calendar switch, the total, the "Since"
line, the source mark, and anything about recordings or memory.

**The header.** The mobile comp has the List/Calendar switch where Today has
its date box. With the switch not drawn, the header would be shorter than
Today's and the destinations would move when a person changes destination. So
the Timeline shows the Day box, with the API's date for today, at all three
widths. The desktop comp already has it there.

### In the browser

```
OCTOBER 2026      Thu 8    Written today.
SEPTEMBER 2026    Wed 30   Priya rang.
AUGUST 2026       Thu 6    Slept badly again.
                           It was cooler last night.
There is nothing earlier in this journal.
```

**How the entries got onto three dates.** I wrote four entries through the
web app, which files them all on today. Then I opened the throwaway database
with Node's built-in SQLite, added two `days` rows (6 August and 30
September), and pointed three entries' `day_id` at them. Their `created_at`
was left alone, so those entries have a `date` that their `createdAt` would
not give. The Timeline placed them by `date`.

---

## Part 4 — You, Account, and signing out

**You** (`/you`) has one heading, "Your account", and one row, Account, which
shows the email and leads to `/you/account`.

**Account** (`/you/account`) shows the name, the email, and "Sign out of this
device". The name row is built from the same markup as the email row. **The
designer has not drawn it. It goes to him.**

### Signing out

`session.signOut()` in `lib/session.ts` answers one of three words.

| Answer | When | What has changed |
|---|---|---|
| `signedOut` | The API said yes, or the session was already over | The token is dropped. The state is `signedOut` with `ended: false`, so sign in does not say "your session ended" |
| `unreachable` | No answer arrived | **Nothing.** The person is still signed in, and the next request still carries the token |
| `failed` | The API answered with an error | Nothing |

The request is `POST /auth/logout`, sent with the access token (that is how
the API knows which session to end) and with the cookie (a browser only
obeys "clear this cookie" on a request that was sent with cookies).

**A 401.** The prompt says a 401 means the session was already over. That is
one of two cases. The access token is short-lived. If it is old and the
session is still good, the API also answers 401, and the cookie is still in
the browser. Dropping the token then would look like signing out, and a
reload would sign the person back in. So a 401 gets the session's own rule 3:
refresh once, and send the sign-out again with the new token. If the refresh
is refused too, the session really was over, and the person is signed out.

**A refresh that is in flight during a sign-out.** The sign-out waits for it.
A refresh and a sign-out carry the same cookie, so they are never sent side
by side, which is rule 4's reason. The order is then always: the refresh
finishes, the token is renewed, and the sign-out is sent with the new token.
A refresh therefore cannot finish after the sign-out. The test is `a refresh
that is in flight when sign-out is pressed is waited for…`.

The other direction is covered too. A request that gets a 401 while a
sign-out is out waits for the sign-out, and does not refresh if the person is
then signed out.

**A request in flight when sign-out succeeds.** If its answer is a 401, it
does not refresh, and it does not change `ended` to true. The person signed
out on purpose and is not told that their session ended.

**Back in the browser.** After signing out, Back returns to an address of the
journal. Every such screen is drawn by `Gate` first. `Gate` sees `signedOut`,
draws a blank page, and replaces the address with `/in`. Seen in the browser:
Back three times, `/in` each time, and never an entry, a row or a composer on
screen.

**Another open tab** is not told. Its token still looks fine to it. On its
next request the API answers 401, because the API checks the session on every
request and the session is ended. That tab then tries a refresh. The cookie
is shared between tabs and has been cleared, so the refresh is refused. The
tab goes to sign in and says the session ended. That is true for that tab. I
reasoned this from the code and did not test it with two tabs.

### In the browser

| Step | Result |
|---|---|
| Account | "Name / Walk Er", "Email / walk@example.com", "Sign out of this device" |
| Sign out with the API stopped | "We could not reach the server. You are still signed in on this device. Try signing out again." It is an alert. Still on `/you/account`. You still opens and shows the email |
| Sign out with the API running | One request, `POST /auth/logout`. Lands on `/in` with "Open your journal on this device." and no line about an ended session. The browser holds no cookie for the API |
| Back, three times | `/in` each time |
| Sign in again | Today, with its entry |

---

## Part 5 — the destinations

`DESTINATIONS` is Today, Timeline, You. Rule 5.4 (one destination) is
deleted.

The destinations are now `Link`s from Next.js and not plain `<a>` tags. A
plain link loads the page again. The access token lives only in memory
(ADR-018), so every reload begins with a refresh request and a blank page.
With three destinations that would happen on every press.

**The header, measured.** Each cell is `left, top, width × height` in pixels
from the corner of the app.

| Width | Today | Timeline | You | You in the comp |
|---|---|---|---|---|
| 390 | 38, 124, 64.5 × 44 | 108.5, 124, 79.9 × 44 | 324.2, 124, 51.8 × 44 | 324.2, 124 |
| 834 | 177, 80, 76.5 × 44 | 259.5, 80, 91.9 × 44 | 617.2, 80, 63.8 × 44 | 617.2, 80 |
| 1440 | 42, 138, 308 × 44 | 42, 188, 308 × 44 | 42, 258, 308 × 44 | 42, 308 |

Today and Timeline stand exactly where the comps draw them at all three
widths, on Timeline, You, Account and not found.

**What the missing Ask does.**

- **At 390 and 834**, You stays at the far right, where the comp draws it,
  because `lock.css` pushes the last destination to the right. Ask's place is
  an empty gap between Timeline and You. Nothing is out of place.
- **At 1440**, You is 50px higher than in the comp (258, not 308). That is
  Ask's 44px bar and its 6px gap. The larger space that `lock.css` puts above
  You is kept: 26px above You, as in the comp.

**Other measurements against the comps.** The wordmark on Timeline and You,
the Back control and date box on a past day, the "Day felt" label, the
Account heading and rows, and every element of "Page not found" stand where
the comps draw them at all three widths. The sheets are shorter, because they
hold less.

**Sign in** measures identical to `13-login.html` at 390, 834 and 1440: every
element at the same position and size. **Create account does not**, and that
is not from today. See answer 5a.

---

## Choices that are the owner's

I made a first choice for each so the screens work. Each is one or two lines
to change.

| Choice | What I built | The other option |
|---|---|---|
| The order of entries inside one day on the Timeline | Oldest first, as the day's own page reads | Newest first, as the days themselves are ordered |
| The line under a past day, "Mood can be changed here, and only here." | Drawn. It is the designer's, from `06-conversation.html` | Leave it off. Read strictly it is true (this page is the only place a *past* day's mood changes), and a person may read it as "not on Today" |
| "Page not found" for an address typed while signed out | The person is sent to sign in first, like any other address of the journal | Show "Page not found" to anyone |

---

## Every sentence I wrote

**Mine. These go to the designer.**

| Sentence | Where |
|---|---|
| "Something went wrong on our side. Try loading this day again." | A past day, when the API answers with an error. Written beside his "We could not reach the server. Try loading this day again." |
| "Nothing is written yet. Your days will be listed here." | Timeline, a journal with no entries. He drew no such state |
| "This list stops here. Your earlier days are still in your journal, and are not listed yet." | Timeline, when the cap is reached |
| "Your name, your email, and sign out." | You, under "Account". His says "Your email, signed-in devices, sign out and timezone", and two of those are not built |
| "Name" and "What you are called here." | Account, the name row |
| "We could not reach the server. You are still signed in on this device. Try signing out again." | Account. In the style of his "That device is still signed in. Try its Sign out action again." |
| "Something went wrong on our side. You are still signed in on this device. Try signing out again." | Account, when the API answers with an error |
| "Signing out." | Account, while the request is out |
| "<Thursday 6 August 2026>, <2 entries>" | The name a screen reader says for a Timeline day |

**The designer's, word for word.** "Page not found", "This entry or day could
not be found.", "Back to Today", "Nothing on this day", "The last item on
this day was deleted, so this day no longer appears in Timeline.", "Back to
Timeline", "Loading this day.", "Loading your days.", "We could not reach the
server. Try loading this day again.", "We could not reach the server. Try
loading it again.", "There is nothing earlier in this journal.", "Day felt",
"Mood can be changed here, and only here.", "Your account", "Account",
"Email", "The address used to sign in.", "Sign out of this device".

**Already in the app, used again.** "Something went wrong on our side. Try
loading it again.", "Asking again.", "Asked N times.", and the sentences for
a failed delete and a failed mood.

Two failure sentences have `role="alert"` where the comps write
`role="status"`. That follows Day 17a's reason: a failure should be read out
at once.

---

## Rules in `live.css`

**Removed**

- **5.4**, "One destination stands where the first one is drawn".

**Added**

- **Section 2, two selectors**, for a pushed page. A pushed page has a way
  back and no destinations. Below desktop its header is a masthead that is
  the page's own child. On desktop the same things stand in `.title`. So on
  desktop that masthead is hidden, and the first thing shown gets the top
  margin `--lead`, exactly as section 2 already does for `.journal-header`.
  Sign in has such a masthead and no `.title`, so the rule does not reach it.
- **5.4 (new)**, the date of a Timeline day as a link: the column's own
  colour, underlined, at least `--tap` tall.

Section 5 still holds four temporary rules.

---

## Existing tests that changed

**No existing test body was edited**, in any file.

In `lib/today.test.ts` the helpers at the top changed:

| Helper | Change | Why |
|---|---|---|
| `entry` | Typed as `WireEntry`, and gives each entry a `date` | Part 1 |
| `fakeApi` | Holds a mood for each date, answers `GET /days/:date` and `PUT /days/:date/mood` for any date, filters `GET /entries` by its `date`, and has `file()` to put entries on another date | A past day asks these routes |

Every existing test puts its entries on the fixture's today, so the stand-in
answers them exactly as before. **This is a claim I could not check, because
the tests were not run.** It is the first thing a run should confirm.

One thing a run may surface: Today's tests that count requests. A past day
asks `GET /days/today` and then `GET /days/:date`. Today still asks only
`GET /days/today`, so its counts should not move.

---

## Tests written, and where each claim is

Not run. Each is named so it can be found.

| Claim in the prompt | Where |
|---|---|
| Two pages, three dates, two months, grouped and ordered | `timeline.test.ts` › `entries from two pages, on three dates in two months…` |
| Placed by `date` when `createdAt` falls on another date on this machine | `timeline.test.ts` › `an entry is placed by its date, even when its createdAt…`. Noon UTC on the 10th is never the 9th on any clock, so the test does not depend on the machine's timezone |
| The page cap, and what the state says | `…when the page cap is reached the Timeline says the list is not complete…`, `a journal that ends before the cap is complete`, `the default cap is the one a day's page uses` |
| Each Timeline state | `opening: …`, four tests named `unreachable: …` and `failed: …`, `empty: …`, `asking again says so…` |
| A past day opens, shows the API's mood, changes it, deletes, and puts back | `today.test.ts`, the group "The page of a date that is not today", first eight tests |
| Not found: not a date | seven tests, one for each bad address |
| Not found: a 404; a day with no entries | `a day the API answers 404 for…`, `a day that has no entries is not found` |
| Unreachable is not "not found" | `a failure to reach the server is not shown as not found…` |
| Deleting the last entry of a past day | `deleting the last entry of a past date leaves a day that says it was emptied…`, `when the delete of the last entry of a past date fails…` |
| Sign out: success | `session.test.ts` › `signing out sends POST /auth/logout with the token and the cookie…` |
| Sign out: a 401 | two tests: the session was over, and the token was only old |
| Sign out: unreachable | `when the server cannot be reached, signing out changes nothing…` |
| Sign out: the in-flight refresh | `a refresh that is in flight when sign-out is pressed is waited for…` |
| The mood body is the contract's shape | `a mood pressed on a past date … in the contract's shape`, `the mood body on Today is the contract's shape too…`, and the type-check in Part 1 |

Tests the prompt did not ask for: a past day cannot write; today's own date;
an ended session on a past day and on the Timeline; a server error on
sign-out; two presses of sign out; a request refused during and after a
sign-out; signing in again after signing out; `isCalendarDate` and the
labels.

---

## Mutation table — predictions, not results

**None of these was run.** Each row says what I expect, from reading the
code.

| # | Mutation | Expected to fail | Checked? |
|---|---|---|---|
| 1a | Group Timeline entries by a date worked out from `createdAt` | `an entry is placed by its date…`, and the two-pages test (entry `d` is filed on 2 August and was created on 31 August) | no |
| 1b | Build the address of a day from the browser's clock | **Nothing can fail.** See below | — |
| 2 | Stop after the first page of entries | The two-pages test; the cap test; `the default cap…` | no |
| 3 | Show an unreachable server as "Page not found" | `a failure to reach the server is not shown as not found…` | no |
| 4 | Give a past day's page a working `save` | `the page of a past date cannot write…` | no |
| 5 | On an unreachable sign-out, drop the token and sign out anyway | `when the server cannot be reached, signing out changes nothing…` | no |
| 6 | On a successful sign-out, keep the access token | `signing out sends POST /auth/logout…` (the next request must carry no token); the in-flight refresh test | no |
| 7 | Let a refresh that finishes after sign-out sign the person back in (remove the wait in `signOut`) | `a refresh that is in flight when sign-out is pressed is waited for…` | no |

**1b: the rule that no test reaches.** The address of a day is built in one
place, `DayRows` in `app/screens/LiveTimeline.tsx`:

```tsx
href={day.date === today ? '/' : `/d/${day.date}`}
```

`day.date` is the entry's `date` and `today` is the API's answer. If someone
replaced either with `new Date()`, every check would still pass, because that
line is inside a component. What holds the rule today is that nothing under
`apps/web` outside the tests calls `new Date()` with no argument. I searched:
the only uses are `new Date(Date.UTC(year, month, day))` in `lib/format.ts`,
to read a weekday from three numbers, and `new Date(instant)` in
`formatTime`, to show an entry's time of day. A lint rule that forbids
`new Date()` and `Date.now()` in `apps/web` would turn this from a habit into
a check.

---

## What sits inside a component, where no test reaches it

This is the list for Day 19's question about a test in a real browser.

- **The address a Timeline day leads to**, including "today's row leads to
  `/`" (mutation 1b).
- **`/d/<today>` sends the person to `/`.** The store says `isToday`, which
  is tested. The redirect itself is in `LiveDay.tsx`.
- **Back after signing out does not show the journal.** That is `Gate`.
- **A signed-out person is sent to sign in** from every new address. `Gate`
  again.
- **Which status draws which screen.** For example that `notFound` draws
  "Page not found" and not the error notice.
- **Every sentence**, and which failure gets which sentence.
- **Where focus goes** after a delete, and after the last delete of a past
  day (the heading "Nothing on this day").
- **"Try again" on a past day and on the Timeline calls `open()`**, and
  "Asking again." appears.
- **The sign-out button**: that a press calls `session.signOut()`, that
  "Signing out." shows, and that the right sentence shows on failure.
- **That a past day has no composer.** The store has no `save`, which is
  tested. That the page draws no field is only seen in the browser.
- **The date box is filled from the API's date** and from the address, never
  from the clock.
- **The name and the email on Account** come from the session's user.
- **The destinations**: which exist, their order, and which is marked
  current.

All of these were seen working once, by hand, in the walk-through above. None
would be caught if it broke tomorrow.

---

## Limitations

- **The tests and the mutations were not run.** Said at the top.
- **The Timeline is loaded once when it opens.** It does not ask again when
  the tab is looked at again, as Today does. Coming back to it from another
  screen loads it again.
- **A Timeline row shows the whole entry**, however long. The comp's rows
  are short because its sample text is short. `lock.css` does not cut a long
  one. A question for the designer.
- **Paging by offset can skip or repeat an entry** if one is written or
  deleted in another tab while the Timeline is loading. Day 29's problem.
- **A year from 0000 to 0099 is refused by `isCalendarDate`**, because
  JavaScript reads such a year as 1900 and something. It ends as "Page not
  found", which is also right for a journal.
- **`router.replace('/in')` is called twice after a sign-out**, once by
  Account and once by `Gate`. The second does nothing.
- **Chromium only**, as on Days 17a and 17b. Hover was not measured.
- **Failure states were not seen in the browser** except the unreachable
  sign-out: the unreachable Timeline, the unreachable day, and a failed
  delete on a past day are covered only by the tests that were not run.

---

## Dependencies added

None.

---

## Answers

### 1. Is there a case where a past day that can be changed is worse than one that can only be read?

**Yes, for deleting. I believe the owner's choice is right for mood, and I
would look again at delete.**

A journal's value grows with age. An entry from last week is a draft that can
still be put right. An entry from three years ago is a record, and often the
only one. On Today, deleting is tidying. On a day from long ago, deleting
destroys something that cannot be written again, and the control for it is
the same small icon, one confirmation away, on a page a person usually opens
only to read.

Three things make it worse on a past day than on Today.

- **The person is reading, not editing.** A slip of the thumb is more likely
  when the hand is scrolling.
- **The screen then tells them the day is gone.** "Nothing on this day" is
  honest, and it is also the moment a person learns that a whole day has left
  their Timeline.
- **ADR-021's own worry is larger here.** A failed delete puts the entry back
  with a sentence in its row. On a past day with one entry, the screen has
  already changed to "Nothing on this day" before the answer arrives.

Why I still would not make a past day read-only:

- **Privacy is the strongest reason to delete, and it does not get weaker
  with time.** A person who wants an entry gone must be able to remove it
  from the day it is on.
- **Mood is the opposite case.** It is often clearer how a day felt a few
  days later. Changing it destroys nothing.
- **The delete is soft** (ADR-020). The row is still in storage. Nothing the
  person can do brings it back today, but a restore could be built.

What I would change, if anything, is small: on a day that is not today, the
confirmation could name the date, "Delete this entry from Thursday 6 August?
This cannot be undone." That is wording, and so it is the owner's.

### 2. At what size of journal does a person notice the Timeline loading, and what is the smallest change that puts that off?

**I expect it to be noticed at a few hundred entries on a phone connection,
and clearly at about a thousand.** I did not measure this; it is reasoning.

- Each page is one request, and they go one after another. 200 entries is one
  request, 1,000 is five, 4,000 is twenty. On a slow connection each takes a
  good part of a second.
- Each entry travels whole. A long entry is a few thousand characters, and
  the Timeline draws every one of them.
- All of it is then drawn at once. A few thousand rows is slow to draw on a
  phone, whatever the network does.
- At 4,000 entries the list stops and says so. A person who writes five
  entries a day reaches that in a little over two years.

**The smallest change: draw each page as it arrives.** The store already
loads page by page. If it published after each page, the newest 200 entries
would be on screen after the first request, and the rest would join below
them. The designer has already drawn the line for this: "Fetching earlier
entries." at the foot. It changes one function in `lib/timeline.ts` and adds
no route. It does not make the total work smaller. It makes the wait
invisible for the part of the list a person looks at first.

The real repair is the one the API report gives: list the days from
`GET /days`, and load entries only for the days on screen. That is Day 29.

### 3. Is two presses the right distance for signing out?

It is three: You, then Account, then "Sign out of this device". **I think
that is right for now, and I would not shorten it.**

- **Signing out of a private journal is rare on a person's own device** and
  costly when done by accident: the password has to be typed again.
- **Where it matters is a shared or borrowed device**, and there a person is
  looking for it and will find "You" at once.
- **Putting it on every screen** would give a rare, costly action the same
  weight as Today and Timeline, which are used many times a day.

What I would change is the middle step. You has one row, so it is a page
whose only job is to be pressed. Until You has more rows, the You destination
could lead straight to Account. That saves a press and removes a page that
says nothing. It also departs from the designer's `07-you.html`, so it is a
question for the owner and for him. I built what the prompt asked.

### 4. What did I use that the owner has not been taught?

**In Next.js:**

- **How a date is read out of an address.** A folder named `[date]`, with the
  square brackets, matches any text in that place of the address. So
  `app/d/[date]/page.tsx` answers `/d/2026-08-06` and also `/d/anything`.
  Next.js hands the text to the page as `params.date`. In this version
  `params` is a promise, so the page is an `async` function and writes
  `const { date } = await params`. The value is always plain text, and may be
  nonsense, which is why `isCalendarDate` exists.
- **`Link` from `next/link`.** It draws an ordinary `<a>`, and when pressed
  it changes the screen without loading the page again. Everything in memory
  survives, the access token included.
- **`router.replace(address)`.** Like following a link, except that the
  current address is replaced and not added to. Back then does not return to
  it. `LiveToday` already used it.
- **`app/not-found.tsx`.** A file with this name is what Next.js shows for an
  address that no page answers to.

**In React:**

- **`key` on a component, used to start over.** `<LiveDay key={date} …>`
  tells React that a different date is a different component. It throws the
  old one away, with its state, and builds a new one.
- **A function as `children`.** `<Gate>{(user) => <YouRows user={user} />}</Gate>`.
  `Gate` calls that function only when someone is signed in, and hands it the
  person.
- **`Fragment` with a `key`.** A wrapper that draws nothing. It is used on
  the Timeline because `lock.css` draws a line between the direct children of
  a sheet, and a real wrapper element would break that.
- **A custom hook**, `useFocusAfterDelete`. A function whose name starts with
  `use` and that calls other hooks. It lets two screens share one piece of
  `useRef` and `useEffect` logic.
- **A ref handed to a child as a prop** (`heading` on `NothingOnThisDay`).

**In TypeScript and JavaScript:**

- **`interface Today extends DayPage`.** `Today` has everything `DayPage` has,
  and two more functions.
- **`Omit<TodayState, 'text' | 'save'>`.** A type that is `TodayState`
  without those two fields.
- **`Extract<…>`**, in a test, to pick one shape out of a type that is one of
  several.
- **`Map`.** A table from a key to a value. `groupByDay` uses one from a date
  to that date's entries.
- **A regular expression**, `/^\d{4}-\d{2}-\d{2}$/`: four digits, a dash, two
  digits, a dash, two digits, and nothing else.
- **`promise.then(…)`**, once, in `refresh`. It means "when that finishes, do
  this". It is the older way of writing what `await` does.
- **`'save' in page`**, in a test. It asks whether an object carries a field
  of that name at all.

### 5. What in the prompt was wrong, contradicted itself, or assumed something untrue

**a. "Sign in and create account must still measure identical to their
comps."** Sign in does. Create account has not since Day 17b, which added
the Name field: every element after it stands lower than in
`14-register.html`. Day 17b's report measured that itself (11 of 39 the
same). Nothing changed there today.

**b. "A 401 means the session was already over."** Not always. `POST
/auth/logout` needs a valid access token. An old token with a good session is
also a 401, and the cookie is then still in the browser. See *Signing out*.

**c. "Follow `V3-REVISION.md`" for the address of today's own date.** It
does not say. The gap is listed, and the prompt's fallback is built.

**d. The address of a day.** The prompt points at `00-flow.md`, which gives
`/d/2026-08-04`. `V3-REVISION.md`, which says it supersedes `00-flow.md` on
routes, writes the area as `/day`. That is the name of the prototype's hash
and not a route with a date in it, so I used `00-flow.md`'s. Someone should
make the two agree.

**e. "Each day leads to its page."** The comp draws no way from the list to a
day. The link is mine.

**f. The mobile Timeline comp has the List/Calendar switch where the date box
is on Today.** Removing the switch, as the prompt asks, changes the header's
height unless something else stands there. See *Part 3*.

**g. The not-found comp marks Today as the current destination**, and so does
"Nothing on this day". A person on either screen is not on Today. I marked
none. A question for the designer.

**h. "Use his words" for the day that could not be opened covers one of the
two failures.** He drew "could not reach the server". He did not draw
"something went wrong on our side" for a day, so that sentence is mine.

**i. "Cap the pages as `lib/today.ts` caps them."** Same number, yes. Same
behaviour, no: Today fails at the cap, and I argue the Timeline must not. See
*Part 3*.

**j. "All nine must pass."** `pnpm lint` is not only a check: the API's
script runs `eslint --fix`, which can change files.

**k. The prompt's precondition cannot be checked by a worker.** "Run this
only after the API task is finished and audited." The API report is there.
Nothing in the repository records an audit.

**l. Not wrong, and worth saying.** The prompt says a past day needs
everything Today has "but the composer". It also needs one thing Today does
not have: a question about which day is today. See *The address of today's
own date*.

---

## What the owner should look at first

1. Run `pnpm test`, `pnpm test:e2e` and `pnpm test:web`, and then the seven
   mutations. Until then this work is built and seen working, and not proved.
2. *Choices that are the owner's*: three short ones.
3. Answer 1, on deleting from a day long past.
4. The Timeline and a past day on a real phone.

---

## The order inside a day

Asked by `docs/workers/day-17c-web-timeline-entry-order.md`. The owner ruled
that on the Timeline the entries inside one day are newest first, so the
whole Timeline runs one way: months, days and entries. A day's own page is
unchanged and still reads oldest first.

**The change.** `groupByDay` in `apps/web/lib/timeline.ts` now orders a
day's entries by `createdAt`, newest first. The comment on
`TimelineDay.entries` says so, and says that the day's own page reads the
other way on purpose. The comment above `groupByDay` names all three orders.
Nothing in `apps/web/lib/today.ts` changed.

**Tests changed** (both in `apps/web/lib/timeline.test.ts`; only the
expected order inside a day changed):

1. *entries from two pages, on three dates in two months, are grouped by day
   and ordered as the Timeline shows them*: `2026-08-31: b c` became
   `c b`, and `2026-08-02: a d` became `d a`.
2. *when the page cap is reached the Timeline says the list is not complete,
   asks no more, and leaves out the day that may be cut*: `2026-08-28: n0 n1`
   became `n1 n0`, and `2026-08-27: n2 n3` became `n3 n2`.

The test *an entry is placed by its date…* reads `entries[0]` of a day that
has one entry, so the order does not touch it, and it was not changed.

**Test added** (in `apps/web/lib/timeline.test.ts`): *the same three entries
of one day: newest first on the Timeline, oldest first on the day`s own
page*. One stand-in API holds three entries of today, written at 07:00,
12:00 and 21:00. The Timeline built on it shows `night noon morning`; Today
built on the same API shows `morning noon night`. Today is used as the day's
page because the stand-in answers `/days/today` and not `/days/<date>`; it
sorts with the same code a past day's page uses.

**Mutation.** I put the old order back in `groupByDay` (`a.createdAt` before
`b.createdAt`) and ran `pnpm test:web`: 154 tests, 151 pass, 3 fail. The
three that failed:

- entries from two pages, on three dates in two months, are grouped by day
  and ordered as the Timeline shows them
- the same three entries of one day: newest first on the Timeline, oldest
  first on the day`s own page
- when the page cap is reached the Timeline says the list is not complete,
  asks no more, and leaves out the day that may be cut

Then I put the new order back.

**Verification.** `pnpm lint:web && pnpm typecheck:web && pnpm build:web &&
pnpm test:web` passed, exit code 0. `pnpm test:web` runs two suites:

| Suite | tests | pass | fail | cancelled | skipped | todo |
| --- | --- | --- | --- | --- | --- | --- |
| contracts | 7 | 7 | 0 | 0 | 0 | 0 |
| web | 154 | 154 | 0 | 0 | 0 | 0 |
