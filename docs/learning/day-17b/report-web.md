# Day 17b — Worker report, web: the name, the timezone, the mood words, and four controls that did nothing

**Date:** 2026-10-07. Prompt: `docs/workers/day-17b-web-name-timezone-mood.md`.
Binding decisions: `docs/decisions/ADR-021-what-the-screen-shows-while-waiting.md`
and `docs/decisions/ADR-019-shared-contracts-package.md`.

---

## Objective

Four things, all in `apps/web`.

1. Move the decision "what stops a send" out of the form component, so that
   a test can reach it (the Day 17a audit finding).
2. Create account asks for a name, and sends the browser's timezone with it.
   Both request bodies are given the contract's types.
3. The mood words become a real control.
4. Controls for features that are not built are removed.

`apps/api` was not touched. `packages/contracts` was not touched. Git was not
touched. No dependency was added. `app/styles/lock.css` is the designer's
file, byte for byte (`cmp` exits 0). None of the designer's scripts was run.
The owner's database was not used: its SHA-256 began `38ce8b25` before the
browser check and after it.

---

## Summary

All four parts are built. All nine checks pass.

```
pnpm lint            clean
pnpm typecheck       clean
pnpm build           clean
pnpm test            contracts 7 passed, API unit 242 passed
pnpm test:e2e        API end-to-end 318 passed
pnpm lint:web        clean
pnpm typecheck:web   clean
pnpm build:web       clean
pnpm test:web        contracts 7 passed, web 100 passed   (was 55)
```

Creating an account from the web app works again. It was checked in a real
browser against the real API on a throwaway database.

Seven things need the Master Thread or the owner. The first two matter most.

1. **Mood requests are sent one at a time, and the prompt describes two in
   flight together.** This is the one place I built something other than
   what the prompt describes. Every rule in the owner's decision table
   holds. The reason is that the order two answers come back in does not
   decide what the API has stored. See *The mood requests go one at a time*.
2. **The prompt says the API answers 404 for a mood on a day that does not
   exist. It does not.** The API creates the day. The row is still drawn
   only when the day has an entry, as the prompt asked. See answer 4.
3. **With one destination, the header looked wrong**, and I added one rule
   to `live.css` to correct it. See *The header with one destination*.
4. **The browser counts a name's length the way the API does**, and not
   with `.length`. With `.length` the browser would refuse a name that the
   API accepts. See *The name's length*.
5. **Three existing tests changed**, none of them in `today.test.ts`. See
   *Findings: existing tests that changed*.
6. **The contract has no shape for the body of the mood request.** I could
   not add one, because the prompt keeps `packages/contracts` as the API
   task left it. See answer 4.
7. **I did not measure "all nine checks pass when you start" for the web
   app.** I started the nine checks and began editing before they had
   finished, so the web typecheck in that run saw my half-made change and
   failed. That was my mistake. The five API checks in that run passed
   before I had changed anything they read. For the web app's starting
   state I rely on the API worker's report (55 tests, all four clean).

One more thing I cannot confirm: the prompt says to run only after the API
task is "finished and audited". The API task is finished. Whether it has
been audited is not something a worker can see.

---

## Files

**Changed**

| File | What |
|---|---|
| `apps/web/lib/account-form.ts` | `readForm`, the one decision about what stops a send. The name's rule. `placeMessages`, which says which field a message from the API is about. |
| `apps/web/lib/session.ts` | `register` takes a `WireRegistration`. Both bodies are typed and built one field at a time. |
| `apps/web/lib/today.ts` | `pressMood`, and `moodNotSaved` in the state. |
| `apps/web/app/screens/AuthForm.tsx` | The name field. The timezone read. The component now holds only words and drawing. |
| `apps/web/app/screens/LiveToday.tsx` | Hands the mood, its sentence and the press to the row. |
| `apps/web/app/components/Journal.tsx` | `MoodRow` is a real control. `LiveComposer` has no Record control and no memory option. `SourceMark` and `Segmented` are deleted. |
| `apps/web/app/components/Chrome.tsx` | One destination. |
| `apps/web/app/components/LiveScreen.tsx` | Takes the `Destination` type from `Chrome.tsx`. |
| `apps/web/app/styles/live.css` | One new rule, 5.4. |
| `apps/web/lib/account-form.test.ts`, `session.test.ts`, `today.test.ts` | 46 new tests, and one removed. |

**Deleted:** `apps/web/lib/sample.ts`. Nothing imported it.

**Added:** this report.

