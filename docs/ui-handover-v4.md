# Journal — design handover for v4

**For:** the UI designer.
**From:** the team building the product.
**Date:** 2026-10-10.
**Builds on:** your v3 delivery (`AIJournal-v3`, `V3-REVISION.md`).

Thank you for v3. Every screen in it has been built in the web app. Since
then the product's feature list was reviewed against your screens and
locked. This document tells you what changed and what we need from you.

Your own rules still apply: the component inventory, the colour roles, the
motion rules, the accessibility floor and the no-disabled-controls
convention (with the microphone exception that was already approved).

Words in your screens are placeholders. Final wording comes from us; you
only need to show where words go and roughly how long they are.

## Summary

| Part | What it is | What we need |
|---|---|---|
| A | Screens that are final | Small corrections only |
| B | Things to remove or change on existing screens | Edits to existing screens |
| C | Flows to redesign | New design work. Each one lists what the product must do |
| D | Questions from building v3 | Short answers |

The product rules in parts B and C are fixed. How each flow looks and moves
is yours, and may change after we see it.

---

## A. Screens that are final

These are built as you drew them. Change them only for the corrections
listed here.

- **Sign in, create account, forgot password, choose a new password.** Keep
  the Show password control on every password field.
- **Today: writing, deleting and editing an entry, and mood.** Editing works
  in the entry's own row, keeps the original time and adds no "edited"
  mark. Voice memos can be deleted but not edited.
- **Account: devices, signing out one device or every device.**
- **Timezone.** **Correction: a day ends at midnight, not 4am.** Please
  change the sentence on the Timezone row and the Timezone page.
- **Your data: export and delete the account.** See B5 for export formats.
- **You, What the model can see, Support resource.** The counts on Your data
  and the "Keeping since" line both stay.
- **The menu says "You".** The name in the menu that we asked about on
  2026-10-07 is no longer needed, and neither is a place to change the name.
  The name field on create account stays.

## B. Remove or change on existing screens

**B1. Remove the AI note under each entry.** The "From your record" note,
with Read the note, Hide the note, its date and That's not right, is not in
the product. This affects Today and the past day page. Entries and memos
stand on their own.

**B2. Remove the AI's questions inside a day.** The "Asked" turns in
`06-conversation.html` are not in the product. A day holds only the
person's entries and memos.

**B3. Remove the return-after-a-gap echo.** Today does not show the last
entry again after a long absence.

**B4. Remove the "too many attempts" state** from the sign-in states
(`15-auth-states.html`).

**B5. Export formats are PDF, JSON and audio files.** Markdown is removed.
Please update the Export row's description and the Ready state.

**B6. The recorder keeps its controls, and its waveform becomes a static
picture.**
- Stays as drawn: Start, Pause, Resume, Stop and keep, Cancel, and the
  microphone states (asking, refused, missing, with Try again).
- Changes: the waveform does not follow the real sound, live or on a saved
  memo. It is a fixed decorative shape. Please draw it for a recording in
  progress and for a saved memo.
- Stays: a failed upload keeps the memo on the page with a retry and a plain
  warning that it is lost if the page is closed.

**B7. Reflection screen.** Remove "You asked for this once a week, on Sunday
evenings. Change that" and remove That's not right. Reflections are
redesigned in C3.

## C. Flows to redesign

Each flow lists what the product does, which is fixed, and the states we
need. Everything else is your choice.

### C1. Looking back: Timeline, a past day, the calendar

The whole flow is open for redesign. Positions and looks may change. The
functions stay.

What the product does:
- A list of past days, newest first. A day with no entries does not appear
  and has no page.
- A page for one past day: its entries, its memos and its mood. On it the
  person can change the mood, edit and delete entries, and delete memos.
  They cannot write a new entry there.
- A calendar of the same days, a month at a time. **New: the person can move
  to earlier and later months.** Days with entries are marked, and choosing
  one opens that day. Months in the future cannot be shown.

States we need: loading, the end of the list, a failure to load, no past
days yet, a month with no entries, and deleting the last item of a day
(the day disappears from the list).

### C2. Search and Ask

Three functions, reimagined together:
1. **Keyword search.** Finds entries containing the words typed.
2. **Search by meaning.** Finds entries that say the same thing in other
   words. "Felt overwhelmed at work" finds "the office is too much lately".
3. **Ask.** The person asks a question in plain words and gets an answer
   written from their journal, with references to the entries it used.
   Choosing a reference opens that entry's day.

Fixed rules:
- Only the person's own entries are ever searched or read.
- Entries marked "out of memory" are still found by both searches, and are
  never used by Ask. "Out of memory" means the entry is never given to the
  AI.
- Memos count only once they have a transcript.

Your choice: whether these are one field or more, how results and answers
are laid out, and how the person tells which kind of result they are
looking at.

States we need: before anything is typed, searching, results, no results,
an answer being written (it appears gradually), an answer with its
references, a question the journal cannot answer, and a failure.

### C3. Reflections (a new page)

What the product does: a written reflection over a period of the journal.
The period may be weekly or monthly; we will confirm it. Reflections are
generated automatically. The person does not choose when they arrive.

We need: the reflection page, a way to reach past reflections, the state
where none exists yet (a new account), and what an excluded ("out of
memory") entry means for it (it is simply not used).

This is the last of the AI features to be built, so it can come after C1
and C2.

### C4. Recent overview on Today

What the product does: a short reflection on the recent period, shown on
Today above the composer, where your Writing companion placed the overview.
It is written by the AI, probably from the latest reflection.

We need: the overview present, and Today with no overview yet. It must not
look like the person's own writing.

### C5. Drafts

What the product does: unfinished writing in the composer is saved to the
server as the person types. It comes back after a reload, after being
signed out and signing in again, and on another device.

This is being built now on the current composer, because it changes no
flow. Your design is still welcome, and we will restyle to it when it
arrives: a draft restored into the composer, and a draft that failed to save
(the text is still in the composer and can still be saved). If you think a
quiet "saved" indication helps, show it; it is optional.

**Order of your work.** C1 to C3 (Looking back, Search and Ask,
Reflections) and C4 are what our build waits for. C5 and C6 are not.

### C6. Privacy page wording

This is done last, once the AI features exist, because the words describe
what they actually do. The page's structure can stay as it is. No work is
needed now.

## D. Questions from building v3

These came up while we built v3, and were never sent to you.

1. **Five layout rules depend on the `.device` frame** in `lock.css`
   (`.device.d` and `.device:not(.d)`): the desktop two-column page with its
   pinned binding column, and the header that stays at the top below
   desktop. A running product has no `.device` frame, so we repeated those
   rules keyed on the 1200px container width. Can `lock.css` key them on the
   container width instead?
2. **Two of your files disagree in three places.** We followed the first file
   in each case. Which is right?
   - The button says "Log in" in `13-login.html` and "Sign in" in
     `15-auth-states.html`.
   - Under create account, `14-register.html` has "Already have an account?"
     followed by a separate "Log in" link. `15-auth-states.html` makes the
     whole line one link.
   - The composer has the class `composer` on Empty Today and
     `composer writing-companion` on Today.
3. **Settled, no answer needed:** the composer grows to four lines and then
   scrolls; an entry typed on several lines is shown on several lines.

## Not needed

For the avoidance of doubt, none of these will be built: tiers or a plan
page, guest use, offline states, import, trackers beyond mood,
notifications, Timeline totals, distress detection and the crisis card
(the always-available support resource stays), rich text, mood charts,
attachments, the native mobile app.
