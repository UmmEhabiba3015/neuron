# recrow

C3 in the closed inventory (direction-lock.md §6). The recording: the only row that carries a tone
(--block-2 ground, --block marks). Its head always carries the 58px column (the time on a day's
screen, the date on Timeline; present and empty where the row continues the day), beside it play,
the waveform and the duration. The transcript body below is present on Pro and absent on Free, and
holds the entry actions in the same gutter as the written row.

```js
use('recrow', { head: 'dated', time: '14:05', datetime: '2026-08-09T14:05', duration: '2:41', transcript }, { player, children })
```

## Why

- **The column is always there.** Empty is not absent: a row continuing the day keeps the ruled column.
- **The capture head is the one head without it.** A recording in progress has no timestamp yet, so
  it stacks (`head: 'capture'`; no screen draws it today).
- **The gutter is shared with the written row.** The entry actions sit in the same right-hand gutter
  (lock.css, "Approved revision: an action gutter").

## Do and don't

- Do give the Free form no transcript: the row then has no body.
- Do pass play and the waveform as the `player` slot; the entry actions and mark as `children`.
- Don't add a variant; the runtime's live memo row is the `live` option.
- Do give a live memo only play in `player`: it renders its own wave and clock after it.

## The live memo's behaviour

The prototype runtime clones the template `recrow-live` (this render with `live`, play in the player
slot; its waveform is the wave module, the memo's phrase at a fixed pitch) and finds the row by `[data-live-memo]`.

- State, set by the runtime on the row: `data-playback="playing"` (the wave dims, the played copy shows through the progress)
  and `"complete"` (the played part stays).
- Hooks: `elapsed` and `total` (the clock's two times). The label paragraph is the text module's, the first `.aj-c-text` in the row.
- Exposed: `--aj-c-recrow-progress` (0 to 1, set each frame while playing; on a stop the position
  reached) and `--aj-c-recrow-timer-ch` (the clock's width in characters).
- Parts: `__wave` (with `__wave-base`, `__wave-played`, `__progress`), `__clock` (with `__total`).

## Placement

- Places: `after` a mark after the transcript, `--s4` above; `span` the delete confirmation, a state message, the full grid, `--s4` above.
- Placed by: the stack (`fill`).

## Legacy debt

- Legacy contexts in `recrow.css`: `.stack` (rounds the recording), the shell's 620px viewport query
  for the live memo row, and `.app:not(.ios) .sheet` (the date column's padding and wrapping).
- Legacy context in the gutter: `:has(>.entry-actions)`, the entry actions' legacy class; the
  entry's text is its paragraph (`>p`). The row keeps the legacy class it reads.
- No placement is left in `lock.css`; the stack places it by role (`fill`).
- Nothing of the live memo's playback is left in `lock.css`: the wave, its layers, the progress clip
  and the clock are this module's parts (below).
- The fixtures add the `entry-actions` legacy class to the rendered entry actions, as the screens do.
