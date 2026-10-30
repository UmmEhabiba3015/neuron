// Copy from the screens (02-timeline, 04-ask, 05-reflection, 18-entry-system-states). The long and
// non-Latin fixtures are stress tests, not product copy.
export default [
  { name: 'Default', note: 'As on the designed screens (02-timeline, 04-ask, 05-reflection).', props: { text: 'Since March 2026' } },
  { name: 'Loading', tags: ['loading'], note: 'The status line while earlier entries load (18-entry-system-states).', props: { text: 'Fetching earlier entries.' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { text: 'Mood can be changed here, and only here, and nowhere else in the journal, whichever screen you are on.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { text: '2026年3月から · С марта 2026' } },
];
