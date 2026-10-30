// Copy from the screens (Today, 03-talk, account). The long and non-Latin fixtures are stress
// tests, not product copy. A past day or an answer carries no wordmark, so its value is the h1.
export default [
  { name: 'Default', state: 'default', note: 'The handwritten date, written in on arrival (Today).', props: { key: 'Today', value: 'Sun 9 Aug ’26', date: 'hand', valueTag: 'span' } },
  { name: 'Printed', note: 'A printed value, never written in (account labels, prices).', props: { key: 'Account', value: 'Your journal', date: 'printed' } },
  { name: 'Page heading', note: 'The date box names the page, so the value is the h1 (a past day).', props: { key: 'Day', value: "Sun 9 Aug '26", date: 'hand', valueTag: 'h1' } },
  { name: 'Printed page heading', note: 'A printed value that is also the h1.', props: { key: 'Day', value: 'Sun 9 Aug ’26', date: 'printed', valueTag: 'h1' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long key and value.', props: { key: 'Keeping since the beginning', value: 'Wednesday 29 September 2027, a very long evening written by hand', date: 'hand' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { key: 'День 日', value: 'воскресенье 9 августа 2026 ・ 2026年8月9日', date: 'hand' } },
];
