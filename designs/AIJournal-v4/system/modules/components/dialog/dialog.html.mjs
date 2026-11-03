// dialog: <Dialog labelledBy="…">{card}</Dialog> in the developers' code.
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
export default function render({ labelledBy } = {}, slots = {}, { html, attrs }) {
  return html`<div class="aj-c-dialog" role="dialog" aria-modal="true"${attrs({ 'aria-labelledby': labelledBy || false })}>${slots.children}</div>`;
}
