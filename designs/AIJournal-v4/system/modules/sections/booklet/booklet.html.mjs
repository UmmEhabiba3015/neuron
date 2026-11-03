// booklet: <Booklet id label leaves at labels /> in the developers' code.
// The week's reflection as a small booklet (v4 C3, explore paper-story-cards d-booklet with booklet-feel f-mix): the
// leaves, their paper and lift, two stitches across the fold, the ribbon, and the pager under it. It renders its
// leaves itself, so a static screen opens on `at`: the leaf in view is data-pos now, the rest past or next and inert.
// On desktop the spread pairs a left leaf with the right one after it (the CSS shows the pair); live, the script turns.
const WORDS = { prev: 'Previous page', next: 'Next page', page: 'Page {a} of {n}', pages: 'Pages {a} and {b} of {n}', name: 'booklet' };
const PREV = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>';
const NEXT = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>';
export default function render({ id = 'booklet', label = '', leaves = [], at = 0, labels = {} } = {}, slots, { html, raw, attrs, use, el }) {
  const w = { ...WORDS, ...labels }, n = leaves.length, now = Math.max(0, Math.min(n - 1, at));
  const pos = i => i === now ? 'now' : i < now ? 'past' : 'next';
  const leaf = ({ id: key, name, picture, foot, ...props }, i) => use('leaf', { ...props, number: String(i + 1), place: 'leaf',
    data: { pos: pos(i), side: i % 2 ? 'r' : 'l' },
    attrs: { id: key ? `leaf-${key}` : false, 'aria-label': `${i + 1} of ${n}: ${name || (props.form === 'end' ? 'the end' : props.kicker)}`, inert: i !== now } },
    { picture: picture || '', foot: foot || '' });
  // the count for one leaf and for the spread that holds it; the container rule shows the one in force
  const pair = now - (now % 2), one = w.page.replace('{a}', now + 1).replace('{n}', n);
  const two = pair + 1 < n ? w.pages.replace('{a}', pair + 1).replace('{b}', pair + 2).replace('{n}', n) : w.page.replace('{a}', pair + 1).replace('{n}', n);
  const pager = n > 1 ? html`<div class="${el('nav')}"><button class="${el('arrow')}" type="button" data-hook="prev"${attrs({ 'aria-label': w.prev, disabled: now === 0 })}>${raw(PREV)}</button><span class="${el('count')}" data-hook="count" aria-live="polite"><span class="${el('one')}">${one}</span><span class="${el('two')}">${two}</span></span><button class="${el('arrow')}" type="button" data-hook="next"${attrs({ 'aria-label': w.next, disabled: now === n - 1 })}>${raw(NEXT)}</button></div>` : '';
  return html`<div class="aj-s-booklet" data-module="booklet" id="${id}" role="group" aria-roledescription="${w.name}" aria-label="${label}" data-at="${now}" data-page="${w.page}" data-pages="${w.pages}"><div class="${el('stack')}"><span class="${el('ribbon')}" aria-hidden="true"></span>${leaves.map(leaf)}</div>${pager}</div>`;
}
