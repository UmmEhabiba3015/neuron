// Copy from the screens (04-ask, 15-auth-states, 18-entry-system-states). The non-Latin
// fixture is a stress test: the 04-ask notice in Russian and Japanese, not product copy.
export default ({ use }) => [
  { name: 'With an action', note: 'A control after the text on the same line (05-reflection).', props: { text: 'You asked for this once a week, on Sunday evenings.' }, slots: { action: use('button', { grade: 'quiet', label: 'Change that' }) } },
  { name: 'Part of the page', note: 'Present from the start (04-ask).', props: { text: '4 entries were kept out of memory and were not read.' } },
  { name: 'Announced', note: 'The outcome of something the user just did: role="status" (18-entry-system-states).', props: { announce: true, text: 'Your 0:47 recording is kept as audio.' } },
  { name: 'Long', tags: ['long'], note: 'The longest notice in the product (15-auth-states).', props: { announce: true, text: 'If an account exists for mubeen@example.com, a reset link has been sent. It works for 30 minutes and can be used once.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { text: '4 записи не попали в память и не были прочитаны. 4件のエントリーは記憶から外され、読まれませんでした。' } },
];
