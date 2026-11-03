// state-message: <StateMessage tag>{children}</StateMessage> in the developers' code.
export default function render({ tag = 'div', text = '' } = {}, slots = {}, { html, raw, use }) {
  // line: the text module's help line carrying this section's class (a mix), announced (18: an edit that
  // didn't save, a recording that didn't send).
  if (tag === 'line') return use('text', { form: 'help', text, mix: true, attrs: { role: 'status' } });
  const t = tag === 'p' ? 'p' : 'div';
  return html`${raw(`<${t} class="aj-s-state-message">`)}${t === 'p' ? text : slots.children}${raw(`</${t}>`)}`;
}
