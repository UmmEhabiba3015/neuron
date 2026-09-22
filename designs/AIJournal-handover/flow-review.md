# Flow review — mobile web, Stage 3

Walked in `mobile-web/00-prototype.html` against `00-flow.md`. **Six findings**, ranked by
whether the flow actually works rather than by how easy they are to fix. The heading here
said nine for the whole life of the working copy and the document has always held six.

**Update, end of session 2.** Findings **1, 2, 3, 4 and 5 are fixed and built.** Only **6**
stands, and it is a watch-item rather than a defect.

**Summary.** The navigation model holds up: back behaves, destinations are consistent, empty
days genuinely do not exist, and nothing anywhere punishes absence. **Two things stopped the
product working as specified; one is now fixed. Two screens the flow calls essential were
never drawn.** The rest is friction rather than failure.

---

## Blocking — the flow does not work as specified

### 1. The typed path cannot be completed. There is no save control. FIXED.

`00-flow.md` §3.3 specifies the typed path as **open (0), tap the field (1), type, save (2)**.

The composer is a field, a record control, and the out-of-memory option. **There is no save,
send, or done affordance anywhere in it.** A user can type and has no way to commit. This is
in every screen that carries a composer: Today, first run, and three states.

It is my error, and it went unnoticed because every comp draws the composer at rest with a
placeholder, where nothing is missing. It only appears when you try to walk the path.

**Recommended fix, cheapest and most conventional:** the record control becomes a send
control when the field has content. One control, two states, no new component and no extra
tap. The cost is that the mic is unreachable mid-draft, which is correct anyway: someone with
half a sentence typed is not about to record.

The alternative, a third control permanently in the composer, is worse. It puts a dead
button on screen for the entire life of the empty state, which is most of the time.

**FIXED, in `lock.css` revision 12.** The recommendation above was built: `.send` is the
composer's filled control whenever the field holds content, and `.mic` whenever it does not.
Drawn as state 10 of the states pack, walkable in the prototype, and documented in
`direction-lock.md` §7.4. All four remaining platforms now inherit a composer that works.

### 2. The voice path is three taps, not two. FIXED.

§3.3: **open (0), mic (1), talk, stop (2).** And: *"If a fourth required tap appears in any of
these paths, something has gone wrong."*

As built, stopping lands on a **kept** state on `/talk` that then needs *Back to today* to
leave. That is tap 3, and it is a tap that shows the user something they already know.

§3.1 step 3 is unambiguous about what should happen: *"They talk. Stop. The memo appears on
`/`."* Stop returns to Today, where the memo is already visible in the day's list. There is
no intermediate screen in the flow, and I invented one.

**Recommended fix:** delete the kept state as a destination. Stop returns to Today. If a
confirmation is wanted at all it is the memo row appearing in place, not a screen.

**FIXED.** The route is deleted. Stopping returns to Today, the memo row appearing is the
confirmation, and the voice path is two taps again. The kept drawing stays in `03-talk.html`
explicitly captioned as a transient, not a route.

---

## Gaps — specified in the flow, never drawn

### 3. The three microphone permission states. FIXED.

§1 lists them as `/talk` states: **permission not yet granted**, **permission denied**, **no
microphone**. None is drawn in `03-talk.html` or in the states pack.

This matters more than a missing state normally would. §3.1 step 2 makes the permission
prompt the **second tap of the entire product**, and the browser will not grant it without a
user gesture. It is the highest-friction moment a new user meets, it is the moment most
likely to end the session, and it is undesigned.

**Permission denied is the important one.** A user who taps the mic, panics, and hits Block
currently has no drawn path back to a working product. On mobile web there is no way to
re-prompt: the fix lives in browser settings, which the product cannot open, so this state
has to explain a recovery it cannot perform, and then get out of the way and offer the
composer. That is a genuinely hard screen and it should not be improvised.

**FIXED.** All three drawn as stages of `03-talk.html`, filed with the route they belong to.
Denied makes writing the filled control, because it is now the only thing that will work.

### 4. The first Pro session. The flow calls this the most important screen in the product. FIXED.

§3.2 steps 4 and 5 describe what happens after payment: the backlog transcribes with a
progress state, the timeline fills in, and then **the product reads across the newly
transcribed archive unprompted.**