Two comments said "4am" and were no longer true after the API task. They
now say "midnight" (`lib/today.ts`, `app/screens/LiveToday.tsx`).

The web app has no formatter of its own. I formatted the files I changed
with the Prettier that `apps/api` already has, using the API's settings,
because the existing web files already follow them. Nothing was installed.

---

## How it works

### Part 1 — what stops a send

`lib/account-form.ts` has one new function:

```ts
readForm(mode, typed, limits): Reading
```

- `mode` is `'in'` (sign in) or `'new'` (create account).
- `typed` is the four values exactly as the person typed them.
- `limits` is the password minimum and the name maximum, handed in from the
  contract, so a test decides them.

The answer is one of two shapes:

```ts
{ send: false, problems, first }   // something is wrong
{ send: true, details }            // nothing is wrong; this is what to send
```

`problems` lists at most one problem for each field, by a short name such as
`notMatching` or `noName`. `first` is the first field with a problem, in the
order the fields are on the screen, which is where focus goes. `details` is
the name and the email with the spaces at their two ends removed, and the
password as typed.

The file still says only what is wrong. The component has one table,
`SENTENCES`, that turns each short name into words.

**Why the answer has two shapes and not one.** The component cannot reach
`details` until it has checked `send`. TypeScript refuses the code
otherwise. So "send although something is wrong" is not something the
component can do by accident.

**The mutation the audit found now fails a test.** Passing `password` as
the confirmation fails four tests. The one that names the fault is:

```
✖ create account: two passwords that differ stop the send, and the second field is the one at fault
```

### Part 2 — the name and the timezone

**The name field** is built from the same markup as the email field:
`.auth-field`, a `label`, `.field-inner`, `input.field`, and `p.auth-help`
for its sentence. It is first, above the email, on create account only.
Measured at 390, 834 and 1440 wide: its box has the same position, width
(256, 330, 444) and height (50) as the email field's, the same eight style
values I compared, the same label style, and the same 14px gap to the next
field. `lock.css` needed nothing new for it.

**The name's rule** is part of `readForm`. The name is trimmed first, so
what is judged is what would be sent. Empty after trimming is `noName`.
Longer than the maximum is `nameTooLong`.

**A 400 from the API** goes through `placeMessages`. A message that begins
with `name `, `email ` or `password ` belongs to that field. A message that
begins with `timezone ` belongs to no field, and becomes one sentence where
failures of the whole form are shown. Anything else is shown as the API
wrote it, as before.

**The timezone.** `session.register` now takes one object, a
`WireRegistration`, and builds the body from it one field at a time:

```ts
const body: WireRegistration = {
  email: details.email,
  password: details.password,
  name: details.name,
  timezone: details.timezone,
};
```

The login body is built the same way, as a `WireLogin`. The function that
sends a request still takes any body at all, so the type on these two
constants is the only thing that connects them to the contract.

The one call to `Intl` is in `app/screens/AuthForm.tsx`, in a function of
one line, `browserTimeZone()`. Nothing under `lib` calls `Intl`. The session
sends what it is handed. If the browser reports nothing, the field is left
out of the body, and the API refuses it.

**`WireUser.name`** needed no code. The session already keeps the whole
user object the API sends. A test now holds that in place. The name is
drawn nowhere.

#### The name's length

The prompt says the browser's `.length` and the API's check can disagree
about an emoji, and that the API's refusal settles it. That is true for a
**minimum**, as with passwords. For a **maximum** it goes the other way.

`.length` counts most emoji as two. The API's check counts them as one. So
with `.length`, a name of 31 emoji would be refused by the browser, and the
API would never be asked, although it accepts that name. The browser must
not be stricter than the authority.

So `lengthOf` in `account-form.ts` counts whole characters (`Array.from`),
and leaves out the two invisible marks that only choose how the character
before them is drawn. I read the API's check in
`node_modules/validator/lib/isLength.js` to match it. My count is never
more than the API's.

Checked in the browser against the real API:

| Name | Browser | API |
|---|---|---|
| 60 emoji | sent | 201, stored |
| 61 emoji | "Enter a name with at most 60 characters.", nothing sent | — |
| 60 letters and two of the invisible marks | sent | 400, and the same sentence appears under the name field |

The third row is the one case I found where the browser accepts and the API
refuses. The API's refusal lands on the name field with the same words, as
the prompt requires.

### Part 3 — the mood words

