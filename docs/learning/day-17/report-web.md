# Day 17 — Worker report, web: write an entry, delete an entry

**Date:** 2026-10-07. Prompt: `docs/workers/day-17-web-write-and-delete.md`.
Binding decision: `docs/decisions/ADR-021-what-the-screen-shows-while-waiting.md`.

---

## Objective

Three faults the owner found as the product's first real user, all on the
web app.

1. She could not type into the composer. The composer now sends a typed
   entry to `POST /entries`.
2. She could not remove an entry. Each entry on Today can now be deleted,
   after being asked once, in place.
3. She pressed "Try again" and saw no sign that the press was received. A
   press now always shows a line while it is asking, and a count when the
   answer is the same failure.

`apps/api` was not touched. Git was not touched. No dependency was added.
`app/styles/lock.css` was not edited. The owner's database and her two
running servers (ports 3000 and 3001) were not used.

---

## Summary

All four parts are built, tested, and checked in a real browser against a
throwaway database.

```
pnpm lint:web && pnpm typecheck:web && pnpm build:web && pnpm test:web
lint        clean
typecheck   clean
build       clean
contracts   6 passed
web tests   41 passed   (was 15)
```

All four required mutations make tests fail. The table is under *Testing
performed*.

Five things need the Master Thread's or the owner's attention.

1. **A new design folder arrived while I was working, and it draws what this
   task said was not drawn.** `designs/AIJournal-handover/` was replaced by
   `designs/AIJournal-v3/` at about 17:16. I did not do this and did not
   touch either folder. The new file `18-entry-system-states.html` draws the
   delete control, the question, and the failure states. See *Findings*.
2. **I changed `lib/session.ts`, which the prompt did not name.** The
   could-not-connect screen could not show "asking again" without it. See
   *How it works*, Part 3.
3. **The words of an entry are sent without the spaces and blank lines
   around them.** This is my decision and the owner can overrule it. See
   *Decisions made*, item 1.
4. **A failed delete can still be missed if the person has scrolled away.**
   The designer's rules leave me no honest way to prevent that. See
   question 3.
5. **Two controls in the composer still do nothing when pressed:** the
   record control and "Keep this out of memory". Both were already like that
   and both are outside this task. They are the only dead controls on the
   screen.

---

## Files changed

**New**

| File | What it is |
|---|---|
| `apps/web/lib/today.ts` | The logic of the Today screen. Plain TypeScript, no React. |
| `apps/web/lib/today.test.ts` | 25 tests for it, run with Node alone. |
| `docs/learning/day-17/report-web.md` | This report. |

**Changed**

| File | Change |
|---|---|
| `apps/web/app/screens/LiveToday.tsx` | No longer holds any logic. It asks `lib/today.ts` what to draw. All the sentences of this screen are here. |
| `apps/web/app/components/Journal.tsx` | Two new components, `LiveEntry` and `LiveComposer`. The components the review pages use are unchanged. |
| `apps/web/app/screens/CouldNotConnect.tsx` | Shows "Asking again." and the count. |
| `apps/web/app/screens/AuthForm.tsx` | One line: it passes the two new values to `CouldNotConnect`. |
| `apps/web/lib/session.ts` | Asking again after no answer no longer blanks the screen. The state says that it is asking, and how many times it has asked. |
| `apps/web/lib/session.test.ts` | One expectation updated, one test added. |
| `apps/web/app/styles/live.css` | One new block, marked TEMPORARY, for the textarea and the delete control. |

---

## How it works

### Part 4 first — where the logic lives

`lib/today.ts` is built the same way as `lib/session.ts`. One function,
`createToday`, is given two things: the function that sends a request, and
the size of a page. It returns an object with a state and a few actions.

```ts
today.getState()      // everything the screen needs to draw
today.open()          // ask the API for today
today.type(text)      // the person typed
today.save()          // the person pressed Save
today.askToDelete(id) // the person pressed Delete
today.keep()          // the person chose to keep the entry
today.goAhead()       // the person chose to delete it
```

The state is one plain object:

