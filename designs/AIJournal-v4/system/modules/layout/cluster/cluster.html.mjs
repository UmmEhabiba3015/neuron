// cluster: <Cluster tag>{children}</Cluster> in the developers' code. It usually goes on an element
// that already exists (class="… aj-l-cluster"); the render draws it standalone for the catalogue and for code.
export default function render({ tag = 'div' } = {}, slots = {}, { html, raw }) {
  const t = tag === 'nav' ? 'nav' : 'div';
  return html`${raw(`<${t} class="aj-l-cluster">`)}${slots.children}${raw(`</${t}>`)}`;
}
