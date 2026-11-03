// Talk on each platform and in each state (03-talk). The catalogue draws a page at its own width.
const platforms = [['Mobile', 'mobile'], ['Tablet', 'tablet'], ['Desktop', 'desktop']];
const states = [
  ['Ready', 'ready', 'The compact recorder, ready to start'],
  ['Kept', 'kept', 'The kept recording, with its row and the way back'],
  ['Transcribing', 'transcribing', 'The kept recording, with the transcribing notice'],
  ['Microphone before', 'microphone-before', 'Reference drawing: waiting for the browser’s permission prompt'],
  ['Microphone denied', 'microphone-denied', 'Reference drawing: access blocked'],
  ['Microphone missing', 'microphone-missing', 'Reference drawing: no microphone found'],
  ['Flow: microphone permission', 'flow-mic-permission', 'Reference drawing (16-flow-states): waiting for the permission prompt'],
  ['Flow: microphone denied', 'flow-mic-denied', 'Reference drawing (16-flow-states): access blocked'],
  ['Flow: microphone missing', 'flow-mic-missing', 'Reference drawing (16-flow-states): no microphone found'],
  ['Recording', 'recording', 'The compact recorder, a memo under way: the fixed shape (16-flow-states)'],
  ['Paused', 'paused', 'The compact recorder, paused: the player at rest, Discard at the far end (16-flow-states)'],
  ['Paused draft', 'paused-draft', 'v4 C5: the voice memo draft opened from Today, Paused · draft (16-flow-states)'],
  ['Discard asked', 'discard-confirm', 'v4 C5: Discard pressed, the question in the transport’s place (16-flow-states)'],
  ['Kept notice', 'kept-notice', 'The generic state page: the recording is kept (16-flow-states)'],
];
export default platforms.flatMap(([name, platform]) => states.map(([label, state, note]) => ({
  name: `${name} · ${label}`, note: `${note} (03-talk / 16-flow-states, ${platform}-web).`, props: { platform, state },
}))).concat(
  // Pages round 5: as the prototypes and the website draw it.
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'ready', context: 'walkthrough' } },
);
