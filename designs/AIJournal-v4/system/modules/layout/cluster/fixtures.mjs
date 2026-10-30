// The gap is the owner's (--aj-l-cluster-gap); the children are plain boxes. The long and non-Latin
// fixtures are stress tests, not product copy.
const box = (text, place) => `<span${place ? ` data-place="${place}"` : ''} style="border:1px solid currentColor;padding:4px">${text}</span>`;
export default ({ raw }) => [
  { name: 'Default', note: 'Children side by side, wrapping when the row runs out of room.', props: { tag: 'div' }, slots: { children: raw(box('Save') + box('Cancel') + box('Delete')) } },
  { name: 'Nav', note: 'Drawn as a nav, the way the auth preview lists its links.', props: { tag: 'nav' }, slots: { children: raw(box('Incorrect details') + box('Logging in') + box('Session expired')) } },
  { name: 'Grow and fixed', note: 'data-place="grow" takes the room left; data-place="fixed" keeps its own size.', props: {}, slots: { children: raw(box('Add to today', 'grow') + box('Save', 'fixed')) } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: {}, slots: { children: raw(box('A very long action label that has to wrap onto the next line') + box('Another long label')) } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: {}, slots: { children: raw(box('Сохранить') + box('キャンセル', 'fixed')) } },
];
