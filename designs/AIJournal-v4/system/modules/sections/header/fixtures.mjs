// Copy from the screens (01-today, 02-timeline). The masthead's second-row object (the date box) is
// rendered by its own module, placed as the masthead's tool; the header carries it over as it is.
export default ({ use }) => {
  const KEYBOX = use('keybox', { key: 'Day', value: "Sun 9 Aug '26", date: 'hand', place: 'tool' });
  const KEYBOX_TODAY = use('keybox', { key: 'Day', value: 'Today', date: 'hand', place: 'tool' });
  const header = (wordmark, second, current, slot = true) => ({ children: [use('mast', { wordmark }, { children: second }), use('dest', { current, slot })].join('') });
  return [
    { name: 'Static', note: 'The numbered comps form: the masthead and the destinations as they are, nothing added (01-today).', props: { form: 'static' }, slots: header('Journal', KEYBOX, 'today', false) },
    { name: 'Today', state: 'default', props: { form: 'navbar' }, note: 'Expanded at the reading end: the masthead with the dated box over the destinations (01-today).', slots: header('Journal', KEYBOX, 'today') },
    { name: 'Undated', props: { form: 'navbar' }, note: 'The box holds no date, so the header draws the compact wordmark only (You).', slots: header('Journal', KEYBOX_TODAY, 'you') },
    { name: 'Compact', props: { form: 'navbar' }, state: 'selected', note: 'Compact while the reader is away from its end: header.js sets data-state="compact" when the app sets data-reading="away".', slots: header('Journal', KEYBOX, 'today') },
  ];
};
