// entry-actions: <EntryActions form excluded kind memoryLabel text>{children}</EntryActions> in the developers' code.
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
// tools: the children are the icon buttons; the memory dropdown and its option are built here.
// editor: the children are the label with its field and the .auth-actions row.
// confirm: text is the question; the children are the buttons.
// Memory is one way (decision 2026-10-28): an entry in memory says nothing; one kept out carries the quiet
// dropdown, Out of memory, always shown, whose checkbox lets it in (asked once: it can't be undone).
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
export default function render({ form = 'tools', excluded = false, kind = 'written', memoryLabel = 'Out of memory', text = '', label = '', fieldId = '' } = {}, slots, { html, raw, attrs, use }) {
  if (form === 'editor') {
    // The label wraps the field (slot field), as the screens draw the editor.
    const labelled = label ? html`<label${attrs({ for: fieldId || false })}>${label}${slots.field}</label>` : '';
    return html`<form class="aj-c-entry-actions" data-form="editor" action="00-prototype.html#entry-saved">${labelled}${slots.children}</form>`;
  }
  if (form === 'confirm') {
    return html`<div class="aj-c-entry-actions" data-form="confirm"><p>${text}</p><div class="aj-l-cluster" data-place="actions">${slots.children}</div></div>`;
  }
  const recording = kind === 'recording';
  const memory = excluded ? html`<details class="aj-c-entry-actions__memory" data-excluded="true"><summary class="aj-c-entry-actions__trigger"${attrs({ 'aria-label': (recording ? 'Voice memo' : 'Entry') + ' memory settings: out of memory' })}><span class="aj-c-entry-actions__state">${memoryLabel}</span>${raw(CHEVRON)}</summary><div class="aj-c-entry-actions__menu">${use('opt', { label: 'Use in memory', pressed: false, form: 'compact', data: { 'entry-action': 'memory' } })}</div></details>` : '';
  return html`<div class="aj-c-entry-actions"${attrs({ 'aria-label': recording ? 'Voice memo actions' : 'Entry actions' })}><div class="aj-c-entry-actions__tools">${slots.children}</div>${memory}</div>`;
}