```ts
{
  day,         // 'opening', or 'open' with its entries, or a failure
  asking,      // true while a question about today is in flight
  text,        // what is in the composer
  save,        // 'idle', 'saving', 'saved', or 'notSaved' with the reason
  confirming,  // the id of the entry being asked about, or null
  notDeleted,  // which entries came back after a failed delete, and why
}
```

The components read this object and draw it. They decide nothing. For
example, `LiveToday` does not know that a second press must be ignored. It
calls `today.save()` every time, and `today.ts` decides.

The file imports only types, so the tests run with Node and nothing else, as
the session tests do.

### Part 1 — writing an entry

The composer's field is now a real `<textarea>`. It was a `<div>` copied
from the design file, which is why it could not be typed into.

**One control, two states**, as the design specifies. While the field holds
no words the control is the record control. Once it holds at least one
character that is not a space, the control reads **Save**. Text of only
spaces or blank lines leaves it as the record control.

What `save()` does, in order:

1. If a save is already in flight, it returns. Nothing is sent. This is the
   guard, and it is in the code because no control is disabled.
2. If the text is blank, it returns. Nothing is sent.
3. It sets `save` to `'saving'`. The screen shows **"Saving."** The text is
   not touched.
4. It sends `POST /entries`. The body is typed as the contract's
   `WireNewEntry`.
5. **If the answer is not a success**, `save` becomes `'notSaved'` with one
   of four reasons, and the text is exactly as it was. The four reasons are
   kept apart: no answer (`unreachable`), a refusal by the server
   (`refused`), the server's 400 for a body with no words (`blank`), and an
   ended session (`ended`).
6. **If the answer is a success**, the text is cleared, `save` becomes
   `'saved'`, and the API is asked for today again. The entry is not added
   to the page by the browser. When today arrives, `save` returns to
   `'idle'`.

An ended session has no sentence on this screen. The session module has
already recorded that the person is signed out, the screen leaves for the
sign-in page, and that page says "Your session has ended." The text is lost
at that point, which ADR-021 accepts until Day 18.

### Part 2 — deleting an entry

Under each entry there is a quiet control that reads **Delete**.

- **Pressing it asks first, in place.** The sentence "Delete this entry?
  This cannot be undone." appears under the entry's words, with two
  controls: **Keep entry** and **Delete entry**. The entry's words stay
  visible, so the person can see what they are about to delete.
- **Keep entry** returns the row to exactly how it was. A test compares the
  whole state before and after, and in the browser I compared the page's
  markup.
- **Delete entry** hides the entry at once and sends `DELETE /entries/:id`.

**How "at once" works, and why a failed delete cannot put the entry in the
wrong place.** The entry is never removed from the list the API gave. Its
id is added to a set named `hidden`, and the screen shows the list without
the hidden ids. If the delete fails, the id is taken out of the set. The
entry was never moved, so there is no position to get wrong. If the delete
succeeds, or the API answers 404, the id simply stays in the set.

That set also closes a second gap. Suppose the screen asked for today, then
the person deleted an entry, and then the first answer arrived, still
containing that entry. Because the id is still hidden, the entry does not
come back. A test covers this.

- **A failure** shows a bordered notice inside the entry's row. It has
  `role="alert"`, which makes a screen reader announce it. It stays until
  the person presses Delete on that entry again.
- **A 404** leaves the entry gone and says nothing.
- **Deleting the last entry** leaves "What's today been like?" That needed
  no code: it is what an open day with no shown entries already draws.

**Protection against a mis-tap.** One press can never delete. And the
control that goes ahead does not appear where the first press landed: the
**Delete** button itself turns into **Keep entry**, in the same place. So a
double tap, or two presses of Enter, asks and then keeps. I checked in the
browser that keyboard focus stays on that button through both changes.

### Part 3 — a press is always seen

There are two "Try again" buttons, and they were broken in two different
ways.

**On Today's failure notice.** The press used to replace the notice with
"Opening today." and then put the same notice back. With the server down
that takes a few thousandths of a second, so nothing appeared to happen.
Now the notice stays, the line **"Asking again."** appears inside it while
the question is in flight, and when the same failure comes back the
sentence ends with **"Asked 2 times."**, then 3, and so on. A second press
while it is asking sends nothing.

