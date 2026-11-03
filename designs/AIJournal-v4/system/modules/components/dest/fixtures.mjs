// Copy from the screens (01-today, 02-timeline, 04-ask, 05-reflection and the native app's tab bar).
// The long and non-Latin fixtures are stress tests, not product copy.
const LINKS = [
  { label: 'Today', href: '#today', key: 'today' },
  { label: 'Reflections', href: '#reflections', key: 'reflections' },
  { label: 'Timeline', href: '#timeline', key: 'timeline' },
  { label: 'Ask', href: '#ask', key: 'ask' },
  { label: 'You', href: '#you', key: 'you' },
];
// The native app keeps its own four until app development starts (v4 B7 is the web's).
const APP = LINKS.filter(l => l.key !== 'reflections');
const relabel = (labels) => LINKS.map((l, i) => ({ ...l, label: labels[i] }));
export default [
  { name: 'Today', note: 'The row on Today (01-today); Today is filled.', props: { current: 'today' } },
  { name: 'Reflections', note: 'The row on Reflections (05-reflection), next to Today.', props: { current: 'reflections' } },
  { name: 'Timeline', note: 'The row on Timeline (02-timeline).', props: { current: 'timeline' } },
  { name: 'Ask', note: 'The row on Ask (04-ask).', props: { current: 'ask' } },
  { name: 'You', note: 'The row on You: the one set apart by the auto margin.', props: { current: 'you' } },
  { name: 'No current', note: 'A pushed page that sits under no destination: nothing filled.', props: { current: 'none' } },
  { name: 'Selected', state: 'selected', note: 'The current destination: aria-current="page", filled --block.', props: { current: 'timeline' } },
  { name: 'Hover', state: 'hover', note: 'An unselected destination on a pointer device darkens its keyline; drawn at rest here, hover it to see.', props: { current: 'today' } },
  { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base); tab to a destination to see it.', props: { current: 'today' } },
  { name: 'Active', state: 'active', note: 'Pressed: 1px down, scaled .97 under the shell; press a destination to see it.', props: { current: 'today' } },
  { name: 'Date slot', note: "The header's destinations: an empty aria-hidden slot before You, not drawn until a parent asks for it.", props: { current: 'today', slot: true } },
  { name: 'Tab bar', note: 'The native app tab bar (form tab): equal cells, You divided by a rule. It draws as a bar only inside the iOS shell (.app.ios). The app keeps its four.', props: { form: 'tab', current: 'today', links: APP } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: long labels.', props: { current: 'today', links: relabel(['Today and everything since you woke', 'Reflections on every week so far', 'Timeline of all your entries', 'Ask your journal anything', 'You and your account']) } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian, not product copy.', props: { current: 'today', links: relabel(['Сегодня', 'Итоги', 'Лента', 'Спросить', 'Вы']) } },
];
