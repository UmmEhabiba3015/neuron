// rail: <Rail /> in the developers' code. Decorative: aria-hidden, no props, no slots.
export default function render(props = {}, slots, { html }) {
  return html`<div class="aj-l-rail" aria-hidden="true"></div>`;
}
