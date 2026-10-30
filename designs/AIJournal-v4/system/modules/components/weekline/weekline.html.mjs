// weekline: <WeekLine id heading weeks since /> in the developers' code.
// Earlier weeks on a line by month (v4 C3, explore long-fold-out E as booklet-feel f-mix draws it).
export default function render({ id = 'earlier', heading = '', weeks = [], since = '' } = {}, slots, { html, el }) {
  const months = [...new Set(weeks.map(w => w.month))];
  const row = w => html`<li><a class="${el('week')}" href="${w.href}"><span class="${el('dates')}">${w.dates}</span><span class="${el('line')}">${w.line}</span></a></li>`;
  const month = m => html`<p class="${el('month')}">${m}</p><ol class="${el('weeks')}">${weeks.filter(w => w.month === m).map(row)}</ol>`;
  return html`<section class="aj-c-weekline" id="${id}" aria-labelledby="${id}-h"><h2 class="${el('head')}" id="${id}-h">${heading}</h2><div class="${el('spine')}">${months.map(month)}</div>${since ? html`<p class="${el('since')}">${since}</p>` : ''}</section>`;
}
