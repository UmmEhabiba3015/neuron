// Copy from the screens (the settings list). The long and non-Latin fixtures are stress tests,
// not product copy.
export default [
  { name: 'Default', note: 'As in the settings list.', props: { label: 'Privacy', value: 'Read it', why: 'What is sent, who processes it, and how long it is kept.', href: '00-prototype.html#settings-privacy' } },
  { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base).', props: { label: 'Your data', value: '148 and 31', why: 'Export entries and recordings, or delete the account and everything in it.', href: '00-prototype.html#settings-data' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { label: 'A setting with a label long enough to need several lines on a narrow screen', value: 'a-very-long-account-name@example-domain-name.com', why: 'A deliberately long explanation that runs well past the reading measure so that it wraps over several lines inside the row and shows how the label and value share the width.', href: '#' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { label: 'プライバシー · Конфиденциальность', value: '読む', why: 'Что отправляется, кто это обрабатывает и как долго хранится · 送信される内容', href: '#' } },
];
