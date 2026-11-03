// pending: <Pending form sub text action length label /> in the developers' code (v4 C5, explore drafts a-quiet-line).
// One line of the system's quiet print for something not done yet, where it is: under an unsent entry or memo's
// words (form status: the upload arrow, the words, Try again), and under the composer's field for the voice memo
// draft (form draft: the whole line is one button that opens the recorder on it). Nothing changes shape around it.
// The runtime finds Try again by its hook (retry), the words by theirs (words) and the draft's length (length); a
// parent gives the draft line its own hook.
import { UPLOAD, MIC } from '../../../content/icons.mjs';
export default function render({ form = 'status', sub = 'retrying', text = '', action = '', length = '', label = '' } = {}, slots = {}, { html, raw, attrs, use, el }) {
  if (form === 'draft') {
    return html`<button class="aj-c-pending" data-form="draft" type="button"${attrs({ 'aria-label': label || false })}>${raw(MIC)}<span class="${el('text')}" data-hook="words">${text} <span class="${el('length')}" data-hook="length">${length}</span></span><span class="${el('go')}">${action}</span></button>`;
  }
  // Sending has no button: the words say it is under way.
  const retry = sub === 'sending' || !action ? '' : use('button', { grade: 'quiet', label: action, hook: 'retry', place: 'action' });
  return html`<div class="aj-c-pending"${attrs({ 'data-sub': sub === 'retrying' ? false : sub })} role="status">${raw(UPLOAD)}<span class="${el('text')}" data-hook="words">${text}</span>${retry}</div>`;
}