**On the could-not-connect screen.** This one needed a change to
`lib/session.ts`. Asking again used to set the session's state back to
`unknown`, and both screens draw `unknown` as blank paper. So the screen
went blank and came back. Now the state stays `unreachable` while it asks,
and carries two new values:

```ts
{ status: 'unreachable', asking: boolean, asked: number }
```

The screen draws "Asking again." and "Asked 2 times." from those. The
session's four rules are unchanged, and all its tests pass.

---

## Decisions made

**1. The entry is sent without the spaces and blank lines at its two ends.**
A person who presses Enter after their last sentence did not mean to store
an empty line. Spaces and line breaks inside the text are kept exactly. The
other choice was to send every character as typed. I chose trimming because
entries are now shown with their line breaks (decision 2), and an untrimmed
entry would show empty lines under itself. This changes what is stored, so
it is the owner's to overrule.

**2. An entry typed on several lines is shown on several lines.** Until
today no entry could contain a line break, so the page ran all of an
entry's text together. One CSS rule in the TEMPORARY block changes that.

**3. Words typed while a save is in flight are not cleared with it.**
Nothing is disabled, so a person can keep typing while "Saving." is shown.
When the save succeeds, only the part that was sent is removed.

**4. A question about today that is superseded is thrown away.** After a
save the API is asked for today again. If an older question is still in
flight, its answer could be missing the new entry, so only the newest
question's answer is used.

**5. A count, and not a short fixed delay, shows that "Try again" asked.**
The other way is to keep "Asking again." on the screen for half a second
even when the answer has already arrived. That is easier to see, and it is
untrue for that half second. ADR-021's whole argument for writing is that
the screen never shows anything untrue, so I chose the count. I am not
certain this is right. See *Limitations*.

**6. `Today` is created once each time the screen opens, and not once for
the page.** The session is one for the page. If the Today logic were too,
text one person had typed would still be in the composer after a different
person signed in.

**7. The delete question is held in `lib/today.ts`, and deleting is only
possible through it.** There is no `delete(id)` action. `goAhead()` deletes
the entry that `askToDelete` named, and does nothing if none was named. So
no component can skip the question by mistake.

**8. Save has no keyboard shortcut.** The designs name none. Enter in the
field makes a new line. Save is reached by Tab and then Enter.

---

## Assumptions

- "Each entry on Today" means typed entries. Recordings do not exist in the
  product yet.
- After a failed delete, the sentence should stay until the person acts on
  that entry. It does not time out, because a message that leaves by itself
  is a toast.
- If today cannot be shown again after a successful save, the person should
  be told the entry was saved. The failure notice then begins "Your entry
  was saved."

---

## Limitations

- **Not part of this task, as the prompt requires me to say:** recording,
  the "Keep this out of memory" option, drafts, saving as the person types,
  and keeping typed text across a sign-in. The last three are Day 18. The
  record control and the memory option are drawn and do nothing.
- **A failed delete is in place only.** If the person scrolled away, it is
  off the screen. See question 3.
- **"Asking again." can be on the screen too briefly to read** when the
  server refuses the connection at once. The count is what remains.
- **The field grows with the text only in browsers that support the CSS
  property `field-sizing`.** Chromium does. In Firefox the field stays one
  line tall and scrolls. Nothing is lost, and `PROJECT.md` section 0.2
  rule 9 accepts this kind of difference, but it should be seen.
- **The components themselves have no automated tests.** The logic is
  tested, and the components were checked by hand in the browser walk.
- **The browser walk was done before I changed five sentences to the new
  design's wording.** After that change I ran lint, typecheck, build and
  the tests, and did not repeat the walk. Only strings changed.
- **I checked at 1440 wide only.**

---

## Dependencies added

None.

---

## Testing performed

### Claims, and where each is tested

All in `lib/today.test.ts`, except the last row. The tests use a stand-in
for the API that can hold an answer back until the test releases it. That
is how "before any answer" is tested.

