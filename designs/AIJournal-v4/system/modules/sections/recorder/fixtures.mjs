// Copy from the screens (03-talk). The long and non-Latin fixtures are stress tests, not product copy.
// The trace is the memo's fixed decorative shape, as the talk page passes it (system/content/wave-shape.mjs).
import { traceBars } from '../../../content/wave-shape.mjs';

// v4 C5: a paused memo is 0:47 long; the day only on the session line (a memo is dated when it is kept).
const paused = { phase: 'paused', state: 'Paused', clock: '0:47', length: '0:47', seconds: 47 };

export default [
  { name: 'Ready', note: 'The start controls, before recording (03-talk).', props: { phase: 'ready', state: 'Ready', clock: '0:00' }, slots: { trace: traceBars(false) }, tags: [] },
  { name: 'Recording', note: 'A memo under way (16-flow-states): the transport, and the trace showing the fixed shape.', props: { phase: 'recording', state: 'Listening', clock: '0:23' }, slots: { trace: traceBars(true) }, tags: [] },
  { name: 'Paused', note: 'v4 C5: the memo paused: the field is the player at rest (the trace as recorded), Stop and keep and Resume, Discard at the far end.', props: { ...paused }, slots: { trace: traceBars(true) }, tags: [] },
  { name: 'Playing', note: 'v4 C5: played back to 0:19: the unplayed bars under the veil, the playhead, pause in place of play.', props: { ...paused, position: 19, playing: true }, slots: { trace: traceBars(true) }, tags: [] },
  { name: 'Draft', note: 'v4 C5: the voice memo draft opened from Today (the mic or Continue): "Paused · draft"; stopped at 0:31 after a play.', props: { ...paused, draft: true, position: 31 }, slots: { trace: traceBars(true) }, tags: [] },
  { name: 'Discard asked', note: 'v4 C5: Discard pressed: the question and Discard memo (quiet) and Go back (solid) in the transport’s place.', props: { ...paused, confirm: true }, slots: { trace: traceBars(true) }, tags: [] },
  { name: 'Microphone blocked', state: 'error', note: 'The refused state (03-talk): the state line says so and Try again shows.', props: { phase: 'ready', state: 'Microphone blocked', clock: '0:00' }, slots: {}, tags: [] },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long state line and a long clock.', props: { phase: 'ready', state: 'Microphone access is waiting for you to answer the permission prompt in your browser', clock: '12:34:56' }, slots: {} },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { phase: 'ready', state: 'Микрофон заблокирован マイクがブロックされています', clock: '0:00' }, slots: {} },
];
