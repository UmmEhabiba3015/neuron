// leafpic: <LeafPic kind say caption days recs weeks /> in the developers' code.
// A Reflections leaf's picture (v4 C3, explore booklet-feel f-mix): drawn in ink, said aloud as one sentence.
import { WRITTEN, RECORDED } from '../../../content/icons.mjs';
const secs = len => { const [m, s] = String(len).split(':').map(Number); return m * 60 + s; };
export default function render({ kind = 'week', say = '', caption = '', days = [], recs = [], weeks = [], loading = false } = {}, slots, { html, raw, attrs, el, use }) {
  if (loading) return skeleton({ kind, caption, days, recs, weeks }, { html, el, use });
  const letters = html`<span class="${el('dow')}">${days.map(d => html`<span>${d.dow}</span>`)}</span>`;
  let art;
  if (kind === 'kept') {
    const cell = (d, k, icon) => d[k] ? html`<span class="${el('sq')}" data-on${attrs({ title: d.title || false })}>${raw(icon)}</span>` : html`<span class="${el('sq')}"></span>`;
    art = html`<span class="${el('kept')}">${days.map(d => html`<span>${d.dow}</span>`)}${days.map(d => cell(d, 'written', WRITTEN))}${days.map(d => cell(d, 'recorded', RECORDED))}</span>`;
  } else if (kind === 'recordings') {
    const top = Math.max(...recs.map(r => secs(r.len)));
    art = html`<span class="${el('bars')}">${recs.map(r => html`<span class="${el('bar')}"${attrs({ 'data-top': secs(r.len) === top })}><span>${r.day}</span><span class="${el('fill')}" style="--aj-c-leafpic-share:${(secs(r.len) / top).toFixed(3)}"></span><span>${r.len}</span></span>`)}</span>`;
  } else if (kind === 'weeks') {
    art = html`<span class="${el('weeks')}">${weeks.map(w => html`<span class="${el('col')}"${attrs({ 'data-current': !!w.current })}><span class="${el('rise')}" style="--aj-c-leafpic-share:${(w.n / 7).toFixed(3)}"></span><span>${w.label}</span></span>`)}</span>`;
  } else {
    art = html`${letters}<span class="${el('dots')}">${days.map(d => html`<span class="${el('dot')}"${attrs({ 'data-mood': d.mood || false, 'data-on': !!d.mood, 'data-day': d.day || false, 'data-today': !!d.today, title: d.mood && d.title ? d.title : false })}></span>`)}</span>`;
  }
  return html`<figure class="aj-c-leafpic" data-kind="${kind}" role="img" aria-label="${say}"><div class="${el('art')}" aria-hidden="true">${art}</div>${caption ? html`<figcaption class="${el('cap')}" aria-hidden="true">${caption}</figcaption>` : ''}</figure>`;
}

// loading (v4 round 10 fixes 5): the same picture, its marks in bone. The day letters are the interface's and stay;
// the dots, squares, bars and columns are bones in the real grid, the lengths and labels too. Decorative: the
// leaf says nothing until it loads.
const SHARES = [1, 0.45, 0.25, 0.35];
function skeleton({ kind, caption, days, recs, weeks }, { html, el, use }) {
  const bone = props => use('bone', props);
  const letters = html`<span class="${el('dow')}">${days.map(d => html`<span>${d.dow}</span>`)}</span>`;
  let art;
  if (kind === 'kept') {
    const sq = () => bone({ form: 'block', width: '26px', height: '26px' });
    art = html`<span class="${el('kept')}">${days.map(d => html`<span>${d.dow}</span>`)}${days.map(sq)}${days.map(sq)}</span>`;
  } else if (kind === 'recordings') {
    art = html`<span class="${el('bars')}">${recs.map((r, i) => html`<span class="${el('bar')}">${bone({ width: '28px', height: '10px' })}${bone({ width: `${SHARES[i % 4] * 100}%`, height: '10px' })}${bone({ width: '30px', height: '10px' })}</span>`)}</span>`;
  } else if (kind === 'weeks') {
    art = html`<span class="${el('weeks')}">${weeks.map((w, i) => html`<span class="${el('col')}">${bone({ form: 'block', width: '70%', height: `${Math.round([0.3, 0.45, 0.35, 0.75][i % 4] * 100)}%` })}${bone({ width: '36px', height: '10px' })}</span>`)}</span>`;
  } else {
    art = html`${letters}<span class="${el('dots')}">${days.map(() => bone({ form: 'round', width: '26px' }))}</span>`;
  }
  return html`<figure class="aj-c-leafpic" data-kind="${kind}" data-loading aria-hidden="true"><div class="${el('art')}">${art}</div>${caption ? html`<figcaption class="${el('cap')}">${bone({ width: '60%', height: '10px' })}</figcaption>` : ''}</figure>`;
}