| Claim | Test |
|---|---|
| A save that succeeds clears the text | `a save that succeeds clears the text, and only after the API has answered` |
| A save that fails leaves the text as typed, for each of the three reasons | Three tests, one each for no answer, a refusal, and an ended session. A fourth for the 400. |
| Two presses while a save is in flight send one request | `two presses while a save is in flight send one request` |
| Text of only spaces sends nothing | `text of only spaces and blank lines sends nothing` |
| The entry comes from the API, not from the browser | `after a save the entry comes from the API…`. The stand-in gives the entry an id the browser could not know. |
| A delete removes the entry at once, before any answer | `a delete removes the entry from the list at once…` |
| A failed delete puts the entry back at the same position | Two tests. Three entries, the middle one deleted. |
| A delete answered with 404 leaves the entry gone | `a delete answered with 404 leaves the entry gone, and nothing is said` |
| Two deletes, only the first fails | `of two entries deleted one after the other…` |
| Keeping returns the screen to how it was | `asking first changes nothing in the list…` |
| Deleting the last entry leaves an open, empty day | `deleting the last entry of today…` |
| An old answer cannot bring a deleted entry back | `an answer that left the API before the delete…` |
| "Try again" says it is asking, sends one request for two presses, and counts | `asking again says so while it asks…`, and its twin in `lib/session.test.ts` |

### Mutation table

For each row I made the change, ran typecheck and the Today tests, recorded
the failures, and restored the file. A script did this and then compared
the restored file with a copy.

| # | Mutation | Typecheck | Tests failed | Which |
|---|---|---|---|---|
| 1 | Clear the composer before the answer arrives | passes | **6** | The success test, all three failure tests, the 400 test, and "saving is still available". |
| 2 | Remove the guard against a second press | passes | **1** | `two presses while a save is in flight send one request` |
| 3 | On a failed delete, put the entry back at the end | passes | **3** | Both "same position" tests, and the two-deletes test. |
| 4 | Treat a failed delete as a success | fails, see below | **4** | Both "same position" tests, the two-deletes test, and "pressing delete again". |

Two honest notes.

**Mutation 3 had to be added, not made.** The code has no line that puts an
entry back, so there was nothing to change. I had to write four new lines
that move the entry to the end. That is the point of the `hidden` set: the
mistake cannot be made by changing a line that exists.

**Mutation 4 failed typecheck only because of how I wrote it.** I wrote
`if (gone || !gone)`, and TypeScript then noticed that the lines after it
could never run. A mutation written differently would compile. The four
failing tests are what catch it.

### In a real browser

I did not use the owner's servers. I started the API on port 3910 with a
new, empty database in a temporary folder, and the web app on port 3911,
built to call 3910. I drove a headless Chromium (a browser with no window)
with a short script. Afterwards I stopped all three, deleted the database,
and rebuilt the web app with its normal settings.

| Step | What I saw |
|---|---|
| New account | Today, empty state, control is the record control. |
| Typed only spaces and blank lines | Control stayed the record control. Submitting sent nothing: no row in the database. |
| Typed two lines, pressed Save | The entry appeared with its time, `17:22`, on two lines. The field was empty afterwards. |
| Stopped the API, typed, pressed Save | The notice appeared above the field. The text was still in the field. The control still read Save. |
| Started the API, pressed Save again | The entry appeared. |
| Pressed Delete on the middle of three | The question appeared under that entry's words. Keep returned the markup to exactly what it was. |
| Chose to delete | The entry left. In the database the row is still there with `deleted_at` set to `2026-10-07T12:22:35.478Z`. The other two rows have `deleted_at` empty. |
| Stopped the API, deleted the first entry | It returned to first position with its notice. Its row in the database was unchanged. |
| Reloaded with the API stopped, pressed Try again twice | "Could not connect", then "Asked 2 times.", then "Asked 3 times." |
| Started the API, deleted both remaining entries | "What's today been like?" All three rows still in the table, each with `deleted_at` set. |

---

## Findings

**1. The design folder changed during this task.** When I started,
`designs/AIJournal-handover/` held the files the prompt told me to read,
and I read them. Near the end, `git status` showed that whole folder
deleted and a new one, `designs/AIJournal-v3/`, in its place. Its own
`V3-REVISION.md` says it supersedes the earlier documents.

It matters here because `desktop-web/18-entry-system-states.html` draws
exactly what the prompt said was not drawn yet:

