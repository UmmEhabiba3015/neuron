# Day 15c — Worker report: the web app signs in and reads real data

**Date:** 2026-10-06. Prompt: `docs/workers/day-15c-web-session-and-today.md`.
Binding decision: ADR-018.

---

## Objective

Make `apps/web` a real client of the API. A person can create an account,
sign in, reload the page and stay signed in, and see the entries they wrote
today.

Web only. `apps/api` was not edited, git was not touched, and no dependency
was added.

---

## Summary

All three parts are done, and the flow was checked in a real browser.

- **One plain TypeScript module owns the session**, `apps/web/lib/session.ts`.
  It imports nothing at all. The four rules in the prompt are each a few
  lines in it, and each is tested.
- **Three routes exist**: `/in`, `/new` and `/`. All user data is fetched in
  the browser. There is no route handler and no proxy.
- **The API's address is `NEXT_PUBLIC_API_URL`.** A missing value stops
  `next dev` and `next build` with a message that names the variable.
- **All three required mutations make tests fail.**

```
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
lint        clean
typecheck   clean
build       clean, 7 routes, all static
test        15 passed, 0 failed
```

```
grep -rn "localStorage\|sessionStorage\|document.cookie" apps/web/app apps/web/lib
(no output)
```

Five things need the Master Thread or the owner. Each is described further
down:

1. **`pnpm typecheck:web` was already failing before this task**, on the
   committed code. See *Findings*.
2. **I changed one thing the prompt did not ask for**: a rule in `live.css`
   that fixes where content starts on the desktop layout. See *Decisions
   made*, item 6.
3. **Several sentences on screen are mine**, because the prompt and the
   handover did not supply them. They are listed under *Assumptions* so the
   designer can replace them.
4. **Entry times are shown on the device's clock, while the day is decided on
   the API's clock.** See question 5.
5. **Your dev server needs `apps/web/.env.local`.** I created it by copying
   the example. It is gitignored. See question 2.

---

## Files changed

| File | What changed |
|---|---|
| `apps/web/lib/session.ts` | New. The session module. |
| `apps/web/lib/session.test.ts` | New. 13 tests. |
| `apps/web/lib/api.ts` | New. The one session object of the page, and the web app's types for an entry and a day. |
| `apps/web/lib/config.ts` | New. Reads `NEXT_PUBLIC_API_URL`. |
| `apps/web/lib/format.ts`, `format.test.ts` | New. Writes `2026-08-09` as `Sun 9 Aug '26`, and an instant as `09:20`. 2 tests. |
| `apps/web/app/components/useSession.ts` | New. Client hook: the session's state, for a screen. |
| `apps/web/app/components/AuthScreen.tsx` | New. The shell of the signed-out screens, and the blank screen. |
| `apps/web/app/screens/AuthForm.tsx` | New. Sign in and create account, one component with a `mode`. |
| `apps/web/app/screens/CouldNotConnect.tsx` | New. Shown when the first refresh gets no answer. |
| `apps/web/app/screens/LiveToday.tsx` | Rewritten. It was sample content; it now fetches. |
| `apps/web/app/in/page.tsx`, `app/new/page.tsx` | New. Two lines each. |
| `apps/web/app/styles/live.css` | The temporary auth block, and the desktop fix in item 6. |
| `apps/web/next.config.ts` | Refuses to start without `NEXT_PUBLIC_API_URL`. |
| `apps/web/.env.example` | New. To be committed. |
| `apps/web/.gitignore` | One line, `!.env.example`. The file ignored every `.env*`, so the example could not have been committed. |
| `apps/web/tsconfig.json` | `allowImportingTsExtensions`. Node runs the tests directly and needs `./session.ts` written in full. |
| `apps/web/package.json`, root `package.json` | `test` and `test:web`. |
| `README.md` | One paragraph on the web app's setting. |

`app/styles/lock.css`, the `/review` pages, `lib/sample.ts` and
`app/screens/Today.tsx` were not touched.

---

## How it works

### The session module

`createSession({ apiUrl, fetch })` returns one object. The address and the
function that sends requests are passed in, which is what lets a test replace
the network.

The access token is one variable inside that function:

```ts
let accessToken: string | undefined;
```

Nothing else holds it. That is rule 1.

The module has a small state that screens read:

| State | Meaning |
|---|---|
| `unknown` | The first refresh has not answered yet |
| `unreachable` | The first refresh got no answer at all |
| `signedIn` | There is a token and a user |
| `signedOut`, `ended: false` | A visitor who was not signed in |
| `signedOut`, `ended: true` | A session that was in use stopped working |

