// Copy from the screens (17-account-data). The card is built with use('card'), its actions with
// use('button'), as on the screen.
export default ({ html, use }) => {
  const actions = html`${use('button', { grade: 'solid', href: '#', label: 'Export instead' })}${use('button', { grade: 'keyline', href: '#', label: 'Delete everything' })}${use('button', { grade: 'quiet', href: '#', label: 'Keep my account' })}`;
  const confirm = [
    'This deletes your account, 148 entries and 31 recordings, including items deleted earlier. You will be signed out everywhere. It cannot be undone.',
    'Export first if you want a copy.',
  ];
  const card = (titleId, paragraphs) => use('card', { level: 3, title: 'Delete everything?', titleId, paragraphs }, { actions });
  return [
    { name: 'Confirmation', note: 'The delete-everything confirmation (17-account-data).', props: { labelledBy: 'delete-account-heading' }, slots: { children: card('delete-account-heading', confirm) } },
    { name: 'Failed', state: 'error', note: 'The failed-delete state: the card carries a status paragraph (17-account-data).', props: { labelledBy: 'account-delete-failed-heading' }, slots: { children: card('account-delete-failed-heading', [confirm[0], { text: 'We could not reach the server. Nothing was deleted.', status: true }, confirm[1]]) } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long heading and long paragraphs.', props: { labelledBy: 'long-heading' }, slots: { children: use('card', { title: 'Delete everything, including your recordings and everything kept on this device?', titleId: 'long-heading', paragraphs: [confirm[0] + ' ' + confirm[0], confirm[0]] }, { actions }) } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { labelledBy: 'non-latin-heading' }, slots: { children: use('card', { title: 'Удалить всё? すべて削除しますか?', titleId: 'non-latin-heading', paragraphs: ['Это удалит вашу учётную запись, 148 записей и 31 запись голоса. 取り消すことはできません。アカウント、148件のエントリー、31件の録音が削除されます。'] }, { actions }) } },
  ];
};
