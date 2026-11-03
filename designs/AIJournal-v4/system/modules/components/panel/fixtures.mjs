// Copy from the screens (17-account-data for the card). The card is built with use('card'), its
// actions with use('button'), as on the screen. The long and non-Latin fixtures are stress tests,
// not product copy.
export default ({ html, use }) => {
  const actions = html`${use('button', { grade: 'solid', href: '#', label: 'Export instead' })}${use('button', { grade: 'keyline', href: '#', label: 'Delete everything' })}${use('button', { grade: 'quiet', href: '#', label: 'Keep my account' })}`;
  const confirm = [
    'This deletes your account, 148 entries and 31 recordings, including items deleted earlier. You will be signed out everywhere. It cannot be undone.',
    'Export first if you want a copy.',
  ];
  const row = use('cluster', { place: 'actions' }, { children: html`${use('button', { grade: 'solid', href: '#', label: 'Try again' })}${use('button', { grade: 'quiet', href: '#', label: 'Close' })}` });
  const card = (title, titleId, paragraphs) => use('card', { level: 3, title, titleId, paragraphs }, { actions });
  return [
    { name: 'Default', note: 'A panel holding a card (copy from 17-account-data).', props: { title: 'Composer options' }, slots: { children: card('Delete everything?', 'panel-card-heading', confirm) } },
    { name: 'Actions', note: 'An action row under the panel copy (18-entry-system-states): the panel places it (actions) --s7 below, --s4 by --s7 apart.', props: { title: 'Recording not saved' }, slots: { children: html`<p>We could not send this recording.</p>${row}` } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long heading and long card copy.', props: { title: 'Composer options, including everything kept on this device and everything sent to the server' }, slots: { children: card('Delete everything, including your recordings and everything kept on this device?', 'panel-long-heading', [confirm[0] + ' ' + confirm[0], confirm[0]]) } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { title: 'Параметры записи 録音の設定' }, slots: { children: card('Удалить всё? すべて削除しますか?', 'panel-non-latin-heading', ['Это удалит вашу учётную запись, 148 записей и 31 запись голоса. 取り消すことはできません。']) } },
  ];
};
