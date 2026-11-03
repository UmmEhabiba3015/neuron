// find: <Find>{field}</Find> in the developers' code; <Find form="pill" query mode status found copy /> for the
// Timeline's search (v4 C1).
// row (default): Ask's search row, the field it is given filling it.
// pill: the Timeline's search in full, written by the section itself: the magnifier, the field (bare), its clear
// control, a divider and the switch (keyword or by meaning), and the found line under the bar. find.js keeps it
// sticky as the list's running head (data-stuck), and the app fills the found line (hook found) and sets
// data-status from the search it runs.
const ICON = '<svg class="aj-s-find__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.5"/></svg>';
const CLEAR = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5"/></svg>';
// The approved copy (explore timeline-jump-arrival f-wash-and-frame; DESIGN.md 2026-10-23). A page passes its own.
const COPY = {
  label: 'Search your journal',
  hint: 'Search your journal',
  meaningHint: 'What was it about?',
  meaning: 'By meaning',
  clear: 'Clear search',
  retry: 'Try again',
};

export default function render({ form = 'row', query = '', mode = 'keyword', status = 'idle', found = '', stuck = false, flow = false, copy = {} } = {}, slots = {}, { html, raw, attrs, use }) {
  if (form !== 'pill') return html`<div class="aj-s-find" data-module="find">${slots.children}</div>`;
  const c = { ...COPY, ...copy };
  const meaning = mode === 'meaning';
  const field = use('field', { tag: 'input', form: 'bare', label: c.label, value: query, attrs: { placeholder: meaning ? c.meaningHint : c.hint, autocomplete: 'off' } });
  return html`<div class="aj-s-find" data-form="pill" data-module="find" role="search"${attrs({ 'data-mode': meaning ? 'meaning' : 'keyword', 'data-status': status, 'data-stuck': stuck, 'data-flow': flow, 'data-hint-keyword': c.hint, 'data-hint-meaning': c.meaningHint })}><div class="aj-s-find__bar">${raw(ICON)}${field}<button class="aj-s-find__clear" type="button"${attrs({ 'aria-label': c.clear, hidden: !query })}>${raw(CLEAR)}</button><span class="aj-s-find__divider" aria-hidden="true"></span>${use('button', { form: 'switch', label: c.meaning, checked: meaning, place: 'mode' })}</div><div class="aj-s-find__line" aria-live="polite"><span class="aj-s-find__found" data-hook="found">${found}</span>${use('button', { grade: 'quiet', label: c.retry, place: 'retry' })}</div></div>`;
}
