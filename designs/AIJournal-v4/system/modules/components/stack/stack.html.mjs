// stack: <Stack>{children}</Stack> in the developers' code.
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
// The stack is the page's main, as every screen writes it.
// Rows of controls go in a <div class="aj-c-stack__row"> among the children.
export default function render(props = {}, slots = {}, { html }) {
  return html`<main class="aj-c-stack">${slots.children}${slots.row && slots.row.text ? html`<div class="aj-c-stack__row">${slots.row}</div>` : ''}</main>`;
}
