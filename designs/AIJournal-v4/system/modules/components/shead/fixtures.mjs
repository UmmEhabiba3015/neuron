// Copy from the screens (the Plan and You sections). The long and non-Latin fixtures are stress
// tests, not product copy.
export default [
  { name: 'Level 2', note: 'An h2 under the page heading.', props: { level: 2, text: 'Your plan' } },
  { name: 'Level 3', note: 'An h3 inside a section that already has an h2.', props: { level: 3, text: 'Your plan' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { level: 2, text: 'Everything kept on this device and everything in your account from last month' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { level: 2, text: 'Ваш план · 設定' } },
];
