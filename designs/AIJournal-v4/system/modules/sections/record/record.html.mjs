// record: <Record items moods marks message arrive /> in the developers' code.
// The Timeline's record (v4 C1): the list's sheet with its rows as the old design draws them (month headings;
// a day's writing, its lede and any mark; a recording, its player, then its transcript row and its tools: delete
// and, if kept out of memory, the memory tag), and the layer the jump's arrival is drawn on (record.js). Every row carries its day
// (data-day); a day's first row its anchor id and its mood (data-mood), which the arrival reads.
// items: as Timeline's data.mjs ({ kind: month | day | recording, ... }), newest first (a recording's waveform is the
// wave's own). marks: the words a search found, marked in the writing (the page passes
// only the matching days). message: { heading, text } in place of the rows (no matches).
import { DELETE } from '../../../content/icons.mjs';

const escape = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// The words found, marked: matched case-insensitively from a word's start; the user's own text stays as written.
const marked = (text, words, raw) => {
  if (!words?.length) return text;
  const re = new RegExp(`(\\b(?:${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\w*)`, 'gi');
  return raw(escape(text).replace(re, '<mark>$1</mark>'));
};

export default function render({ items = [], moods = {}, marks = [], message = null, arrive = '', deleteHref = '00-prototype.html#recording-delete-confirm' } = {}, slots, { html, raw, attrs, use }) {
  let day = '';
  const seen = new Set();
  const tools = item => use('entry-actions', { kind: 'recording', excluded: item.excluded, place: 'tools' }, {
    children: use('button', { grade: 'quiet', form: 'icon', href: deleteHref, label: 'Delete voice memo', data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) }),
  });
  const row = item => {
    if (item.kind === 'month') return use('shead', { text: item.text });
    if (item.datetime) day = item.datetime;
    const first = day && !seen.has(day);
    if (first) seen.add(day);
    const data = { day, ...(first && moods[day] ? { mood: moods[day] } : {}) };
    const anchor = item.id ? { id: item.id } : {};
    if (item.kind === 'day') return use('dayrow', { date: item.date, datetime: item.datetime, attrs: anchor, data }, {
      children: html`${use('text', { form: 'lede', text: marked(item.text, marks, raw) })}${item.mark ? use('mark', { label: item.mark, place: 'after' }) : ''}`,
    });
    return use('recrow', { head: 'dated', time: item.date, datetime: item.datetime, duration: item.duration, transcript: item.transcript, attrs: anchor, data }, {
      player: html`${use('play', { label: item.play })}${use('wave')}`,
      children: tools(item),
    });
  };
  const rows = message
    ? html`${use('shead', { text: message.heading })}${use('srow', {}, { children: use('text', { form: 'lede', text: message.text }) })}`
    : html`${items.map(row)}`;
  return html`<div class="aj-s-record" data-module="record"${attrs({ 'data-jump': arrive || false })}>${use('sheet', { mix: 'sheet' }, { children: rows })}<div class="aj-s-record__marks" aria-hidden="true"></div></div>`;
}