| | What v3 draws | What I built |
|---|---|---|
| The control at rest | An icon on the entry's first line, shown on hover or focus | The word "Delete" under the entry's words |
| The question | "Delete this entry? This cannot be undone." | The same sentence. I had written the same words before seeing it. |
| The two controls | "Delete entry" (quiet), then "Keep entry" (solid) | The same words and grades, in the other order. See below. |
| Not deleted | "We could not reach the server. The entry is still here." with "Try again" and "Keep entry" | The same sentence, in a notice, with the ordinary Delete control under it |
| Not saved | "We could not reach the server. Your entry was not saved. Your words are still here; try saving again." | The same sentence |

I took the designer's wording wherever v3 supplies it. I did not take the
layout, because it uses classes (`entry-actions`, `entry-confirm`) from a
new `lock.css` that the app does not hold, and the app's `lock.css` may not
be edited. Bringing in the new stylesheet is its own task.

**The order of the two controls is a real difference, and it should be
decided, not copied.** In v3 "Delete entry" comes first. In v3 that is
safe, because the icon that opens the question is somewhere else. In my
temporary layout the first position is where the person's finger already
is, so I put "Keep entry" there. When the v3 layout is built, v3's order is
fine.

**2. Reading a day's entries can loop forever if the API misbehaves.**
`fetchToday` asks for pages until one comes back shorter than a full page.
My first stand-in API ignored `offset` and always returned a full page, and
the test run used all its memory. The real API does not do this, and the
loop was there before today. A cap on the number of pages would make it
safe. I did not add one because it is outside the task.

**3. The designs say the draft "persists on every keystroke".**
`direction-lock.md` section 7.4. That is Day 18. Until then, text in the
composer is lost on a reload.

---

## Sentences I had to write, for the designer

"v3" in the last column means the sentence is the designer's own, taken
from `18-entry-system-states.html`.

| Where | Sentence | Source |
|---|---|---|
| Composer, while saving | "Saving." | Mine |
| Composer, saved and today being fetched again | "Saved. Opening today again." | Mine |
| Composer, no answer from the server | "We could not reach the server. Your entry was not saved. Your words are still here; try saving again." | v3 |
| Composer, server error | "Something went wrong on our side. Your entry was not saved. Your words are still here; try saving again." | Mine, on v3's pattern |
| Composer, the server's 400 | "An entry needs some words. Your entry was not saved." | Mine |
| Entry, the control at rest | "Delete" | Mine. v3 draws an icon. |
| Entry, the question | "Delete this entry? This cannot be undone." | v3 |
| Entry, to keep | "Keep entry" | v3 |
| Entry, to go ahead | "Delete entry" | v3 |
| Entry, not deleted, no answer | "We could not reach the server. The entry is still here." | v3 |
| Entry, not deleted, server error | "Something went wrong on our side. The entry is still here." | Mine, on v3's pattern |
| Today failure notice, while asking | "Asking again." | Mine |
| Today failure notice, same failure again | "Asked 2 times." added to the end | Mine |
| Today failure notice, after a save | "Your entry was saved." added to the start | Mine |
| Could not connect, while asking | "Asking again." | Mine |
| Could not connect, same failure again | "Asked 2 times." added to the end | Mine |

One mismatch I did not fix because it is from an earlier day: Today says
"Could not connect. We could not open today." and v3 says "We could not
reach the server. Try loading this day again."

---

## The four questions

### 1. Which React features go beyond the three the owner knows?

Two in the code I wrote today, and one small trick that is not a feature
but should be explained.

**`useSyncExternalStore`.** `useState` keeps a value inside React. This
hook is for a value that lives outside React, here inside the object that
`createToday` returns. You give it two functions: one that says "call me
when the value changes", and one that says "here is the value now". React
then calls the component again whenever the value changes, exactly as it
does for state. It was already used once in the project, in `useSession`,
for the same reason.

**A function passed to `useState`.** `useState(() => createToday(...))`.
The owner knows `useState(0)`. When the starting value is given as a
function, React calls that function once, the first time the component is
drawn, and never again. Without the function, `createToday` would run on
every redraw and each result but the first would be thrown away.

