# recorder

The Talk screen's approved compact transport recorder: a masthead with the wordmark and the date
box, a back row, the intro, and the recording sheet (session line with state, date and elapsed
clock; the recording field with the waveform and its axis; the controls). Content decides its
height. It responds to its container (the stage's `container-type`), not the viewport.

```js
use('recorder', { phase: 'ready', state: 'Ready', clock: '0:00' })
```

React: `<Recorder phase state clock />`. It draws the date box and the buttons itself (keybox and
button modules). The runtime swaps the start controls and the transport with `hidden`.

## Why

- **A fixed decorative shape, content decides height.** The trace is 128 bars from the page (slot
  `trace`, `system/content/wave-shape.mjs`): flat until a memo starts, then the memo's fixed shape, which
  never follows the sound (v4 B6). On Start the runtime scales each bar to its `data-level` once; the
  bars rise on `--g-wave` and hold still after.
- **Two phases, one sheet.** `ready` shows Start, Cancel and the microphone feedback; `paused`
  shows Stop and keep and Resume. Both are always in the markup.
- **Keep this out of memory** (decision 2026-10-28): the composer's option (opt), under the controls in
  every phase, so it can be set before or while recording. The kept memo takes it, then it clears; the
  composer's mic carries the composer's choice into it. Memory is one way: a memo kept out can be let in
  later from its row, but one in memory can't be taken out.
- **The state line says what is wrong.** "Microphone blocked" with Try again, in words, no alarm.
- At 620px the session line reflows to two rows and the controls stack, buttons first; at 336px
  the masthead and back row wrap and the transport buttons take the full width.

## Do and don't

- Do let the shell place it: it takes the shell's room by role (`main`).
- Do keep the masthead's wordmark on the mast module's generated rule through `recorder-mast`.
- Don't style the buttons from here: their grades, glyph size and disabled look are the button
  module's.
- Don't add a colour to the state dot; it follows the block colour like the clock.

## Placement

- Places: `grow` the transport's main button, takes the room left below 620.
- Placed by: the shell (`main`).

## Legacy debt

- Legacy contexts: `.device:not(.d) .aj-s-recorder__mast` (the stage; the masthead is sticky
  below desktop).
- No placement is left in lock.css on the section: the shell places it, and it places the transport's
  main button itself (`grow`).
- Left in lock.css, not this section's: `.compact-recorder-app{container-type}` (the shell's);
  `.recorder-wave g{animation:none!important}` (`!important`); `.journal-memo-clock`, `.memo-total`;
  the mast module's `.recorder-mast .aj-l-mast__wordmark` and the keybox's
  `.recorder-mast .aj-c-keybox .aj-c-keybox__value`.
- The fixtures' wordmark is a plain link (`wordmark`): the mast module is not a declared
  dependency, and its recorder rule reads the legacy `recorder-mast` class.

## Drafts, the player and Discard (v4 C5, 0.5.0)

Decided in explore `2026-10-29-drafts` (a-quiet-line) and the C5 rulings (DESIGN.md, 2026-10-29).

- **Leaving keeps the memo as a draft** (back, a destination, closing): the memo pauses and stays on the device, one
  draft at a time; the mic and Today's Continue line open it. `draft` writes "Paused · draft" in the state line.
- **The session line shows the day only** (`date`, "Sun 9 Aug"): a memo is dated when Stop and keep is pressed.
- **While paused the field is the player.** The trace is the track (`data-hook="track"`, a slider only while paused:
  click or drag, arrows 5 s, Home and End, Space plays); a veil of the field's ground over the unplayed part (the bars
  read at .32) and a 2px playhead at `--aj-s-recorder-at` (0 to 1); under it play / pause, back and forward 10 s (36px)
  and position / length (read left to right always). Before playback begins (`data-playback` absent) the trace is drawn
  as recorded. Resume stops playback and records on from the end.
- **Playback is not a transport button:** the transport keeps Stop and keep (solid, the way out) and Resume.
- **Discard** is a quiet button at the transport's far end (below 620, last under the hint), shown only while paused.
  It asks first (`confirm`, `data-hook="confirm"`): "Discard this 0:47 memo? This cannot be undone." with Discard memo
  (quiet) and Go back (solid) in the transport's place. Go back returns focus to Discard; Discard memo returns to
  Today with nothing kept.
- **Right to left** the trace mirrors, the veil and playhead follow the inline direction, the skips' arrows turn the
  other way (not their "10"); the runtime mirrors the track's arrow keys.
- The player, Discard and the question are drawn in every phase and shown by phase, so the runtime only
  sets state (`data-recorder-phase`, `data-playback`, `--aj-s-recorder-at`, `hidden` on the question) and text.
- The back note stays centred on "← Today" at every width (below 620 it used to sit at the top of the 44px link).
