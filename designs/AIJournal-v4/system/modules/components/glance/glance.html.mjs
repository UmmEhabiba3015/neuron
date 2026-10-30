// glance: <Glance line="…" tag="p|h1" /> in the developers' code.
// The h1 form (desktop Ask) names the page: its text sits directly in the heading, without the
// printed-line span, so it does not draw in.
export default function render({ line = '', tag = 'p', restated = false } = {}, slots, { html }) {
  if (tag === 'h1') return html`<h1 class="aj-c-glance">${line}</h1>`;
  // Restated: the user's own question in the glance's slot (04-ask): their words, not the product's typed line.
  if (restated) return html`<p class="aj-c-glance">${line}</p>`;
  return html`<p class="aj-c-glance"><span class="aj-c-glance__line">${line}</span></p>`;
}
