// Talk's content (03-talk, journal-website.html #talk): written once for every platform. Links point into
// the prototype, as the screens' do. The kept recording's waveform is the wave's own.
export default {
  // The recorder section's own copy is its module's; the page chooses its state line and clock.
  recorder: {
    ready: { state: 'Ready', clock: '0:00' },
    // Reference drawings (DESIGN.md 2026-10-14): the website redirects these to the live recorder.
    'microphone-before': { state: 'Microphone access', clock: '0:00' },
    'microphone-denied': { state: 'Microphone blocked', clock: '0:00' },
    'microphone-missing': { state: 'Microphone unavailable', clock: '0:00' },
    // The flow pack's recorder states (16-flow-states): the same recorder, each with its route's id on the
    // shell. The three microphone ones are reference drawings too (DESIGN.md 2026-10-14).
    'flow-mic-permission': { id: 's-mic-permission', state: 'Microphone access', clock: '0:00' },
    'flow-mic-denied': { id: 's-mic-denied', state: 'Microphone blocked', clock: '0:00' },
    'flow-mic-missing': { id: 's-mic-missing', state: 'Microphone unavailable', clock: '0:00' },
    // A memo under way (v4 B6): the trace shows the fixed shape, recording and paused alike.
    recording: { id: 's-recording', phase: 'recording', state: 'Listening', clock: '0:23' },
    // v4 C5: paused, the field is the player (at rest) and Discard stands at the far end; the draft opened from Today;
    // Discard asked.
    paused: { id: 's-recording-paused', phase: 'paused', state: 'Paused', clock: '0:47', length: '0:47', seconds: 47 },
    'paused-draft': { id: 's-recording-draft', phase: 'paused', state: 'Paused', clock: '0:47', length: '0:47', seconds: 47, draft: true },
    'discard-confirm': { id: 's-recording-discard', phase: 'paused', state: 'Paused', clock: '0:47', length: '0:47', seconds: 47, confirm: true },
  },
  // The kept notice (16-flow-states, s-recording-kept): a generic state page (system/content/state-page.mjs).
  'kept-notice': { id: 's-recording-kept', kind: 'journal', title: 'Recording kept', blocks: [
    { type: 'notice', text: 'Your 0:47 recording is kept as audio.' },
    { type: 'actions', items: [{ label: 'Return to Today', href: '00-prototype.html#today', grade: 'solid' }] },
  ] },
  back: { label: 'Today', href: '00-prototype.html#today' },
  // The kept recording: its date box, its row and the way back.
  kept: {
    date: { key: 'Kept', value: 'Sun 9 Aug, 21:58' },
    recording: { time: '21:58', datetime: '2026-08-09T21:58', duration: '1:12', play: 'Play this recording, 1 minute 12 seconds', text: 'Voice memo' },
    delete: { label: 'Delete voice memo', href: '00-prototype.html#recording-delete-confirm' },
    backToday: { label: 'Back to today', href: '00-prototype.html#today' },
  },
  transcribing: 'Transcribing.',
};
