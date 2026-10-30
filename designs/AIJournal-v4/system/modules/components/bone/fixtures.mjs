// The skeleton's pieces on their own (v4 round 10). Bones carry no words; the long and non-Latin fixtures are stress
// tests of width.
export default [
  { name: 'Line', note: 'A line of words still to come: 12px, round ends.', width: 320, props: { width: '62%' } },
  { name: 'Block', note: 'A box: the play button\'s outline, a tool.', props: { form: 'block', width: '44px', height: '44px' } },
  { name: 'Round', note: 'A day\'s mood dot.', props: { form: 'round', width: '28px' } },
  { name: 'Text', note: 'Three lines of an entry at the prose line height: as tall as the words.', width: 320, props: { form: 'text', lines: [1, 0.92, 0.58] } },
  { name: 'Text, a headline', note: 'Two lines of a Reflections headline: the parent\'s 30px type, 20px bars.', width: 320, props: { form: 'text', size: 'inherit', height: '20px', lines: [1, 0.6] } },
  { name: 'Spread', note: 'A mood row\'s five words, spread across the row.', width: 320, props: { form: 'spread' } },
  { name: 'Spread, round', note: 'A week\'s seven day dots.', width: 320, props: { form: 'spread', count: 7, width: '28px', height: '28px' } },
  { name: 'Wave', note: 'A memo\'s waveform in bone, at its fixed pitch.', width: 320, props: { form: 'wave' } },
  { name: 'Status', note: 'The announced line: visually hidden (nothing shows).', props: { form: 'status', text: 'Opening your journal.' } },
  { name: 'Loading', state: 'loading', note: 'The shimmer passing over a line.', width: 320, props: { width: '80%' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a very wide row; the bars keep 12px.', width: 1600, props: { form: 'text', lines: [1, 1, 0.4] } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: the status words in Russian (hidden).', props: { form: 'status', text: 'Открываем ваш дневник.' } },
];
