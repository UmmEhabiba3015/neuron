# talk (page)

Talk: the voice memo. The compact transport recorder, and the kept recording with its row and the way
back. Approved design: journal-website.html `#talk`.

## Why

Talk is the page behind the Today screen's voice memo. It shows the recorder section before a memo, and
the kept recording after it. One render serves the three web platforms; the screens show six devices.

## Do and don't

- Do compose modules only (`use()`), with roles; the page has no CSS and writes no markup of its own.
- Do keep content in `data.mjs` (a recording's waveform is the wave's own (v4 round 10)).
- Don't treat the three microphone states as product routes. They are **reference drawings**
  (DESIGN.md 2026-10-14): the website redirects them to the live recorder, so they stay as states only
  so the comp can show them.

## Usage

```js
render('talk', { platform: 'mobile', state: 'ready' })
```

## States

Named as the prototype's routes (journal-website.html), in the screen's order:

- `ready` (route `talk`): the recorder section, ready to start.
- `kept` (route `recording-kept`): the kept recording's date box, its row, and Back to today.
- `transcribing`: the kept recording, with the Transcribing notice in place of Back to today.
- `microphone-before`, `microphone-denied`, `microphone-missing`: the recorder section with the
  microphone's state line, message and controls (reference drawings).

- `flow-mic-permission`, `flow-mic-denied`, `flow-mic-missing` (reference drawings), `paused`: the same
  recorder section for the flow pack (16-flow-states), each with its route's id on the shell; paused is
  phase paused, 0:47.
- `kept-notice`: a generic state page (system/content/state-page.mjs), the recording is kept.
## Platform rules

- **Desktop, kept and transcribing**: the back link is the title block beside the page (`mast` form
  `title`, shell layout `sidebar`), and the page is headed `untitled`.
- **Mobile and tablet, kept and transcribing**: the masthead row (role `head`) with the back link
  (role `line`) inside the page.
- **Every platform** draws the kept recording's waveform as the wave draws every memo (v4 round 10).
- The recorder states are the same on every platform: the recorder section in the shell, no page.

## Composition

Recorder states: `shell` with `rail` and the `recorder` section (role `main`). Kept states: `shell`,
`rail`, `page`, the `mast` with `back`, and a `stack` (role `main`) of the printed `keybox`, the `recrow`
(role `fill`: `play`, `wave`, its text and the `entry-actions` with the delete button), then Back to
today (`button`) in the stack's row, or the `notice` (role `block`) while transcribing.

## Comp

`system/comps/03-talk.json` lists the six devices in the screen's order; one caption, after the last.
The build writes `*/03-talk.html` from it.
