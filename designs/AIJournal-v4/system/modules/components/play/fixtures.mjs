// Copy from the screens (the voice memo row on Today). The long and non-Latin fixtures are stress
// tests, not product copy.
const pause = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
const play = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
export default [
  { name: 'Default', note: 'As on the recording rows.', props: { label: 'Play voice memo' }, slots: { icon: play } },
  { name: 'Playing', note: 'The recorder runtime swaps the glyph to a pause while playing.', props: { label: 'Pause voice memo' }, slots: { icon: pause } },
  { name: 'Hover', state: 'hover', note: 'Fills --block, the glyph turns --paper.', props: { label: 'Play voice memo' } },
  { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base).', props: { label: 'Play voice memo' } },
  { name: 'Active', state: 'active', note: 'Pressed 1px down, and scaled .97 under the shell.', props: { label: 'Play voice memo' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long accessible name.', props: { label: 'Play the voice memo you recorded on the train home last Thursday evening' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { label: 'Воспроизвести запись · 再生' } },
];