Every request comes back as one of four results: `ok`, `rejected` (the server
answered with an error, and the status is kept), `ended`, or `unreachable`.

**Rule 4, one refresh at a time**, is this:

```ts
function refresh() {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  ...
}
```

While a refresh is running, anyone else who asks for one receives the same
promise. Mutation 1 deletes those three lines.

**Rule 2, refresh on load**, is `restore()`. Calls made together share the
one refresh. A call made after the answer is known sends nothing, so moving
from `/in` to `/` does not refresh a second time.

**Rule 3, one refresh and one repeat**, is `request()`. It has no loop. The
request is sent, and on a 401 it refreshes and sends once more, and that
second answer is final whatever it is. A second 401 ends the session.

One addition of mine, which is small: if a 401 arrives and the token has
already been replaced by another request's refresh, the request is repeated
with the new token without refreshing again. Without this, a slow request
would rotate the refresh token a second time for no reason.

**No answer and a 401 are separated at the lowest level.** `fetch` only
rejects when no answer arrived. That is caught in one place and becomes
`unreachable`. A 401 is an answer and never takes that path.

### The screens

Each screen calls the `useSession()` hook, which subscribes to the module and
asks for `restore()` when the screen mounts.

| Session state | `/` | `/in` and `/new` |
|---|---|---|
| `unknown` | Blank paper | Blank paper |
| `unreachable` | "Could not connect", Try again | The same |
| `signedOut` | Sent to `/in` | The form |
| `signedIn` | Today | Sent to `/` |

Today asks `GET /days/today`, then `GET /entries?date=<that date>&limit=200`,
and sorts the entries oldest first. The browser never calls `new Date()` to
decide the day.

Today asks both questions again when the tab becomes visible again. This is
the answer to the limitation in report 15b, a tab left open across 4am. What
is on the screen stays there unless the new answer is a good one.

---

## Decisions made

1. **`NEXT_PUBLIC_API_URL`, checked in `next.config.ts`.** See question 2.

2. **One form component for both screens.** Sign in and create account share
   their fields, their layout and seven of their eight states. Two components
   would have been the same file twice.

3. **`router.replace`, not `router.push`, after signing in.** Handover 3.3
   says Back from Today must not return to the form.

4. **The API's validation messages are reworded.** The prompt says each
   message "becomes a sentence beside its field". Handover section 5 says the
   server's messages are written for developers and every sentence a person
   reads is written for the product. I followed both: a message finds its
   field by its first word (`email …`, `password …`), and the two messages
   the API sends in practice are replaced with product wording. Any other
   message is shown as it came, with a capital letter and a full stop.
   The browser checks the same two things first, so this path is rarely
   reached.

5. **The date box is always drawn, and is empty until the date arrives.**
   The masthead keeps its height, so nothing below it moves. The cost is an
   empty box labelled "Day" for a moment, and for as long as a failure lasts.

6. **A fix outside the prompt: where content starts on desktop.** Please
   check this one. On the desktop layout `lock.css` gives the page's *first
   child* a top margin of 68px, so that content starts on the date box's
   line. In the live shell the first child is the mobile masthead, which
   `live.css` hides on desktop. The margin was spent on a hidden element, and
   the sheet started at the very top edge. This was already true of the
   committed Today screen. I added one rule to `live.css` that gives the same
   margin, from the same token, to the first child that is shown. State 1's
   caption says "the prompt line starts on the date box's line, at 68", and
   it now does. `lock.css` is unchanged.

7. **The composer and the mood row are drawn only once Today has loaded.**
   Neither does anything yet, and a composer under "We could not open today"
   would look like an offer.

8. **No sign-out control.** The prompt does not ask for one and the Account
   page is a later day. To sign out today, delete the cookie in the browser's
   storage panel.

---

## Assumptions

**Sentences I wrote.** The designer should supply or approve these:

| Where | Sentence |
|---|---|
| Email empty | "Enter your email address." |
| Not an email | "That does not look like an email address." |
| Password empty, on `/in` | "Enter your password." |
| Password short, on `/new` | "That is shorter than 8 characters." |
| In flight | "Logging in." and "Creating your account." |
| Any other error from the server | "Something went wrong on our side. Nothing was changed." |
| Today, loading | "Opening today." |
| Today, no answer | "Could not connect. We could not open today." |
| Today, server error | "Something went wrong on our side. We could not open today." |
| Action on a failure | "Try again" |

**"Not an email" in the browser is a loose check**: something, an `@`, and
something. The API's `IsEmail` is the authority. An address that passes mine
and fails the API's gets its sentence from the 400.

