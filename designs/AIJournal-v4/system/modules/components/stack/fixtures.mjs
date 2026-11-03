// Copy from the screens (03-talk, 17-account-data). The long and non-Latin fixtures are stress
// tests, not product copy. Children are built with use(), as on the screens.
export default ({ html, use }) => {
  const kept = use('keybox', { key: 'Kept', value: 'Sun 9 Aug, 21:58', date: 'printed', valueTag: 'h1' });
  const row = html`<div class="aj-c-stack__row">${use('button', { grade: 'keyline', href: '#', label: 'Back to today' })}</div>`;
  const card = (title, paragraphs) => use('card', { level: 3, title, paragraphs }, { actions: use('button', { grade: 'solid', href: '#', label: 'Export instead' }) });
  return [
    { name: 'Kept recording', state: 'default', note: 'The kept recording page: a date box and a row with one button (03-talk).', props: {}, slots: { children: html`${kept}${row}` } },
    { name: 'With a card', note: 'A card inside the stack: full column, start-aligned prose (17-account-data).', props: {}, slots: { children: card('Delete everything?', ['Export first if you want a copy.']) } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long date box value and a long card heading.', props: {}, slots: { children: html`${use('keybox', { key: 'Keeping since the beginning', value: 'Wednesday 29 September 2027, a very long evening written by hand', date: 'printed', valueTag: 'h1' })}${card('Delete everything, including your recordings and everything kept on this device?', ['Export first if you want a copy.'])}` } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: {}, slots: { children: html`${use('keybox', { key: 'День 日', value: 'воскресенье 9 августа 2026 ・ 2026年8月9日', date: 'printed', valueTag: 'h1' })}${row}` } },
  ];
};
