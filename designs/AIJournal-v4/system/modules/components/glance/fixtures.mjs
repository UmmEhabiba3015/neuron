// Copy from the screens (01-today, desktop 04-ask). The long and non-Latin fixtures are stress tests, not
// product copy.
export default [
  { name: 'Default', note: 'As on the designed screen (01-today).', props: { tag: 'p', line: 'Sleep has come up on four of the last six days.' } },
  { name: 'Heading', note: 'The h1 form, as on desktop 04-ask.', props: { tag: 'h1', line: "What do I write about when I can't sleep?" } },
  { name: 'Restated', note: 'The user\'s own question in the glance\'s slot, without the typed line (04-ask, the answer).', props: { line: 'What do I write about when I can\'t sleep?', restated: true } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { line: 'Sleep has come up on four of the last six days, and on three of those the entry before it mentions work running late.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { line: 'Сон упоминался в четырёх из последних шести дней。 過去6日のうち4日で睡眠について書かれています。' } },
];
