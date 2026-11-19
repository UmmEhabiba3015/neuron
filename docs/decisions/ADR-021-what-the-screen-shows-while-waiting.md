# ADR-021: What the Screen Shows While a Request Is in Flight

**Status:** Accepted 2026-10-07 (Day 17). Revised 2026-11-18 in the v4
reconciliation (Umer, with Habiba and the designer), accepted by Umer on
2026-11-19. The 2026-10-07 text is in git history; the
rulings are in `docs/learning/reconciliation-v4/rulings.md`.

---

## Context

Every action has three moments: the press, the request in flight, and the
answer. A screen feels broken when it says nothing during the second. On
Day 17 Habiba found exactly that: pressing "Try again" while the server was
down, and pressing a mood, gave no sign that the press had been received.

There are two ways to design that moment.

- **Wait, then show.** The screen changes only after the API answers, and
  shows that it is waiting meanwhile. It never shows anything untrue. The
  person waits.
- **Show at once, then confirm**, the optimistic update. The screen changes
  immediately and the request follows. It feels instant. The screen is
  untrue for a moment, and a failure has to be undone and said.

---

## Decision

The choice is made per action, by asking who owns the data the screen would
have to show.

| Action | Choice | Reason |
|---|---|---|
| **Writing an entry** | Wait, then show | The server decides an entry's time and its day. Showing it at once would mean the browser inventing both from its own clock, which ADR-015 forbids |
| **Saving a voice memo** | Wait, then show, on the recorder | The same reason as writing |
| **Deleting an entry or memo** (Today and the Timeline) | Show at once, and put it back if the delete fails | The screen needs nothing from the server to remove what it already shows. On failure the item returns to where it was, with a sentence |
| **Setting today's mood** | Show at once, and go back if it fails | The choice is the person's own; on failure it returns to what it was, with a sentence |
| **Asking again after a failure** | Wait, and show it is asking | A press must always be seen to have been received |
| **Opening a page** | Wait, with a skeleton | The page draws its real frame, with shapes at the real content's widths, so nothing jumps when the data arrives |

**Writing, in detail:**

- Pressing Save sends the entry at once. **The words stay in the composer
  and Save shows a loader** until the API confirms the entry.
- Once confirmed, the screen asks the API for today again, and does not add
  the entry to the page itself: only the API knows which day it belongs to.
- **If saving fails, an error box says so;** the words stay, and Save works
  again. Nothing retries on its own, and no unsent entry appears in the
  list.
- A second press while a save is in flight sends nothing.
- The composer sends the text without the spaces and blank lines at its two
  ends; the API stores exactly what it is sent (ADR-005).
- **Unfinished writing is kept in the browser,** so it survives a reload. It
  is cleared at sign-out, so nothing is left on a shared computer, and it
  does not follow the person to another device.

**A voice memo, in detail:**

- After Stop and keep, **the memo waits on the recorder with a loader** and
  moves to Today only once saved.
- **If the upload fails, the recorder shows the error box and Try again.**
- **Leaving the recorder while recording asks "Keep this memo?"** with Keep
  and Discard, so an upload never fails where the person cannot see it.
- Refreshing the page loses a recording that has not been kept.

**What the designer allows:** a sentence or an error box in place, a loader
on the button that was pressed, a skeleton while a page loads, and an error
modal for refusals that belong to no single field (a rate limit). No toast.

---

## The delete choice was challenged, and stands

The worker who built delete disagreed for one case. The failure sentence
appears in the item's own row. On a long list a person may delete an item
near the top and scroll away; if the delete then fails, the sentence appears
where they are no longer looking, and they may believe a private entry is
gone. The worker and the Master Thread both recommended "wait, then show".
Habiba heard the argument and kept "show at once", with the cost known.

---

## Accepted costs

- **A person on a slow connection waits to see what they wrote.** The loader
  is what makes that wait acceptable.
- **An optimistic delete can mislead,** as above. The sentence on failure
  has to be impossible to miss.
- **Writing left in the composer is lost at sign-out,** by choice, and does
  not reach another device.
- **A recording is lost if the page is refreshed** before it is kept.

---

## Revisit when

- **A person is misled by a failed delete.** The Timeline's long list makes
  that case more likely.
- **A person reports that writing feels slow.** That would justify showing
  an entry early, and it would need the API to return enough for the
  browser not to guess.
- **People lose writing at sign-out or across devices** often enough to ask
  for it back: drafts on the server are the alternative.
