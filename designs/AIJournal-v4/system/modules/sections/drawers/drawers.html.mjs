// drawers: <Drawers id today current days bookmarks count open copy /> in the developers' code.
// Ask's History and Bookmarks (v4 C2, explore ask-readable a-mirror-bubble, as revised): their two pills (History;
// Bookmarks with the open day's count) and the one dimmed layer that holds both drawers, History from the left (to
// the rail's edge on the desktop), Bookmarks from the right, open together if wanted. Each pill has a lit copy in
// the layer that the script lays over it, so the other drawer can open over the dim.
// days: the days with chats ({ date, lede, sessions }); the history folds them (system/content/ask-history.mjs).
// bookmarks: { day: "Today, Sunday 9 August", items: [{ id, voice, text, meta }] }. open: { history, bookmarks } draws
// a drawer open without the script (the numbered comps); the root then says so (data-drawn), so the chat lets the
// layer cover the screen rather than its sticky head row.
import { HISTORY, BOOKMARK_SOLID, CHEVRON } from '../../../content/icons.mjs';
import { historyOf, groupsOf } from '../../../content/ask-history.mjs';
const COPY = {
  history: 'History', bookmarks: 'Bookmarks', close: 'Close', layer: 'History and bookmarks',
  today: 'Today', week: 'This week', earlier: 'Earlier', none: 'No chats yet.',
  part: 'Part of a week: the rest is in the next month.', aWeek: 'A week', weeks: 'Weeks of this month', months: 'Months of this year',
  empty: 'No bookmarks on this day. Bookmark a message to find it here.',
};
const BACK = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M7.5 2l-4 4 4 4"/></svg>';

export default function render({ id = 'ask-drawers', today = '', current = '', days = [], bookmarks = {}, count, open = {}, copy = {} } = {}, slots, { html, raw, attrs, use, el }) {
  const c = { ...COPY, ...copy }, tree = historyOf(days, today), groups = groupsOf(tree);
  const marks = bookmarks.items || [], n = typeof count === 'number' ? count : marks.length;
  const pill = (key, expanded, place) => key === 'history'
    ? use('button', { form: 'pill', label: c.history, expanded, hook: 'history', place, attrs: { 'aria-haspopup': 'dialog', 'aria-controls': `${id}-history` } }, { icon: raw(HISTORY) })
    : use('button', { form: 'pill', label: c.bookmarks, count: n, expanded, hook: 'bookmarks', place, attrs: { 'aria-haspopup': 'dialog', 'aria-controls': `${id}-bookmarks` } }, { icon: raw(BOOKMARK_SOLID) });
  const item = x => x.type === 'day'
    ? html`<li><button class="${el('item')}" type="button"${attrs({ 'data-date': x.key, 'aria-current': x.key === current ? 'true' : 'false' })}><span><span class="${el('name')}">${x.name}</span><span class="${el('lede')}">${x.lede}</span></span><span class="${el('count')}">${x.count}</span></button></li>`
    : html`<li><button class="${el('item')}" type="button" data-node="${x.key}"><span><span class="${el('name')}">${x.name}${x.type === 'month' && x.year !== today.slice(0, 4) ? ` ${x.year}` : ''}</span>${x.lede ? html`<span class="${el('lede')}" data-quiet>${x.lede}</span>` : ''}</span><span class="${el('count')}">${x.count}${raw(CHEVRON)}</span></button></li>`;
  const list = xs => html`<ul class="${el('list')}">${xs.map(item)}</ul>`;
  const head = word => html`<p class="${el('group')}">${word}</p>`;
  const top = html`<div class="${el('level')}" data-level="">${tree.today ? html`${head(c.today)}${list([tree.today])}` : ''}${tree.week.length ? html`${head(c.week)}${list(tree.week)}` : ''}${tree.earlier.length ? html`${head(c.earlier)}${list(tree.earlier)}` : ''}${!tree.today && !tree.week.length && !tree.earlier.length ? html`<p class="${el('empty')}">${c.none}</p>` : ''}</div>`;
  const nameOf = key => { const g = groups.find(x => x.key === key); return g ? `${g.name}${g.type === 'month' ? ` ${g.year}` : ''}` : c.history; };
  const level = g => html`<div class="${el('level')}"${attrs({ 'data-level': g.key, 'data-parent': g.parent, hidden: true })}><button class="${el('back')}" type="button" data-back>${raw(BACK)}${g.parent ? nameOf(g.parent) : c.history}</button><p class="${el('crumb')}">${g.name}${g.type === 'month' ? ` ${g.year}` : ''}</p><p class="${el('sub')}">${g.type === 'week' ? (g.part ? c.part : c.aWeek) : g.type === 'month' ? c.weeks : c.months} · ${g.count}</p>${list(g.children)}</div>`;
  const mark = b => html`<li><button class="${el('mark')}" type="button" data-jump="${b.id}">${raw(BOOKMARK_SOLID)}<span><span class="${el('text')}"${attrs({ 'data-voice': b.voice === 'answer' ? 'answer' : false })}>${b.text}</span><span class="${el('meta')}">${b.meta}</span></span></button></li>`;
  const panel = (key, side, title, body) => html`<section class="${el('panel')}"${attrs({ id: `${id}-${key}`, 'data-side': side, 'data-key': key, 'aria-label': title, 'data-open': !!open[key], hidden: !open[key] })}><div class="${el('head')}"><h2 class="${el('title')}">${title}</h2>${use('button', { form: 'pill', label: c.close, hook: 'close' })}</div>${body}</section>`;
  const history = panel('history', 'left', c.history, html`<div class="${el('levels')}" data-hook="levels">${top}${groups.map(level)}</div>`);
  const marked = panel('bookmarks', 'right', c.bookmarks, html`<p class="${el('day')}" data-hook="day">${bookmarks.day || ''}</p><div class="${el('marks')}" data-hook="marks">${marks.length ? html`<ul class="${el('list')}">${marks.map(mark)}</ul>` : html`<p class="${el('empty')}">${c.empty}</p>`}</div>`);
  const shown = open.history || open.bookmarks;
  return html`<div class="aj-s-drawers" data-module="drawers"${attrs({ 'data-drawn': !!shown })}><span class="${el('pills')}">${pill('history', !!open.history)}${pill('bookmarks', !!open.bookmarks)}</span><dialog class="${el('layer')}"${attrs({ 'aria-label': c.layer, open: !!shown, 'data-open': !!shown })}>${history}${marked}<div class="${el('lit')}" hidden>${pill('history', !!open.history, 'lit')}${pill('bookmarks', !!open.bookmarks, 'lit')}</div></dialog></div>`;
}
