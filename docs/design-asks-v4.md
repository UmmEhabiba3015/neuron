# Design asks after the v4 reconciliation

**For:** Mubeen, the designer.
**From:** Umer and Habiba, with the Master Thread.
**Date:** 2026-11-18.
**Builds on:** your v4 delivery (`designs/AIJournal-v4/`). It replaces
`ui-handover-v4.md`, which asked for v4 and is now answered.

Thank you for v4. We went through it at one table and ruled on every
difference with the product's list. The rulings are in
`docs/learning/reconciliation-v4/rulings.md`, and the product as it now
stands is `docs/features.md`. This is what we need from you as a result.

Words in your screens stay placeholder: final wording comes from us. Your own
rules still apply: the component inventory, the colour roles, the motion
rules and the accessibility floor.

## Order

Part A first, because the redraw starts with it: we rebuild every screen
that already works on your v4 components, and these three screens need a
field each. Part B is needed before Drafts, the third feature in our order.
Parts C and D are needed before Looking back, the fourth. Part E can come
any time.

---

## A. Before the redraw

**A1. Create account keeps the name.** Add a Name field to create account,
with its empty state, where you think it belongs among email, password and
confirm password. We collect it and do not show it anywhere yet.

**A2. Deleting the account asks for the password.** Add a password field to
the "Delete everything?" dialog, with a wrong-password state. It stays the
only blocking dialog. Without it, anyone at an unlocked device could erase a
whole journal for good.

**A3. A new password is typed twice.** Add a confirm field to "Choose a new
password", with a "the two passwords do not match" state, as create account
already has.

**A4. Your stylesheet.** We will build on `dist/system.css` alone, copied in
and never edited, as you said everything is in it. Whatever we find missing
during the redraw, we will send you as a list. Please tell us now if you
already know of anything only `lock.css` carries.

## B. Saving: no unsent rows, no drafts on screen

We decided against the unsent rows and the memo draft. Saving now waits,
visibly.

**B1. The Save button while saving.** When Save is pressed, the words stay
in the composer and **the Save button turns into a loader** until the server
confirms. Then the entry joins the list. Please draw the loader on Save, on
Today and Empty Today, and on the entry editor's "Save changes".

**B2. The error box.** If a save fails, an **error box** says so; the words
stay in the composer and Save works again. Please draw it for the composer
and the entry editor. Retire `#entry-unsent`, `#entry-unsent-stopped`, the
`pending` component's status form and the "back online" wording: there is
no offline use and no automatic retry.

**B3. The recorder while a memo uploads.** After Stop and keep, the memo
**stays on the recorder** with a loader until it is saved, then the person
goes to Today and the memo is there. If the upload fails, the recorder shows
the same error box with Try again. Please draw both.

**B4. "Keep this memo?"** Leaving the recorder while recording (Back, a menu
item, the wordmark) first asks "Keep this memo?" with Keep and Discard. Keep
saves it as in B3. Please draw the question.

**B5. Retire the memo draft.** The recorder stays as it is today: start,
pause, resume, stop and keep, cancel; refreshing the page loses the
recording. Please remove the "Voice memo draft, Continue" line on Today,
the playback track while paused, "Paused · draft", "Leaving keeps your memo
as a draft", and the `pending` draft form. The Discard confirmation can stay
if you want it as the recorder's Cancel.

**B6. A written draft shows nothing.** Text left in the composer is kept in
the browser and comes back after a reload, with no mark of its own. No
design is needed; this is for your information.

**B7. The error modal.** A general error modal for refusals that are not
about one field, first of all "too many attempts" when a rate limit applies.

## C. Looking back: one Timeline, no past-day page

**C1. The past-day page is gone.** Every day lives on the Timeline. Please
retire the Day page (`06-conversation`, `pages/day`) and its states.
**Ask's dated references** and **Reflections' "N entries"** both open the
Timeline at those days, with your wash and frame.

**C2. Timeline rows delete, never edit.** Remove the edit tool from Timeline
rows. Delete and its confirm and failure states stay.

**C3. Only today's mood changes.** The mood row on Today is the only place a
mood is set. The Timeline shows each day's mood and never changes it. Please
check that nothing on the Timeline looks like it sets a mood.

## D. Remove from Today and the notes

**D1. The overview on Today is dropped.** No line above the composer, no
chevron, no nudge, no link. Empty Today and a new account (`today-first`)
go back to the plain composer.

**D2. The AI note under each entry is dropped** for now (it may return
later as a new decision). Please remove "From your record", its citation
and its thumbs from Today. The thumbs stay on Ask's answers and on
Reflections' notes.

**D3. Reflections when a week is empty.** An empty week gets no reflection.
Please tell us what Reflections opens on when the latest week had nothing
written: the most recent reflection there is, with its dates, is our
suggestion.

## E. Any time

**E1. The public page.** One simple page that says what the product is,
designed and built by you. It must make sense to a search engine and to an
AI model with no JavaScript running. It will live in the app's public
routes, beside sign in and create account.

**E2. Sign in and create account are public pages too.** They should read
well to search engines and AI models: a heading, and a few plain sentences
about the product (your sign-in spread already has some).

**E3. "Private, out of memory".** Kept-out entries show your quiet "Out of
memory" menu. Some screens still show the older "Private, out of memory"
mark as well. Please settle on one.

**E4. Tidy the documents** when convenient: `PROJECT.md` §3 still describes
tiers and prices, and some documents point to `V3-REVISION.md`. Not urgent.

**E5. The name.** "Journal" stays a placeholder. When Umer chooses the
name, the wordmark changes; you said it is one text node per screen.

---

## Confirmed as you drew them

Search on the Timeline with its switch; the calendar with month and year
wheels, never a future month; the mood graph; today in the Timeline's list;
one-way memory; five menu items (shown as their features are built); Ask's
sessions, History, Bookmarks, Copy and thumbs; the weekly Reflections
booklet; skeletons on every loading page; live counts on What it sees;
"Sign in" everywhere; the recorder showing the day only; the fixed
waveform; every request from the earlier handover.
