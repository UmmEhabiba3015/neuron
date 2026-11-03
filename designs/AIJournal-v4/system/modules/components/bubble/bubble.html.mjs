// bubble: <Bubble voice id paras refs used status cant unsent bookmarked rating asking flag next labels /> in the developers' code.
// A message in Ask (v4 C2, explore ask-readable a-mirror-bubble): yours on the right, the answer on the left and
// wider, mirroring it. The answer's {n} marks become its references, links to the day; "entries used" lists them.
// The tools are button's icon form with a tool; the answer's thumbs are the thumbs component (its form hidden until pressed).
import { BOOKMARK, COPY, CHEVRON, NOT_FOUND } from '../../../content/icons.mjs';
const GLYPH = { bookmark: BOOKMARK, copy: COPY };
const WORDS = { you: 'Your message', answer: 'Answer', bookmark: 'Bookmark', copy: 'Copy', copied: 'Copied', up: 'Helpful', down: 'Not helpful' };
export default function render({ voice = 'you', id = '', paras = [], refs = [], used = '', status = 'done', cant = false, unsent = false, bookmarked = false, rating = 'none', asking = false, flag = 'Not in your journal', next = null, unsentLabel = 'Not sent', reading = 'Reading your journal', labels = {} } = {}, slots, { html, raw, attrs, use, el }) {
  const answer = voice === 'answer', w = { ...WORDS, ...labels };
  const writing = answer && status === 'writing', done = !answer || status === 'done';
  // a run of words: while writing, each word its own span so it arrives softly
  const words = text => writing ? text.split(/(\s+)/).map(s => /^\s*$/.test(s) ? s : html`<span class="${el('w')}">${s}</span>`) : text;
  const para = p => html`<p>${p.split(/\{(\d+)\}/).map((part, i) => {
    if (i % 2 === 0) return words(part);
    const r = answer && refs[Number(part) - 1];
    return r ? html` <span class="${el('refw')}">(<a class="${el('ref')}" href="${r.href}">${r.short}</a>)</span>` : '';
  })}</p>`;
  const text = answer && status === 'reading'
    ? html`<p class="${el('reading')}" role="status"><span>${reading}</span><i></i><i></i><i></i></p>`
    : html`<div class="${el('text')}" data-hook="text">${paras.map(para)}</div>`;
  const tool = k => use('button', { grade: 'quiet', form: 'icon', tool: k, label: w[k], pressed: k === 'bookmark' && bookmarked }, { icon: raw(GLYPH[k]) });
  // asking: the thumbs-down form drawn open without the script (the page's comps), its thumb expanded
  const rate = answer && !cant ? use('thumbs', { id, rating, asking, labels: { up: w.up, down: w.down } }) : '';
  const tools = unsent || !done ? '' : html`<div class="${el('tools')}" role="group" aria-label="${answer ? w.answer : w.you}" data-copied-label="${w.copied}">${['bookmark', 'copy'].map(tool)}${rate}</div>`;
  const flagged = answer && cant ? html`<p class="${el('flag')}">${raw(NOT_FOUND)}${flag}</p>` : '';
  const after = answer && cant && next && done ? html`<p class="${el('next')}"><a href="${next.href}">${next.label}</a></p>` : '';
  const list = answer && refs.length && done ? html`<details class="${el('used')}"><summary>${used}${raw(CHEVRON)}</summary><ul>${refs.map(r => html`<li><a href="${r.href}">${r.text}<small>${r.long}</small></a></li>`)}</ul></details>` : '';
  const root = attrs({ 'data-module': 'bubble', 'data-voice': voice, id: id || false, tabindex: id ? '-1' : false, 'data-cant': answer && cant, 'data-unsent': !answer && unsent, 'data-status': answer && status !== 'done' ? status : false });
  if (answer) return html`<div class="aj-c-bubble"${root}><div class="${el('in')}">${flagged}${text}${after}${list}${tools}</div></div>`;
  return html`<div class="aj-c-bubble"${root}><div class="${el('in')}">${text}</div>${unsent ? html`<p class="${el('unsent')}">${unsentLabel}</p>` : tools}</div>`;
}