The flow's own words: *"This is the only demonstration in the product and it has to be the
best screen in it."* And: *"That single screen is doing the job a free trial would have done,
and it happens after the money. It has to be extraordinary, and there is no second chance at
it."*

**Neither the progress state nor the first Pro session exists in Stage 3.** The queue in
PROJECT.md §8 never listed them, so this is inherited rather than introduced, but the queue was
wrong. `lock.css` even carries a `.progress` component built for exactly this and used by no
deliverable.

Walking the prototype, Upgrade goes straight to a settled Pro Today, which quietly skips the
one moment the entire commercial argument rests on.

**FIXED.** Both built as `12-upgrade.html`. **It leads with the writer's own words**, not with
the observation: a passage recorded in March and never read back, in ink at body size, with the
product's note beneath it in rust. Leading with the observation would make the moment about the
product on the one screen where it has to be about the person.

The progress state is the first use of `.progress`, which the lock had carried since Stage 2
with no deliverable to put it in.

---

## Friction — works, but does not feel natural

### 5. Pro is mentioned on more surfaces than the flow authorises. FIXED.

§3.2 is explicit: *"The Timeline number is the whole of it, and Settings is the other route
in."*

Walking the Free journey, Pro appears on **four** surfaces: the `/talk` line under every
recording, the Timeline unread clause, two notices on Ask, and the plan row in You. Each is
individually authorised by §1 and each is factual and uncoloured. **The cumulative effect
walking it is more insistent than the flow intends.**

The sharpest instance is a direct contradiction. §1 says the `/talk` line is *"stated once
and never nagging."* As built it is on the capture screen every single time. **Said once
should mean once**, on the first recording, and never again.

**FIXED, both.**
1. The `/talk` line is now specified as **first recording only**, written into
   `direction-lock.md` §8.1 and into the comp header. It is a condition rather than a layout,
   so the comp still draws it present; the build conditions it.
2. **The two Ask notices are merged into one**, in `04-ask.html`, the states pack and the
   prototype. One block stating two facts rather than two blocks each mentioning Pro.

That takes Pro from four surfaces to three on the Free journey, and removes the only direct
contradiction of the flow that the walk found.

### 6. Mood is hard to reach on a full day.

Mood is the last row of the sheet, which is right: it is offered at the end and never
demanded. But at month six, on a day with three entries and a recording, it sits below all of
them and reaching it is a deliberate scroll past everything you wrote.

The capture-rate risk is already on record in `00-flow.md` §4.5 as *"at 20% capture the
derived layer stops being worth deriving,"* and the timeline, the calendar marks and part of
the reflection are all built on it.

I do **not** recommend moving it up or adding a prompt. Both trade the product's calm for a
metric. **Worth watching rather than fixing**, and worth designing a way to set mood from the
day page, which already exists, rather than making Today push for it.

---

## Checked, and holding up

Stated because a review that only lists faults is not a review.

- **Back is genuinely correct everywhere**, and the prototype proves it with real history
  rather than asserting it. Out of a panel closes the panel; out of a pushed page returns to
  what pushed it; zoom does not push; `/` is the root.
- **An empty day really does not exist.** Walking the thin timeline and the calendar, there
  is no row, no dot, no dimming and no language for a silent day. The three week gap reads as
  a thinner notebook rather than a failed one, which was the hardest thing to get right.
- **The unread clause behaves.** It reads as a fact about your own archive, it is never
  coloured or counted down, and it is absent on Pro.
- **The note being shut works better in motion than in a comp.** Walking Pro Today, the
  product genuinely says nothing until asked, and the page is the user's writing.
- **Free does not feel like a demo**, once finding 5 is applied. Nothing is blurred, locked or
  greyed anywhere, and the recordings are complete and playable.

---

## What I would do next

**Before Stage 4**, because all four remaining platforms inherit them:

1. ~~Decide the composer save control.~~ **Done.** `lock.css` revision 12.
2. ~~Delete the kept route.~~ **Done.**
3. ~~Draw the first Pro session and the transcription progress state.~~ **Done.** `12-upgrade.html`.
4. ~~Draw the three permission states.~~ **Done.** Stages of `03-talk.html`.
5. ~~Apply the `/talk` line to first recording only, and merge the Ask notices.~~ **Done.**

Items 1, 2 and 5 are small. Items 3 and 4 are four new screens, which is a real addition to
Stage 3 rather than a revision to it, and worth deciding on deliberately rather than absorbing.
