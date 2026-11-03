// dest: <Destinations links current form slot /> in the developers' code. The web's five (v4 B7); the pages
// pass system/content/destinations.mjs.
const LINKS = [
  { label: 'Today', href: '#today', key: 'today' },
  { label: 'Reflections', href: '#reflections', key: 'reflections' },
  { label: 'Timeline', href: '#timeline', key: 'timeline' },
  { label: 'Ask', href: '#ask', key: 'ask' },
  { label: 'You', href: '#you', key: 'you' },
];
export default function render({ links = LINKS, current = 'today', form = 'row', slot = false } = {}, slots, { html, attrs }) {
  const items = links.map((l, i) => html`<a href="${l.href}"${attrs({ 'aria-current': (l.key || LINKS[i]?.key) === current ? 'page' : false })}>${l.label}</a>`);
  if (slot) items.splice(items.length - 1, 0, html`<span class="aj-c-dest__slot" aria-hidden="true"></span>`);
  return html`<nav class="aj-c-dest"${attrs({ 'data-form': form === 'tab' ? 'tab' : false, 'data-slot': slot ? 'true' : false, 'aria-label': 'Destinations' })}>${items}</nav>`;
}
