// moodrow: <MoodRow form="ruled" label="Today felt" selected="good" onChange /> in the developers' code.
const MOODS = [['light', 'Light'], ['good', 'Good'], ['even', 'Even'], ['low', 'Low'], ['hard', 'Hard']];
export default function render({ form = 'plain', label = '', selected = 'none' } = {}, slots, { html, attrs }) {
  const buttons = MOODS.map(([value, text]) => html`<button${attrs({ 'data-mood': value })} type="button"${attrs({ 'aria-pressed': value === selected ? 'true' : 'false' })}>${text}</button>`);
  const chips = html`<div class="aj-c-moodrow__chips" data-hook="chips" role="group" aria-label="How was this day?">${buttons}</div>`;
  if (form === 'ruled') {
    // after: a line under the chips (18: the mood that didn't change).
    return html`<section class="aj-c-moodrow" data-form="ruled"><div class="aj-c-moodrow__head"><h2>${label}</h2></div><div class="aj-c-moodrow__body">${chips}${slots?.after || ''}</div></section>`;
  }
  return html`<section class="aj-c-moodrow" data-form="plain"><h2>${label}</h2>${chips}</section>`;
}
