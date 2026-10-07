# ADR-021: What the Screen Shows While a Request Is in Flight

**Status:** Accepted
**Date:** 2026-10-07 (Day 17)

---

## Context

On Day 17 the owner used the product as its first real user and reported
what felt wrong. Two of her findings were the same fault: pressing "Try
again" while the server was down, and pressing a mood button, both gave no
sign that the press had been received. Nothing on the screen was untrue, and
the person was left without an answer.

Every action has three moments: the press, the request in flight, and the
answer. A screen feels broken when it says nothing during the second.

There are two ways to design that moment.

- **Wait, then show.** The screen changes only after the API answers, and
  shows a plain line meanwhile. It never shows anything untrue. The person
  waits.
- **Show at once, then confirm**, the optimistic update. The screen changes
  immediately and the request follows. It feels instant. The screen is
  untrue for a moment, and a failure has to be undone and said.

The designer's rules bound both: a sentence in place, and never a spinner, a
skeleton, a toast or a disabled control.

---

## Decision

The choice is made per action, by asking who owns the data the screen would
have to show.

| Action | Choice | Reason |
|---|---|---|
| **Writing an entry** | Wait, then show | The owner's: the server decides an entry's time and its day. To show the entry at once, the browser would have to invent both from its own clock, which breaks the Day 15 rule that the API is the authority on which day it is |
| **Deleting an entry** | Show at once, and put it back if the delete fails | The owner's: the screen needs nothing from the server to remove something it already shows. On failure the entry returns to exactly where it was, with a sentence |
| **Asking again after a failure** | Wait, with a plain line while asking | A press must always be seen to have been received |

Three rules follow for writing:

- **The text stays in the composer until the API has confirmed the entry.**
  It is never lost to a failed save.
- **After a successful save the screen asks the API for today again**, and
  does not add the entry to the page itself. An entry written near 4am may
  belong to a different day than the one on the screen, and only the API
  knows.
- **A second press while a save is in flight sends nothing.**
- **The composer sends the text without the spaces and blank lines at its two
  ends.** Spaces and line breaks inside the text are kept. The owner's
  decision, on the worker's argument that a person who presses Enter after
  their last sentence did not mean to store an empty line. The API is
  unchanged: it still stores exactly what it is sent and trims nothing
  (ADR-005). The trimming is the browser's choice about what to send.

---

## The delete choice was challenged, and stands

The worker who built it disagreed for one case. The failure sentence has to
appear in the entry's own row, because the designer forbids anything that
floats over the page. On a long day a person may delete an entry near the top
and scroll away. If the delete then fails, the sentence appears where they
are no longer looking, and they leave believing a private entry is gone. The
worker and the Master Thread both recommended changing delete to "wait, then
show".

The owner heard the argument and kept "show at once". It is recorded here as
her decision made with the cost known, and as the first revisit condition
below.

---

## Accepted costs

- **A person on a slow connection waits to see what they wrote.** The line
  that says it is being saved is what makes that wait acceptable.
- **An optimistic delete can mislead.** If the delete fails after the entry
  has vanished and the person has looked away, they may believe it is gone.
  The sentence on failure has to be impossible to miss.
- **Text typed when a session ends is lost today.** Keeping it across a
  sign-in needs drafts on the server, which is Day 18.

---

## Revisit when

- **A person is misled by a failed delete**, or the Timeline and day pages
  make long lists ordinary. That is the case the delete choice was challenged
  on.

- **Mood is wired.** The designer's rule already describes it as optimistic:
  the choice shows at once and "returns to what it was, with a sentence".
- **Drafts exist** (Day 18). Saving as the person types changes what "wait"
  means for the composer.
- **A person reports that writing feels slow.** That is the evidence that
  would justify showing an entry early, and it would need the API to return
  enough for the browser not to guess.
