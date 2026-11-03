// Copy from the screens (13-login, 14-register). The spread's grid, padding and card exist only
// inside the plain-paper auth shell (legacy context .auth-paper), so on the catalogue page the sides
// read as a plain column. The long and non-Latin fixtures are stress tests, not product copy.
export default ({ html, use }) => {
  const ways = [{ label: 'Write', text: 'A few lines when you need them.' }, { label: 'Look back', text: 'Your days, newest first.' }, { label: 'Record', text: 'Leave a voice memo in your journal.' }];
  // The page puts the auth-form section in the region; a section never renders another section.
  const form = html`<p>The sign-in form (the auth-form section) goes here.</p>`;
  return [
    { name: 'Sign in', state: 'default', note: 'The spread: the context with the three ways, and the region holding the sign-in form (13-login).', props: { title: 'Your journal, kept for you', copy: 'Write, look back, record.', ways }, slots: { children: form } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long title and copy.', props: { title: 'A journal that keeps everything you write and record, for as long as you keep it', copy: 'A very long line of copy that has to wrap within the measure of the context side.', ways }, slots: { children: form } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { title: 'Ваш дневник 日記', copy: 'Пишите. 書く。', ways: [{ label: 'Писать', text: '書く' }] }, slots: { children: form } },
  ];
};
