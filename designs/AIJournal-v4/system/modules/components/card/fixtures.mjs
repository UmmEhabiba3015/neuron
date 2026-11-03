// Copy from the screens (17-account-data). Actions are button modules (use), as on the screen.
// The long and non-Latin fixtures are stress tests, not product copy.
const confirm = [
  'This deletes your account, 148 entries and 31 recordings, including items deleted earlier. You will be signed out everywhere. It cannot be undone.',
  'Export first if you want a copy.',
];
export default ({ html, use }) => {
const actions = html`${use('button', { grade: 'solid', href: '#', label: 'Export instead' })}${use('button', { grade: 'keyline', href: '#', label: 'Delete everything' })}${use('button', { grade: 'quiet', href: '#', label: 'Keep my account' })}`;
return [
  { name: 'Confirmation', note: 'The delete-everything confirmation (17-account-data).', props: { level: 3, title: 'Delete everything?', titleId: 'card-confirm-heading', paragraphs: confirm }, slots: { actions } },
  { name: 'Failed', state: 'error', note: 'The failed-delete state: the status paragraph looks like the others but is read out once (17-account-data).', props: { title: 'Delete everything?', titleId: 'card-failed-heading', paragraphs: [confirm[0], { text: 'We could not reach the server. Nothing was deleted.', status: true }, confirm[1]] }, slots: { actions } },
  { name: 'Level 2', note: 'The card carrying the first heading on the page (revision 48).', props: { level: 2, title: 'Delete everything?', paragraphs: [confirm[0]] }, slots: { actions } },
  { name: 'No actions', note: 'A card without a row of actions.', props: { title: 'Delete everything?', paragraphs: [confirm[1]] }, slots: {} },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long heading and long paragraphs.', props: { title: 'Delete everything, including your recordings and everything kept on this device?', paragraphs: [confirm[0] + ' ' + confirm[0], confirm[0]] }, slots: { actions } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { title: 'Удалить всё? すべて削除しますか?', paragraphs: ['Это удалит вашу учётную запись, 148 записей и 31 запись голоса. 取り消すことはできません。アカウント、148件のエントリー、31件の録音が削除されます。'] }, slots: { actions } },
];
};
