// composer: <Composer form placeholder filled toolsRow hooks>{overview}{row}{standby}{draft}{tools}{after}</Composer> in the developers' code.
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
// The record control (the mic part) is the composer's own markup: it stands in the row unless the
// field holds words (filled: send takes its place, from the row slot). The tools row wraps the option
// and More options; the iOS form (toolsRow: false) has the option straight after the row. The voice memo draft
// line (v4 C5, slot draft: pending's draft form) stands under the row, before the tools, with or without words.
// The behaviour hooks (contract behaviour.hooks) are data-hook marks the app runtime finds its parts by:
// input (the field the composer renders), row, mic, tools, and memory (the option, wherever it sits).
import { SEND } from '../../../content/icons.mjs';
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.5"/></svg>';
const OPTION = /<button(?= [^>]*class="aj-c-opt\b)/;
export default function render({ form = 'plain', placeholder = 'Add to today', filled = false, toolsRow = true, hooks = false, readonly = false, waiting = false, value = '', label = 'Ask your journal', note = '', readonlyText = '', todayLabel = '', todayHref = '', fieldId = 'aj-ask' } = {}, slots, { html, raw, attrs, use, el }) {
  // The chat form (Ask): a form element with the lead, the rounded field and the note; or, on a past day, the read-only slip.
  // The field's id is fieldId (default aj-ask): one chat composer stands on a screen; the catalogue gives each its own.
  if (form === 'chat') {
    const lead = slots.lead && slots.lead.text ? html`<div class="${el('lead')}">${slots.lead}</div>` : '';
    const back = use('button', { grade: 'quiet', label: todayLabel, ...(todayHref ? { href: todayHref } : { hook: 'today' }) });
    const inner = readonly
      ? html`<p class="${el('readonly')}">${readonlyText} ${back}</p>`
      : html`${lead}<div class="${el('box')}" data-hook="row"><label class="${el('label')}" for="${fieldId}">${label}</label><textarea class="${el('text')}" id="${fieldId}" rows="1" placeholder="${label}" data-hook="input">${value}</textarea><button class="${el('ask')}" type="submit" aria-label="Ask">${raw(SEND)}</button></div>${note ? html`<p class="${el('note')}">${note}</p>` : ''}`;
    return html`<form class="aj-c-composer"${attrs({ 'data-form': 'chat', 'data-waiting': waiting && !readonly ? '' : false })}>${inner}</form>`;
  }
  const field = use('field', { tag: 'div', value: placeholder, placeholder: true });
  const row = slots.row && slots.row.text ? slots.row : raw(field.text.replace(/^(<div class="aj-c-field")/, '$1 data-hook="input"'));
  const mic = filled ? '' : html`<button class="${el('mic')}" type="button" data-hook="mic"${attrs({ 'data-action': hooks ? 'record' : false })} aria-label="Record">${raw(MIC)}</button>`;
  const kept = slots.tools && slots.tools.text ? raw(slots.tools.text.replace(OPTION, '<button data-hook="memory"')) : null;
  const tools = !kept ? '' : toolsRow ? html`<div class="${el('tools')}" data-hook="tools">${kept}</div>` : kept;
  return html`<div class="aj-c-composer"${attrs({ 'data-form': form === 'companion' ? 'companion' : false, 'data-journal-component': hooks ? 'composer' : false })}>${slots.overview}<div class="${el('row')}" data-hook="row">${row}${mic}${slots.standby}</div>${slots.draft}${tools}${slots.after}</div>`;
}
