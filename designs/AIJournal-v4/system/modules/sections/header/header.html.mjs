// header: <Header form>{mast}{destinations}</Header> in the developers' code. Two forms. static (default)
// is the numbered comps' wrapper: the masthead and the destinations as they are, nothing added. navbar is
// the quiet navbar's end state: the masthead (role head) whose wordmark and date are aria-hidden
// placeholders, the destinations (role nav) with their date slot, and its two parts, the compact wordmark
// (brand) and the compact date (date), which header.js lays over the destinations. The wordmark and the
// date come from the masthead it is given, so a screen's own words are carried over unchanged. A navbar
// masthead with no wordmark, or a row that is not the five destinations, renders no parts. The date is
// written in three parts, its edges (the weekday, the year) around its core (9 Aug): where the full date
// cannot be drawn at the destinations' size, header.js fades the edges and lays the core alone (v4 B7).
const MAST = /<header\b[\s\S]*?<\/header>/;
const NAV = /<nav\b[\s\S]*?<\/nav>/;
const WORDMARK = /<h1\b[^>]*>[\s\S]*?<\/h1>/;
const DATED = /\b\d{1,2}\s+[A-Za-z]{3}\s+['’]\d{2}\b/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const text = tag => tag.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
// The aria-hidden copy that holds the place of an element the header's part now draws.
const placeholder = tag => tag.replace(/^<(\w+)\b([^>]*)>/, (all, name, rest) => `<${name}${rest.replace(/\sid="[^"]*"/, '')} aria-hidden="true" data-held>`);
const withRole = (tag, role) => /\sdata-place=/.test(tag.match(/^<[^>]*>/)[0]) ? tag : tag.replace(/^<(\w+)\b/, `<$1 data-place="${role}"`);
const isoDate = value => {
  const parsed = value.match(/(\d{1,2})\s*([A-Za-z]{3})\s*['’]?(\d{2,4})/);
  if (!parsed || !MONTHS.includes(parsed[2])) return '';
  return `${parsed[3].length === 2 ? '20' : ''}${parsed[3]}-${String(MONTHS.indexOf(parsed[2]) + 1).padStart(2, '0')}-${parsed[1].padStart(2, '0')}`;
};

export default function render({ form = 'static' } = {}, slots, { html, raw, attrs }) {
  const source = String(slots.children ?? '');
  let mast = source.match(MAST)?.[0] ?? '';
  let nav = source.match(NAV)?.[0] ?? '';
  const brand = mast.match(WORDMARK)?.[0] ?? '';
  const quiet = form === 'navbar' && !!brand && (nav.match(/<a\b/g) || []).length === 5;
  let date = '';
  if (quiet) {
    const value = [...mast.matchAll(/<span\b[^>]*>([^<]*)<\/span>/g)].find(m => DATED.test(m[1]));
    mast = mast.replace(brand, () => placeholder(brand));
    if (value) {
      mast = mast.replace(value[0], () => placeholder(value[0]));
      const full = text(value[0]), iso = isoDate(full);
      const [, before, core, after] = full.match(/^(.*?)(\d{1,2}\s+[A-Za-z]{3})(.*)$/) || [, '', full, ''];
      const edge = s => s ? `<span class="aj-s-header__edge">${s}</span>` : '';
      date = `<time class="aj-s-header__date"${iso ? ` datetime="${iso}"` : ''}>${edge(before)}<span class="aj-s-header__core">${core}</span>${edge(after)}</time>`;
    }
    if (!/aj-c-dest__slot/.test(nav)) {
      nav = nav.replace(/^<nav\b/, '<nav data-slot="true"');
      nav = nav.slice(0, nav.lastIndexOf('<a')) + '<span class="aj-c-dest__slot" aria-hidden="true"></span>' + nav.slice(nav.lastIndexOf('<a'));
    }
  }
  const part = quiet ? `${date}\n${brand.replace(/\bclass="([^"]*)"/, 'class="$1 aj-s-header__brand"')}` : '';
  return html`<div class="aj-s-header"${attrs({ 'data-form': form === 'navbar' ? 'navbar' : false, 'data-module': 'header' })}>\n${raw(mast ? withRole(mast, 'head') : '')}\n${raw(nav ? withRole(nav, 'nav') : '')}${raw(part ? `\n${part}` : '')}\n</div>`;
}