**The email is trimmed before it is sent.** Spaces around a pasted address
are a slip and not part of it.

**The empty-day prompt is one line**, "What's today been like?", taken from
the comp. The comp's caption describes a set that rotates by day. Only one
line of that set exists in the designs, and I did not invent the others.

**While signing in is refused, the copy line stays** "Open your journal on
this device." The prompt gives a new heading, notice and help for that state
and says nothing about the copy.

---

## Limitations

**A returning user whose session ran out sees plain "Log in"**, and not "Log
in again". The cookie is `HttpOnly`, so the page cannot tell "no cookie" from
"a cookie the server no longer accepts". Both are a 401 from the first
refresh. "Log in again" appears only when a session ends while the page is
open.

**"Anything they had typed is kept"** (handover section 5) is not done. There
is nothing to type into yet, because the composer is not wired. It has to be
built with the composer.

**If the account is created and the sign-in that follows gets no answer**,
the form says "Could not connect". Pressing again then answers "There is
already an account with this email", with "Log in instead". That is true and
it leads to the right place, but it is a surprising sentence for someone who
has just made the account.

**No test covers a React component.** There is no test framework and the
prompt forbids adding one. The session module and the date format are tested;
the screens were checked in the browser, as described below.

**A day with more than 200 entries** is fetched in pages of 200 until a short
page arrives. That path is not tested.

**An entry's line breaks are not shown.** The `Entry` component puts the text
in one paragraph, and `lock.css` does not preserve white space there. I left
both alone.

**The destinations still link to `/timeline`, `/ask` and `/you`**, which do
not exist.

---

## Dependencies added

None. The tests use Node's own test runner, and Node 24 runs TypeScript files
directly.

---

## Testing performed

### Claims, and where each is tested

All in `apps/web/lib/session.test.ts`.

| Claim | Test |
|---|---|
| Two requests that receive 401 together cause exactly one refresh | *two requests that receive 401 together cause exactly one refresh, and both are repeated with the new token*. The refresh is held open by the test until both 401s have arrived. |
| After that refresh, both are repeated with the new token | The same test. It checks the token on each of the four requests: `old`, `new`, `old`, `new`. |
| A request is repeated at most once | *a request is repeated at most once, even when the repeat is refused too*. The path answers 401 for ever; exactly 2 requests are sent. |
| A failed refresh reports that the session ended, and does not loop | *a failed refresh reports that the session ended, and does not loop*. 1 refresh, 1 request, state `signedOut, ended`. |
| Two calls to the on-load refresh made together cause exactly one request | *two calls to the on-load refresh made together cause exactly one request*. |
| No answer is reported differently from a 401 | *no answer from the server is reported differently from a 401*. The result is `unreachable`, no refresh is sent, and the state is still `signedIn`. |

Eight further tests, for behaviour I added or relied on: no answer to the
on-load refresh; no answer to the refresh after a 401; the on-load refresh
being refused is not "ended"; a late 401 uses the new token; only login and
refresh carry the cookie; a refused login triggers no refresh; a 400 carries
every message; a screen that has unsubscribed is no longer told of changes.

The stand-in for the API refuses to answer more than 20 requests. Without
that, a session that retried for ever would hang the run instead of failing
it.

### Mutation table

Each change was made to `lib/session.ts`, the tests were run, and the file
was restored. After the last one: 15 passed.

| # | Change | Result | Tests that failed |
|---|---|---|---|
| 1 | Removed the sharing: deleted `if (refreshInFlight) return refreshInFlight` | 2 failed | *two requests that receive 401 together…*; *two calls to the on-load refresh made together…* |
| 2 | Removed the retry limit: after the refresh, `request` calls itself again | 1 failed | *a request is repeated at most once…* |
| 3 | A network failure is treated as a 401 | 3 failed | *no answer from the server is reported differently from a 401*; *no answer to the on-load refresh…*; *no answer to the refresh that follows a 401…* |

### A missing address

With `.env.local` moved away:

```
$ next build
⨯ Failed to load next.config.ts
Error: NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to
apps/web/.env.local and restart.
```

### In a real browser

I had a real browser, Firefox, run without a window and driven by a script
over its WebDriver connection. The script types into the fields and presses
Enter as a keyboard would. I did not use your two running servers or your
database. I started a second copy of the API on port 39417 with an empty
database in a temporary folder, and a production build of the web app on
port 39418, and removed both afterwards.

One difference from your setup: this was a production build. React's
double-mount in development is covered by the unit test, not by this run.

