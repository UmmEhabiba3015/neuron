// The waveform on its own. It carries no text, so the long and non-Latin fixtures are stress tests of its width: a
// very wide row (the phrase repeats, the bars keep their size) and a very narrow one (the phrase's first bars).
export default [
  { name: 'Default', note: 'A recording row on Today: the phrase at its fixed pitch, as wide as the row.', props: { size: 'row' } },
  { name: 'Big', note: 'The capture screen: 96px tall, full width; the same pitch, the bars taller.', props: { size: 'big' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a row wider than the phrase, which repeats from its start.', props: { size: 'row' }, width: 1600 },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: the wave carries no text; a narrow row shows the first bars.', props: { size: 'row' }, width: 60 },
];
