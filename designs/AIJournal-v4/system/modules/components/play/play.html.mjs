// play: <Play label /> in the developers' code. The recorder runtime swaps the glyph to a pause while playing.
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
export default function render({ label = '' } = {}, slots = {}, { html, raw, attrs }) {
  return html`<button class="aj-c-play" type="button" aria-label="${label}">${slots.icon || raw(PLAY)}</button>`;
}
