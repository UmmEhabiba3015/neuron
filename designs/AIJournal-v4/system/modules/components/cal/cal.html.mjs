// cal: <Calendar month months selected /> in the developers' code.
// Timeline's card calendar (v4 C1): a wheel of months beside one month's days, Monday first.
// months: [{ value, short, year, name, days, empty? }]; days: { n, href?, mood?, current?, out?, label? } per cell.
// month: the wheel's listbox name. selected: the month shown.
const HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export default function render({ month = 'Month and year', months = [], selected = '' } = {}, slots, { html, attrs }) {
  const options = months.map((m) => html`<button type="button" role="option" class="aj-c-cal__month" data-value="${m.value}" aria-selected="${m.value === selected ? 'true' : 'false'}" aria-label="${m.name}">${m.short}<small>${m.year}</small></button>`);
  const pages = months.map((m) => {
    const heads = HEADS.map((h) => html`<div class="aj-c-cal__dow">${h}</div>`);
    const cells = m.days.map((d) => {
      if (d.out) return html`<div class="aj-c-cal__day" data-out></div>`;
      if (d.href) return html`<a class="aj-c-cal__day" href="${d.href}" data-date="${d.href.replace('#d-', '')}"${attrs({ 'data-mood': d.mood || false, 'data-current': d.current ? true : false, 'aria-label': d.label || false })}>${d.n}</a>`;
      return html`<div class="aj-c-cal__day">${d.n}</div>`;
    });
    const note = m.empty ? html`<p class="aj-c-cal__note">Nothing written this month.</p>` : '';
    return html`<div class="aj-c-cal__page" data-value="${m.value}" role="grid" aria-label="${m.name}"${attrs({ hidden: m.value === selected ? false : true })}>${heads}${cells}${note}</div>`;
  });
  return html`<div class="aj-c-cal" data-module="cal"${attrs({ 'data-current': (months.flatMap(m => m.days).find(d => d.current)?.href || '').replace('#d-', '') || false })}><div class="aj-c-cal__wheel"><div class="aj-c-cal__months" role="listbox"${attrs({ 'aria-label': month })}>${options}</div></div><div class="aj-c-cal__pages">${pages}</div></div>`;
}