**What the screen does.** The word the API reports is marked when Today
opens. A press marks the word at once. A press on the marked word clears
it. A failure puts the row back and shows a sentence directly under the
words. Focus stays on the pressed word, because each word is the same
`<button>` before and after.

**How a chosen word looks** is `lock.css`'s:
`.chips button[aria-pressed="true"]` gives the word its colour, a pale
tint, and an underline. With none chosen, all five are plain.

**What a screen reader hears.** Each word is a real `<button>` with
`aria-pressed` set to true or false. A screen reader says "Low, toggle
button, pressed". That does not depend on colour. The failure sentence has
`role="alert"`, so it is read out when it appears.

**Where the logic is.** `pressMood` in `lib/today.ts`, with no React. It
keeps two things apart:

- `fetched.day.mood` is the mood the API last confirmed.
- `wanted` is the mood the person last pressed, until the API has answered
  about it.

The screen shows `wanted` while there is one, and the confirmed mood
otherwise. A failure removes `wanted`, so the row goes back to what the API
holds. Nothing has to be remembered and restored by hand.

#### The mood requests go one at a time

The prompt describes two requests in flight together, and a guard that
ignores the older answer when the answers come back in the other order. I
did not build that, and here is why.

When two requests are sent together, they can reach the API in either
order. The API keeps whichever arrives **last**. The browser cannot know
which that was. So if a person presses Good and then Low, and the Low
request arrives first, the API ends on Good. A guard on the answers would
still leave the screen on Low. The screen and the API would disagree, with
no failure and no sentence, and a reload would show Good. The body of the
request carries no number or time that would let the API tell the two
apart.

So a press that is made while a request is out is marked on the screen at
once, and its request waits for the first one's answer. The API therefore
receives the presses in the order they were made, and what it stores is the
last press.