**The trick: one button that changes.** React decides whether to keep an
element or make a new one by its position among its siblings. "Delete" and
"Keep entry" are written as one `<button>` whose text and class change, so
React keeps the same element on the page, and the keyboard's focus stays on
it. Written as two buttons, one shown at a time, the first would be removed
and focus would be lost. The composer's control uses the same idea.

Already in the project and unchanged: `useRef` in `AuthForm`, and
`useRouter` from Next.

I did not use `useOptimistic` or `useTransition`, which are React's own
tools for "show at once". They are built for Next's server actions, which
this app does not use, and they would have put the part that can be wrong
inside React, where Part 4 says it should not be.

### 2. What does the person see during the second request, and is it acceptable?

In order:

1. They press Save. **"Saving."** appears above the field. Their text is
   still in the field.
2. The API confirms. The field empties, and the line changes to **"Saved.
   Opening today again."** The new entry is not on the page yet.
3. Today arrives. The entry appears with its time, and the line goes.

So for the length of the second request, the field is empty and the entry
is not yet shown. The line is what covers that gap. On the throwaway setup
the gap was too short to see.

**I think it is acceptable, with one disagreement about cost.** It is
acceptable because nothing is untrue at any moment and the words are never
in neither place without an explanation. The cost is that the screen asks
for the day and then for every entry of the day again, to show one new
entry. That is two requests at least after every save. It is the price of
the rule "the browser never decides the day", and I think the rule is worth
it. A cheaper way to keep the rule would be for `POST /entries` to answer
with the entry and the date of its day. The browser could then add the
entry only if that date is the one on the screen. ADR-021's "Revisit when"
already points at this.

If the second request fails, the person sees the ordinary failure notice
beginning "Your entry was saved.", with Try again.

### 3. Is "show at once" the right choice for delete, having built it?

**Yes for the ordinary case, and I disagree with it for one case.**

Yes, because ADR-021's reason held up when built. The screen needs nothing
from the server to stop showing something. It also cost very little: the
`hidden` set is a few lines, and it made the "same position" rule true by
construction.

My disagreement is about what ADR-021 itself calls the accepted cost: "The
sentence on failure has to be impossible to miss." I could not make it
impossible to miss, only hard to miss when it is on the screen. The
designer's rules say a sentence in place and never a toast. In place means
in the entry's row. On a long day, a person who deletes an entry near the
top and scrolls down to write will not see that row when the failure
arrives, which can be many seconds later on a bad connection. They leave
believing the entry is gone, and it is not. For a private journal that is
the worst direction to be wrong in.

Two honest ways out, neither of which I built because each breaks a
standing rule:

- Say it somewhere always visible, such as above the composer. That is a
  toast in everything but name.
- Wait for the answer before removing the entry, with a line "Deleting." in
  the row. That is "wait, then show", and it cannot mislead.

Given that there is no undo, I would lean to the second for delete. The
wait is short, and a delete is rare and deliberate, so speed matters less
here than for anything else on the screen. This is the owner's decision and
she made it knowing the cost. I am reporting that building it did not make
the cost smaller.

### 4. What did I have to invent because the designs do not show it?

Measured against the folder the prompt named. Finding 1 says which of these
the v3 folder has since drawn.

- **The delete control at rest**, and where it sits. Marked TEMPORARY.
- **The order of the two controls in the question**, with "Keep entry"
  where the first press landed.
- **The line while saving, and the line between "saved" and "shown".** The
  designs show the composer before and after, and nothing in between.
- **What "asked again, same answer" looks like.** The count.
- **The composer as a real text field.** Its inner spacing, that it grows,
  how tall it may get (four times the control's height), its placeholder
  colour, and its focus outline. `lock.css` gives the focus outline to
  `input` and not to `textarea`. Every value is one of `lock.css`'s own
  tokens.
- **Its accessible name.** The designs record this as a build obligation: a
  placeholder is not a reliable name. I gave the field the name "Add to
  today" through `aria-label`.
- **Line breaks in a shown entry.**
- **Where the "not saved" sentence sits**: in a notice above the field.
- **Sentences**, listed in the table above.
