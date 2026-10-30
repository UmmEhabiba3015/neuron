// Copy from the screens (the Today page). The long and non-Latin fixtures are stress tests,
// not product copy.
export default [
  { name: 'Default', note: 'As on the Today page.', props: { text: "What's today been like?" } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { text: 'Nothing here yet. Once you have written or recorded a few more entries, what they have in common will show up in this place.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { text: 'Каким был ваш день? 今日はどんな一日でしたか?' } },
];
