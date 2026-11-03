// overview: <Overview line dates href reflection first /> in the developers' code.
// One row: the latest weekly reflection's line and a chevron, together the link to that reflection. No line, no
// overview: an empty line renders nothing (the plain composer), never a lone chevron.
import { OPENS } from '../../../content/icons.mjs';
export default function render({ line = '', dates = '', href = '', reflection = '', first = false, labels = {} } = {}, slots, { html, raw, attrs }) {
  if (!String(line).trim()) return '';
  const l = { week: 'This week', first: 'Your first week', opens: 'Opens the reflection.', soFar: 'See the week so far.', ...labels };
  // The accessible name carries the whole line, so a line the row fades is never lost to a screen reader.
  const name = first ? `${l.first}: ${line} ${l.soFar}` : `${l.week}, ${dates}: ${line} ${l.opens}`;
  return html`<div class="aj-s-overview" data-module="overview"${attrs({ 'data-reflection': reflection || false })}><a class="aj-s-overview__link" href="${href}" aria-label="${name}" title="${line}"><span class="aj-s-overview__line">${line}</span>${raw(OPENS)}</a></div>`;
}
