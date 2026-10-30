// Copy from the screens (01-today, 10-settings-privacy). The long and non-Latin fixtures are stress
// tests, not product copy. Rows are built with use(), as on the screens.
export default ({ html, use }) => {
  const entry = (time, text) => use('srow', { time }, { children: html`<p class="prose">${text}</p>` });
  const today = html`${entry('09:20', 'The flat people said Tuesday, and it\'s Sunday, so I\'ve decided not to think about it until Tuesday.')}${use('said', { label: 'From your record', note: 'You wrote something close to this in March, about the job.' })}${entry('21:40', 'Priya rang. We talked for an hour about nothing.')}`;
  const settings = html`${use('shead', { text: 'Privacy' })}${use('srowlink', { href: '#', label: 'Memory', value: 'On' })}${use('srowlink', { href: '#', label: 'Export your journal' })}`;
  return [
    { name: 'Today', state: 'default', note: 'A day: entries and a note, each ruled off above (01-today).', props: { tag: 'main' }, slots: { children: today } },
    { name: 'Settings', note: 'A section head and settings rows (10-settings-privacy).', props: { tag: 'div' }, slots: { children: settings } },
    { name: 'Account', note: 'The account sheet (17-account-data): on the auth spread it holds the context and the region; its content column is 440, centred.', props: { tag: 'main', form: 'account' }, slots: { children: settings } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long entry.', props: {}, slots: { children: entry('23:59', 'A very long entry that runs on and on about the whole of a long day, the walk, the phone call, the email read three times over and the decision not to think about it until Tuesday.') } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: {}, slots: { children: html`${entry('09:20', 'Сегодня был тихий день. 今日は静かな日でした。')}${entry('21:40', 'Позвонила Прия. プリヤから電話。')}` } },
  ];
};