This is the same rule the session has for refresh ("only one runs at a
time"), for the same kind of reason.

What the owner decided, and what happens:

| The owner's rule | What happens |
|---|---|
| A press marks the word at once. Nothing waits | The mark never waits. Only the *request* of a second press waits, and nobody can see that |
| Pressing the chosen word clears the mood | Yes, and `null` is sent |
| On failure the mark goes back, with a sentence | Yes |
| The last press wins. Good then Low ends on Low | Yes, on the screen and in the API |
| If the first request fails and the second succeeds, the row stays on Low and nothing is undone | Yes, and no sentence is shown |

Two more cases, which the prompt does not name:

- **The first succeeds and the second fails.** The row goes back to Good.
  That is what the API holds, and it is what the row showed before the
  second press.
- **Several presses while one request is out.** Only the last one is sent
  afterwards. The ones between were never the person's final answer.

The cost: if the first request hangs for a long time, the second one waits
behind it. The browser gives up on a dead request in the end, and then the
second is sent.

If the Master Thread wants the prompt's design instead, it is mutation 9 in
the table below: delete the three lines that begin `if (sendingMood)`. Six
tests then fail, and they would need to be rewritten for that design.

**One more guard.** A question about today (`GET /days/today`) can be in
flight while a mood is saved. Its answer may have left the API before the
mood arrived there. If a mood was being sent, or was answered, while the
question was out, the mood already held is kept. A test covers it, and
mutation 6 shows the test can fail.

### Part 4 — what was removed

| Removed | Where |
|---|---|
| The Record control | `LiveComposer` |
| "Keep this out of memory" | `LiveComposer` |
| The links to `/timeline`, `/ask` and `/you` | `Chrome.tsx` |
| `lib/sample.ts` | deleted |
| `SourceMark`, `Segmented` | `Journal.tsx` |

`LiveWaveform` and `LiveRecording` stay.

**`live.css` had no rule that only the removed things used.** I checked each
of its rules. None names `.mic`, `.opt`, `.composer-tools`, `.dest`, `.mark`
or `.seg`. So nothing was removed from it.

---

## Decisions I made

**1. With no words in the field, the composer has no button.** The prompt
left this choice to me and asked me to argue for it.

There were two honest choices.

- **Always draw Save.** With an empty field a press would have to do
  something, so it would show a sentence such as "An entry needs some
  words." That is a button whose only job, most of the time, is to tell the
  person off for pressing it.
- **Draw Save only when there are words to save.** A control is on the
  screen only while a press of it does something.

I chose the second, for three reasons.

- It is the owner's own rule from this prompt, applied once more: a control
  for something that cannot be done is not drawn.
- It is the designer's reasoning too. `lock.css` (revision 12) says "the
  empty state is most of the life of this screen, and a send button sitting
  dead in it is a control that is wrong more often than it is right."
- The designer has already drawn a composer with nothing under the field:
  the 85px composer. Measured at all three widths, the app's composer is
  85px tall and sits at the bottom edge.

The costs, stated plainly:

- **The field gets narrower when the first letter is typed**, because Save
  takes its place beside it. No text moves, since the field holds one
  letter at that moment.
- **Save leaves the page after a save**, because the field is empty again.
  If the keyboard's focus was on Save, it would be left on nothing. So
  focus is moved to the field, which is where the next entry is typed.
  Checked in the browser: Tab from the field reaches Save, Enter saves, and
  focus is then on the field.
- **Text that is only spaces shows no button.** That matches
  `lib/today.ts`, which already sends nothing for such text.

When voice is built, the Record control takes this place back.

**2. One rule in `live.css` for the single destination.** See the next
section.

**3. The session's `login` keeps its two arguments.** Only `register`
takes an object. `register` would otherwise take four pieces of text in a
row, which can be swapped without a compile error. `login` takes two, as it
always has, and leaving it alone meant no existing test of signing in had
to change. Both bodies are typed, which is what the prompt asked for.

**4. `register` builds its body field by field** and does not pass on the
object it was given. The API refuses a body with a field it does not know.
If a caller handed in something extra, such as the second password, the
account could not be created. A test covers this.

**5. The failure sentence under the mood row is `role="alert"`.** The
designer's comp writes `role="status"`. Day 17a's report gave the reason for
`alert` on failures, and I followed it.

**6. A mood press that fails takes no focus and the sentence stays until
the next press.** The next press removes it.

---

## The header with one destination

**Before my rule, it looked wrong at 390 and 834, and slightly wrong at
1440.**

`lock.css` sets the last destination apart from the others, because in
every comp the last one is You. Today is now the only destination, so it is
the first and also the last, and it took You's place.

| Width | Before: where "Today" stood | After |
|---|---|---|
| 390 | At the far right: 311px from the left edge, with 273px of empty margin before it | At the left, 38px, where the first destination is drawn |
| 834 | At the far right: 604px, with 427px of margin | At the left, 177px |
| 1440 | In the binding column, 40px below the date box. The first destination is drawn 20px below it | 20px below the date box |

The rule, 5.4 in `live.css`, is marked TEMPORARY and is deleted when a
second destination arrives:

```css
.dest a:only-child,
.title .dest a:only-child {
  margin-left: 0;
  margin-top: 0;
}
```

**How it looks now.** At 390 and 834 the header is the wordmark, the date
box, and one filled button, "TODAY", alone on its row at the left. At 1440
the binding column is the wordmark, the date box, and one full-width
"TODAY" bar. It is correct, and it is a little odd: a row of navigation
with one place to go, and that place is where the person already is. It
does nothing wrong when pressed (it reloads Today). I would not hide it,
because the row will fill again within a few days, and removing it would
move everything below it up and back down. That is a question for the
owner if she disagrees.

---

## Sentences

### Mine, for the designer

| Sentence | When |
|---|---|
| "Enter your name." | Create account, the name is empty or only spaces |
| "Enter a name with at most 60 characters." | The name is too long. The 60 is `NAME_MAX_LENGTH`, not a written number |
| "This browser did not give us a timezone we can use, so your account was not created. Nothing you typed is wrong. Try again in another browser." | The API refused the timezone. Shown where failures of the whole form are shown |

The label of the new field is "Name".

### The owner's, used word for word

- "Your mood was not saved. We could not reach the server."
- "Your mood was not saved. Something went wrong on our side."

The designer's comp `mood-failed` has a different sentence: "Mood was not
changed. We could not reach the server; the saved mood is still Low. Choose
a mood to try again." The owner approved the two above, so they are used.
The designer should be told.

### Unchanged

"Enter your password." for sign in with no password is the same sentence as
before. It now comes from the table in the component, and the decision that
it applies comes from `readForm`.

---

## Rules added to `live.css`

One: **5.4**, shown above. The heading of section 5 now says "Four things"
where it said "Three things".

---

## Testing performed

### New tests, 46

| Claim | Where |
|---|---|
| `readForm`, create account: nothing wrong; each field's problem alone; two passwords that differ; every field wrong together; too short wins over a mismatch; which field is first | `account-form.test.ts`, six tests |
| `readForm`, sign in: nothing wrong; each problem alone and both together; it asks for no name, no second password and no length | three tests |
| The email is judged and sent trimmed | one test |
| The name: empty and spaces only; exactly the maximum and one over; the maximum is the one handed in; spaces around a valid name; the maximum counted after trimming; an emoji counted as one | six tests |
| The registration body holds the trimmed name and the timezone handed in, from the form to the request | one test, which uses `readForm` and the session together |
| A 400 about `name` lands on the name field. A 400 about `timezone` lands on no field. Several messages at once. A message is placed by its first word | four tests |
| The registration body: its four fields; the timezone, whichever it is; no timezone sends none; nothing extra is sent | `session.test.ts`, four tests |
| The login body | one test |
| The name is carried with the signed-in user, after a login and after a refresh | one test |
| Mood: shown on opening; marked before the answer; a second press clears; another word does not clear | `today.test.ts`, four tests |
| Mood: put back on failure, for no answer, a 500 and a 404; back to none, and a failed clear goes back to the word | four tests |
| Mood: the next press removes the sentence; an ended session leaves no sentence | two tests |
| Mood: the last press wins, in all four ways two requests can end | four tests |
| Mood: several presses send only the first and the last; the same word twice is set and then cleared | two tests |
| Mood: an older answer about today does not undo it; a newer one is believed; a press before today has opened sends nothing | three tests |

No test reaches a React component, and no test framework was added.

### Findings: existing tests that changed

**None in `today.test.ts`.** Its 29 existing tests are unchanged. The
stand-in API at the top of that file gained an answer for the mood route
and can start with a mood. No existing test was edited.

Three changes elsewhere:

| File | Test | Why |
|---|---|---|
| `session.test.ts` | `only login and refresh ask the browser to store and attach the cookie` | It calls `register`, which now takes one object. Only the call changed |
| `session.test.ts` | `a validation failure carries every message the API sent` | The same |
| `account-form.test.ts` | `the length rule belongs to the first field, and the other two to the second` | **Removed.** It tested `fieldOf`, which is gone. `readForm` now decides which field a problem belongs to, and its tests cover the same three facts |

The stand-in API in `session.test.ts` now also records the body of each
request, and its sample user has a name.

### Mutation table

For each row I made the change, ran the web typecheck and the 100 web
tests, recorded what failed, and restored the file. A checksum of every
file was compared before and after. I did not run the five API checks for
each mutation, because nothing they read was changed.

| # | Mutation | Failed | Which |
|---|---|---|---|
| 1 | In `readForm`, pass `password` as the confirmation | **4** | `each field's problem alone`; `two passwords that differ stop the send`; `every field wrong at once`; `the first field with a problem` |
| 2 | Send `'UTC'` as the timezone whatever was handed in | **4** | `a registration carries the email, the password, the name and the timezone`; `the timezone that is sent is the one that was handed in`; `a browser that reports no timezone sends none`; `a name typed with spaces around it reaches the API without them` |
| 3 | Send the name untrimmed | **5** | `spaces around a valid name are not part of it`; `the maximum is counted after the spaces`; `an empty name, and a name of spaces only`; `every field wrong at once`; `a name typed with spaces around it reaches the API without them` |
| 4 | Do not put the mood back when the request fails | **7** | The three `a mood that fails … goes back to what it was`; `back to none, and a clear that fails`; `the next press takes the sentence away`; `the first succeeds and the second fails`; `both requests fail` |
| 5 | Remove the guard that makes the last press win | **6** | Both `the last press wins` tests; `the first succeeds and the second fails`; `both requests fail`; `several presses`; `the same word pressed twice` |
| 6 (mine) | An older answer about today replaces the mood | **1** | `an answer about today that left the API before the mood was saved does not undo the mood` |
| 7 (mine) | Count the name with `.length` | **1** | `a character the API counts as one is counted as one here` |
| 8 (mine) | Pressing the chosen word sends the word again | **2** | `pressing the chosen word a second time clears the mood`; `the same word pressed twice` |
| 9 (mine) | A press made while a request is out is sent at once, beside it | **6** | The same six as mutation 5 |
| 10 (mine) | A message about the timezone is treated as any other | **2** | `a 400 about the timezone lands on no field`; `messages about several fields` |

On mutation 5: in my design the guard is three lines, `if (wanted !==
sent) { continue; }`. Without it, the answer to the older press is treated
as the answer to the newest one, and the newer press is never sent.

### The compile-time proof

Each change was made, `pnpm typecheck:web` was run, and the file was
restored.

| Change | Result |
|---|---|
| Remove `timezone` from the registration body | `lib/session.ts(343,11): error TS2741: Property 'timezone' is missing … but required in type 'WireRegistration'.` |
| Remove `password` from the login body | `lib/session.ts(325,11): error TS2741: Property 'password' is missing … but required in type 'WireLogin'.` |
| Add a field `locale` to `WireRegistration` in the contract | `lib/session.ts(343,11): error TS2741: Property 'locale' is missing …`, and seven more errors, one in `AuthForm.tsx` and six in the tests |
| Add a field `device` to `WireLogin` in the contract | `lib/session.ts(325,11): error TS2741: Property 'device' is missing …` |

The contract file was changed for the last two rows only for the length of
the check, and its checksum was the same afterwards.

### In a real browser

A second copy of the API ran on port 3100 with a throwaway database, built
by running the eleven migrations against an empty file in my scratch
directory. A second copy of the web app ran on port 3101. Headless Chromium
151 was driven with Node's built-in WebSocket. Ports 3000 and 3001 were not
used. All three processes were stopped afterwards. The scripts are in my
scratch directory and are not in the repository.

**Creating an account.**

| Step | Result |
|---|---|
| The fields on create account, in order | Name, Email, Password, Confirm password |
| Sign in has a name field | No |
| Press with everything empty | "Enter your name.", "Enter an email address.", "Enter a password with at least 8 characters." Focus is in the name field, which is marked invalid and points at its sentence |
| Type in the name field | Its sentence leaves. The others stay |
| A name of three spaces | "Enter your name." |
| A name of 61 letters | "Enter a name with at most 60 characters." Still on `/new`. Nothing sent |
| Two passwords that differ | "The passwords do not match. Enter the same password in both fields." Nothing sent |
| A name typed as `  Walk Er  `, everything else good | Arrives on Today |

The body that was sent:

```
{"email":"walk@example.com","password":"correct horse","name":"Walk Er","timezone":"Asia/Karachi"}
```

The rows in `users` afterwards (the second and third are from the checks
below):

```
email               name            timezone
walk@example.com    Walk Er         Asia/Karachi
la@example.com      Lo San          America/Los_Angeles
emoji@example.com   60 characters   Asia/Karachi
```

The name is drawn nowhere on Today.

**The timezone comes from the browser.** With the browser told it is in Los
Angeles, the body carried `America/Los_Angeles`, and that is what was
stored.

**A browser with no usable timezone.** I made the page's `Intl` report
nothing, and then an offset, `+05:00`.

| The browser reports | Body sent | Result |
|---|---|---|
| nothing | no `timezone` field at all | Still on `/new`. The whole-form sentence, as an alert. No field has a sentence. Everything typed is still in the form. No account was created |
| `+05:00` | `"timezone":"+05:00"` | The same |

One thing to say exactly: I reworded that sentence after this run, from
"did not tell us your timezone" to "did not give us a timezone we can
use", because the first wording was untrue for the offset case. The browser
run saw the first wording. The change is one constant, and the nine checks
were run after it.

**Today.**

| Step | Result |
|---|---|
| Empty Today | The composer holds the field and no button. No mood row. The only links on the page are "Today". "Keep this out of memory" is not on the page |
| Type "Priya rang." | Save appears |
| Replace it with three spaces | Save leaves |
| Tab from the field, then Enter | Focus was on Save. The entry is saved. Save leaves, and focus is on the field |
| The mood row | Light Good Even Low Hard, none chosen |
| Tab from the delete icon, six times | Light, Good, Even, Low, Hard, then the field |
| Enter on Good | Good is chosen. Focus is on Good |
| Space on Low | Low is chosen and Good is not. Focus is on Low. Low is underlined, in its own colour, with `aria-pressed="true"` |
| The requests | `PUT /days/2026-10-07/mood {"mood":"Good"}`, then `{"mood":"Low"}` |
| Reload | Low is still chosen |
| Press Low again | None chosen. After a reload, still none |

**A mood press with the API stopped.** Even was the saved mood. I stopped
the API and pressed Hard with the keyboard. The row was watched for every
change:

```
1.  Light Good Even Low Hard*      at once, before any answer
2.  Light Good Even* Low Hard      when the request failed
```

Directly under the words, as an alert: **"Your mood was not saved. We could
not reach the server."** Focus was still on Hard.

One thing to know when looking at it: the word that has the keyboard's
focus keeps a tint, because `lock.css` draws focus on a mood word that way.
So after a failed press by keyboard, Hard is tinted with a focus ring, and
Even is tinted and **underlined**. The underline and `aria-pressed` are
what say which is chosen. That is the designer's rule ("Labels and
underlining carry meaning independently of color").

**Sign in against its comp.** Each cell is "elements the same, of elements
paired". Two elements are the same when position and size agree within
0.6px, 29 computed style values are equal, and the text is equal. The
method is Day 17a's: the comp's stage, "Forgot your password?" and the
"Prototype states" disclosure were removed from the comp in the browser's
memory only.

| | 390 | 834 | 1440 |
|---|---|---|---|
| Sign in, `13-login.html` | 35 of 35 | 42 of 42 | 42 of 42 |

Identical at all three. (Day 17a counted 34, 41 and 41. My count includes
the `.app` element itself.) To show the measurement can fail, I ran the same
script on create account against `14-register.html`: 11 of 39 the same at
390, as expected, since every field after the new one is 87px lower.

---

## Limitations

- **The mood row leaves the page when the last entry of the day is
  deleted**, although the day still has its mood. That is "as now", and the
  prompt asked for it. Writing a new entry brings the row back with the mood
  still chosen.
- **A person who presses a mood and closes the tab at once** may lose the
  press without ever seeing a sentence. See answer 1.
- **The mood is not asked for again after a failure.** The row goes back to
  the last mood the API confirmed to this page. If another tab changed it
  meanwhile, the row is behind until Today is asked for again, which happens
  whenever the tab is looked at again.
- **Create account is still two requests**, register and then sign in.
  Unchanged from Day 17a.
- **`browserTimeZone()` is one line in a component, and no test reaches
  it.** A mistake there (for example, a written `'UTC'`) would pass every
  check. The prompt's rule that nothing under `lib` may call `Intl` puts it
  there. The browser check above is what covers it.
- **Chromium only**, as on Day 17a.
- **`today-loading` and hover were not measured**, as on Day 17a.

---

## Dependencies added

None.

---

## Answers

### 1. The owner chose that a mood shows at once. Is there a case where that is worse for the person than waiting?

**Yes, there is one, and I still believe the owner's choice is right.**

The case: a person presses a word and closes the tab, or locks the phone,
straight away. The word was marked. They leave believing it was saved. If
the request had not finished, the browser may drop it, and there is nobody
left to show the sentence to. With "wait, then show", the word would not
have been marked yet, and they might have waited a moment longer.

A second, smaller case is the one Day 17a raised for delete: the sentence
appears under the row, and on a long day the person may have scrolled away
from it.

Why I still agree with showing at once:

- **The cost of being wrong is small.** A lost delete can mean a private
  entry the person believes is gone. A lost mood means one word is missing
  tomorrow, and it can be chosen again.
- **The cost of waiting is paid on every press.** Mood is the lightest act
  in the product. A person presses one word, and may press another a second
  later because the first was not quite right. A row that answers late
  feels broken, which is exactly what the owner reported on Day 17.
- **The screen needs nothing from the API to show it.** That is ADR-021's
  own test. The word is the person's and is already known.

What would change my mind: evidence that people do lose moods this way.
The repair would not be to wait. It would be to send the request in a way
the browser finishes even after the page closes (`fetch` has an option for
this, `keepalive`).

### 2. A browser that reports no usable timezone cannot create an account. How likely is that, and is the sentence enough?

**For a browser that reports nothing at all: close to impossible.** Every
browser has answered this question since about 2017. A browser too old to
answer it also cannot draw this app, which depends on much newer CSS.

**There are three more likely cases, and the sentence is good for only one
of them.**

| Case | What happens | Is the sentence enough? |
|---|---|---|
| The browser reports a value the API does not accept, such as `Etc/Unknown`. Chromium can report that when it cannot work out the system's timezone. I checked: this machine's Node refuses it | 400, and my sentence | Mostly. "Try again in another browser" is fair advice, though the real cause may be the device's settings |
| The browser knows a newer timezone name than the API's Node does. Timezone names change: a city is renamed, or a region gets its own | 400, and my sentence | **No.** Every browser on that device will report the same name. The advice does not help, and the person can do nothing. The fix is on the server |
| A privacy tool makes the browser report `UTC` for everyone | **No refusal.** The account is created in `UTC`, and the person's day ends at the wrong hour, silently | The sentence is never shown. This is the case the owner's "no default" rule was meant to stop, arriving by another road |

So: the sentence is honest, and I would keep it. It is not enough. What is
missing is the same thing the API report found missing: **a way to set the
timezone after registration.** With a settings route, the second and third
cases have a repair. Without one, a person in either case is stuck, or
wrong without knowing it. I would also not treat the third case as rare.

### 3. What did I use that the owner has not been taught?

**In React:**

- **`useRef`.** A box that keeps one value for the life of a component.
  Changing it does not make React call the component again, which is the
  difference from `useState`. I use it in `LiveComposer` in two ways: to
  hold the field's element so that `.focus()` can be called on it, and to
  remember whether Save was on the page the last time the component was
  drawn. The existing code (`LiveEntry`, `AuthForm`) already uses it in
  both ways, so it is not new to the codebase. It is not in the list of
  what she knows.
- **`aria-pressed`.** An attribute that tells a screen reader that a button
  is a switch, and whether it is on. It was already on these buttons, always
  saying `false`. Now it is true for the chosen word.
- **`role="alert"`.** Tells a screen reader to read the text out as soon as
  it appears. Already used elsewhere on this screen.

**Not React, and worth a few minutes each:**

- **A loop with `await` inside it** (`pressMood` in `lib/today.ts`). Each
  time round, the loop sends one request and stops until the answer
  arrives. That is what makes the requests go one at a time. It is the
  heart of Part 3 and the least familiar thing in this task.
- **A function that answers one of two shapes** (`readForm`). TypeScript
  then makes the caller check which shape it has before using what is
  inside. The session's `ApiResult` already works this way.
- **`Array.from(text)`** to count whole characters, where `.length` counts
  an emoji as two.
- **`??=`**, which sets a value only if nothing is there yet. Used once, to
  keep the first message about a field.
- **`Intl.DateTimeFormat().resolvedOptions().timeZone`.** How a page asks
  the browser which timezone the device is in.

### 4. Anything in this prompt that was wrong, contradicted itself, or assumed something that is not true

**a. "The API answers 404 for a mood on a day that does not exist."** It
does not. `apps/api/src/days/days.controller.ts` says, above the route:
"Setting a mood creates the day if it does not exist, which is the one
place a day is born without an entry." I read the code and did not send the
request. The row is drawn only when the day has an entry, as the prompt
asked, but that is a choice about the screen and not something the API
forces. If the owner wants a mood on a day with no entries, the API already
allows it.

**b. "The last press wins … the two answers come back in the other
order."** This treats the order of the answers as the thing to guard. The
thing that matters is the order the requests *arrive* in, which the browser
cannot see. Explained in full under *The mood requests go one at a time*.
The prompt calls it "the same kind of problem as the stale answer about
today". It is close, with one difference: a stale *read* can be thrown
away and nothing is lost. A stale *write* has already changed what is
stored.

**c. The name and `.length`.** The prompt says the API's refusal settles a
disagreement about an emoji. For a maximum, the browser's `.length` refuses
first and the API is never asked. See *The name's length*.

**d. "Remove the styles in `live.css` that only the removed things used."**
There were none.

**e. The prompt did not say what `lock.css` does to the last destination.**
It asked whether the header would look wrong, which was the right question.
It did look wrong, and one rule was needed.

**f. The contract has no shape for the mood request's body.** ADR-019's
rule is that each body the web app sends has a `Wire…` interface, and the
API's DTO says it implements it. There is `WireNewEntry`, `WireLogin` and
`WireRegistration`. There is nothing for `PUT /days/:date/mood`. In
`lib/today.ts` the body is typed in place as `{ mood: Mood | null }`. That
is the same silent gap this prompt closed for registration, one request
further on. It needs a `WireMood` in the contract and one word on the API's
`SetMoodDto`, which is an API task.

**g. "Nothing under `lib` may call `Intl`" has a cost the prompt did not
name.** It moves the one line that reads the timezone into a component,
where no test can reach it. See *Limitations*. I think the rule is still
right, because the alternative is a `lib` file that cannot be tested with
Node alone.

**h. The prompt's precondition cannot be checked by the worker.** "Run this
only after the API task … is finished and audited." Nothing in the
repository records an audit.

**i. Not wrong, and worth saying.** The designer has drawn `mood-failed`
with her own sentence, and the prompt gives the owner's. Both cannot be
right, and the designer does not know yet.

---

## What the owner should look at first

1. *The mood requests go one at a time*, and whether she accepts it.
2. Answer 2, because it argues for a settings route sooner than planned.
3. The composer with no button, on a real phone. Whether the on-screen
   keyboard comes back after a save by touch is something headless Chromium
   cannot tell me.