| Step | What the page showed | Requests to the API |
|---|---|---|
| Signed-out visitor opens `/` | Sent to `/in`, "Log in" | `POST /auth/refresh` 401 |
| Empty form submitted | "Enter your email address." and "Enter your password.", each beside its field | none |
| Wrong details | "Try again", "We could not log you in with those details.", "Check your email and password, then try again." | `POST /auth/login` 401 |
| `/new`, password of 5 characters | "That is shorter than 8 characters." | none |
| `/new`, good password | Today, date box "Tue 6 Oct '26", "What's today been like?" | `register` 201, `login` 200, `days/today` 200, `entries?date=2026-10-06` 200 |
| Two entries added from outside the browser, then reload | Both entries, oldest first, then the mood row | `refresh` 200, `days/today`, `entries` 200 |
| Reload again | The same, still signed in | `refresh` 200 |
| Signed-in user opens `/new` | Sent to `/` | |
| Same email registered again | "There is already an account with this email.", "Use another email, or log in to your existing journal.", action "Log in instead" | `register` 409 |
| Log in pressed with the API stopped | "Could not connect", "We could not finish that request." Both fields still held what was typed | `login` no answer |
| Pressed again with the API back | Today | `login` 200 |
| Reload with the API stopped | "Could not connect", Try again. Neither Today nor a form | `refresh` no answer |
| Try again with the API back | Today, still signed in | `refresh` 200 |
| Every session revoked from outside, then the tab looked at again | `/in`, "Log in again", "Your session has ended. Log in to open your account." | `days/today` 401, `refresh` 401 |

Storage, read after signing in:

```
localStorage keys     []
sessionStorage keys   []
document.cookie       ""
cookie  neuron_refresh  path=/auth/refresh  httpOnly=true  sameSite=strict  secure=false
```

`document.cookie` is empty while the cookie exists. That is `HttpOnly` seen
from the page's side: script cannot read it.

I also looked at screenshots at 390, 1000 and 1440 wide. The `/review` pages
answer 200 on your dev server.

**What I did not check:** your own dev server together with your own API in
a browser. I confirmed that your dev server serves `/`, `/in` and `/new`, and
that your API answers a preflight from `http://localhost:3001` with the right
two headers. I did not create an account in your real database.

### Findings

**`pnpm typecheck:web` failed on the committed code, before I changed
anything.**

```
app/screens/LiveToday.tsx(15,7): error TS2322 … Property 'keyLabel' does not
exist on type … { current; aside; lede?; children; foot? }
```

`LiveScreen` was changed to take `aside` and `lede`, and `LiveToday` still
passed `keyLabel`, `keyValue` and `glance`. `next dev` does not typecheck, so
the page still rendered, with no date box. The rewrite of `LiveToday` removes
the error. It is worth knowing that a web commit went in with typecheck red.

**My first browser run showed an empty Today after entries were added.** The
fault was in my test script, which signed in from outside with a different
password from the one it had typed. I corrected the script and ran it again.
The application was not changed.

---

## The five questions

### 1. Which files are client components, and could any of them have stayed on the server?

Four files carry `'use client'`:

- `app/components/useSession.ts`
- `app/screens/AuthForm.tsx`
- `app/screens/LiveToday.tsx`
- `app/screens/CouldNotConnect.tsx`

None of the four could stay on the server. Each one either reads the session,
which exists only in the browser's memory, or handles a press or a keystroke.

What did stay on the server: the three `page.tsx` files, `layout.tsx`,
`AuthScreen`, `LiveScreen`, `Chrome` and `Journal`. They are plain markup.
They are still *sent* to the browser, because a client component imports
them, but they contain no browser code.

One honest point. For `/`, the server renders nothing useful. It cannot know
who is asking, so the HTML it sends is the blank paper. That is the cost of
ADR-018, and it is the right cost: the alternative is to give the Next.js
server the credential.

### 2. How does the browser learn the API's address, and when is that value fixed?

Through `NEXT_PUBLIC_API_URL`. Next.js replaces the text
`process.env.NEXT_PUBLIC_API_URL` with the value itself while it compiles the
JavaScript. The browser never reads an environment variable. It downloads a
file in which the address is already written.

**So the value is fixed when the app is built**, not when it runs. Starting
the built app with a different value changes nothing. I saw this directly:
the build I made for port 39417 contained `localhost:39417` in its files, and
I had to build again to get `localhost:3000` back.

This matters on Day 31. One build cannot be moved from a test environment to
production; each environment needs its own build. If that becomes a problem,
the way out is for the server to hand the address to the page when it is
requested. That is more moving parts than this project needs today.

