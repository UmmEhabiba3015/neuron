// panel: <Panel title>{children}</Panel> in the developers' code.
// A panel with its own h2 (keep-this, mood edit, install, the crisis resource).
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
export default function render({ title = '' } = {}, slots = {}, { html }) {
  return html`<section class="aj-c-panel" aria-label="${title}"><h2>${title}</h2>${slots.children}</section>`;
}
