// daycard: <DayCard day date dateName weeks shown calendar open copy /> in the developers' code.
// The Timeline's date and mood card (v4 C1, explore timeline-jump-arrival f-wash-and-frame): the date row, which
// unrolls the calendar (cal, wheel form) over what is under it; the mood row ("Mood", the week's name, a strip of
// the week's seven days, the week arrows while the panel is open); the mood panel (one moodgraph per week, the
// shown one visible). Both parts start closed. daycard.js opens and closes them, steps the weeks and turns
// every way to a day (a strip dot, a graph point, a calendar day) into one jump.
// weeks: [{ week, label, days, before?, after? }], oldest first, the last this week: only weeks with something
// written, and this week always (history skips empty weeks). days: seven, Monday first, as moodgraph takes them.
const DOWN = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const LEFT = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const RIGHT = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WORD = { light: 'Light', good: 'Good', even: 'Even', low: 'Low', hard: 'Hard' };
// The approved copy (DESIGN.md 2026-10-23, the date and mood card). A page passes its own.
const COPY = { where: 'Where you are', mood: 'Mood', thisWeek: 'This week', earlier: 'Earlier week', later: 'Later week', choose: 'Choose a date', months: 'Month and year', go: 'Go to this day' };

export default function render({ day = '', date = '', dateName = '', weeks = [], shown = '', calendar = {}, open = {}, id = 'daycard', copy = {} } = {}, slots, { html, raw, attrs, use }) {
  const c = { ...COPY, ...copy };
  const last = weeks[weeks.length - 1]?.week || '';
  const on = shown || last;
  const at = weeks.findIndex(w => w.week === on);
  const name = w => (w.week === last ? c.thisWeek : w.label);
  const dot = (d, i) => d.mood
    ? html`<button class="aj-s-daycard__dot" type="button"${attrs({ 'data-mood': d.mood, 'data-date': d.date, 'aria-label': `${d.name}, ${WORD[d.mood]}. ${c.go}`, title: `${d.short} · ${WORD[d.mood]}` })}><i></i><span aria-hidden="true">${LETTERS[i]}</span></button>`
    : html`<span class="aj-s-daycard__dot"${attrs({ 'data-empty': true, 'data-future': d.future ? true : false })} aria-hidden="true"><i></i><span>${LETTERS[i]}</span></span>`;
  const strips = weeks.map(w => html`<div class="aj-s-daycard__strip" role="group"${attrs({ 'data-week': w.week, 'data-name': name(w), 'aria-label': `${c.mood}, ${w.label}`, hidden: w.week !== on })}>${w.days.map(dot)}</div>`);
  const graphs = weeks.map(w => html`<div class="aj-s-daycard__graph"${attrs({ 'data-week': w.week, hidden: w.week !== on })}>${use('moodgraph', { week: w.week, label: w.label, days: w.days, before: w.before, after: w.after, current: day })}</div>`);
  const cal = use('cal', { month: c.months, months: calendar.months || [], selected: calendar.selected || '' });
  const step = (dir, label, icon, off) => html`<button class="aj-s-daycard__step" type="button"${attrs({ 'data-step': dir, 'aria-label': label, disabled: off })}>${raw(icon)}</button>`;
  return html`<section class="aj-s-daycard" data-module="daycard"${attrs({ 'aria-label': c.where, 'data-day': day || false, 'data-mood-open': !!open.mood, 'data-cal-open': !!open.calendar })}><div class="aj-s-daycard__row" data-row="date"><button class="aj-s-daycard__date" type="button"${attrs({ 'aria-expanded': open.calendar ? 'true' : 'false', 'aria-controls': `${id}-cal`, 'aria-label': `${dateName}. ${c.choose}` })}><span class="aj-s-daycard__value" data-hook="date">${date}</span><span class="aj-s-daycard__arrow" aria-hidden="true">${raw(DOWN)}</span></button><div class="aj-s-daycard__cal" role="dialog" tabindex="-1"${attrs({ id: `${id}-cal`, 'aria-label': c.choose, inert: !open.calendar })}><div class="aj-s-daycard__unroll">${cal}</div></div></div><div class="aj-s-daycard__row" data-row="mood"><button class="aj-s-daycard__toggle" type="button"${attrs({ 'aria-expanded': open.mood ? 'true' : 'false', 'aria-controls': `${id}-mood` })}><span class="aj-s-daycard__name">${c.mood}<span class="aj-s-daycard__arrow" aria-hidden="true">${raw(DOWN)}</span></span><span class="aj-s-daycard__week" data-hook="week">${weeks[at] ? name(weeks[at]) : c.thisWeek}</span></button><div class="aj-s-daycard__strips">${strips}</div><div class="aj-s-daycard__arrows">${step('-1', c.earlier, LEFT, at <= 0)}${step('1', c.later, RIGHT, at >= weeks.length - 1)}</div></div><div class="aj-s-daycard__panel"${attrs({ id: `${id}-mood`, inert: !open.mood })}><div class="aj-s-daycard__fold"><div class="aj-s-daycard__graphs">${graphs}</div></div></div></section>`;
}