The check for a missing value is in `next.config.ts`, because that file runs
before anything is built or served. Left to the browser, a missing value
would become requests to `undefined/auth/refresh` and a screen that says
"Could not connect". That is true and it helps nobody.

### 3. What does a signed-in user see for the first moment after a reload, and is that acceptable?

In order:

1. Blank graph paper with the binding rail, until the refresh answers.
2. The masthead with an empty date box, the destinations, and the line
   "Opening today.", until the two requests answer.
3. Today.

On a laptop each of the first two lasts a few hundredths of a second.

I think step 1 is acceptable and step 2 is not quite right.

Step 1 has to show nothing that belongs to either outcome, and blank paper is
the one thing both outcomes share. A line of text there would flash on every
reload. The weakness is a slow network, where blank paper for two seconds
looks broken. The usual answer is a line that appears only after a short
delay. I did not add it, because whether it is wanted is the designer's
question (handover section 5 asks it).

Step 2 flashes a sentence for a moment on every reload. I would prefer that
Today kept the blank page until its data arrived, and showed "Opening today."
only after the same short delay. I built the simple version, because the
prompt says loading follows section 5 and section 5 says a plain line.

One thing a reader might expect and will not find: the refresh and the two
Today requests cannot be sent together. The Today requests need the token
that the refresh returns.

### 4. What here will have to change when the designer's `lock.css` arrives?

- **Delete the block marked TEMPORARY in `live.css`.** It defines the eight
  `auth-` classes. If the new `lock.css` defines the same names, nothing in
  the markup changes.
- **Check four things I had to guess**, because I had class names and no
  styles: the heading's size (I used the 22px token, in the prose face), the
  form's maximum width (420px), the label style (the printed caps style), and
  whether the notice sits above the form.
- **Check `input.field`.** `lock.css` wrote `.field` for a `div` that only
  looks like a field. I put it on a real `<input>`, with two extra
  declarations to make it fill the row. The new stylesheet may style inputs
  itself.
- **The "Could not connect" screen and the failure notice on Today** reuse
  the auth classes and `notice`. If the designer draws those states
  differently, those two change.
- **The fix in decision 6 stays**, unless the new `lock.css` changes how the
  desktop lead is applied.

### 5. Two applications now describe an entry and a day. Where do they already disagree, or where could they?

The web app's types are in `apps/web/lib/api.ts`: `JournalEntry { id,
content, createdAt }` and `Day { date, mood }`. Nothing checks them against
the API. I disagree mildly with leaving it this way for long, and I say why
at the end.

**Where they already disagree:**

- **The API's entry type has more fields than it sends.** `JournalEntry` in
  the API is the database entity, with `userId`, `dayId`, `user` and `day`.
  Those are never sent, by `select: false` and by not being loaded. The web
  type lists three fields. They agree about what travels, but only the web
  type says so. The API has a written wire type for a day (`DayResponse`) and
  none for an entry.
- **Time.** The API decides the day on its own clock: 4am UTC. The web app
  shows an entry's time on the device's clock. In Karachi an entry written at
  08:30 is filed under the previous day, because it is 03:30 UTC, and that
  day's page will show it at 08:30. Report 15b already raised the boundary.
  The new fact is that it can now be seen as a time that looks out of place.
  The per-user timezone in handover section 12 is the cure, and when it
  arrives the web app should stop using the device's clock for times too.
- **Order.** The API lists newest first. The screen shows oldest first, so
  the web app sorts again. Both are deliberate, and they are two statements
  of an order.

**Where they could:**

- **`mood`.** The web type says `string | null`. The API accepts five exact
  values. The mood row has those five words written a third time, in
  `Journal.tsx`. Wiring the mood row is where this will bite.
- **A new field.** "Keep this out of memory" will add a field to an entry.
  If the API adds it and the web type is not updated, nothing fails. The
  field is ignored silently, which is the worst way to be wrong.
- **The page size.** `LiveToday` has `200` written in it, copied from
  `MAX_PAGE_SIZE` in the API. If the API lowers its maximum, the web app's
  request becomes a 400 and Today shows "Something went wrong on our side".
- **The validation messages.** `AuthForm` recognises two of the API's
  messages by their exact text. If the API rewords one, the person sees the
  developer's sentence. It still appears beside the right field.
- **The password minimum**, 8, is written in both applications.

**My view.** Two hand-written copies are fine for two types on one screen.
They will not stay fine through Timeline, Ask and the Account page. The cheap
next step is one file of wire types that both applications import. It needs
no dependency, only a decision about where it lives. That is the Master
Thread's call, and I would make it before the composer is wired, because the
composer is the first place the web app *sends* an entry.
