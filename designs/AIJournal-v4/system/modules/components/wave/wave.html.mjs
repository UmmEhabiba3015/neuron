// wave: <Wave size="row|big" /> in the developers' code. Decorative, aria-hidden.
// The memo's one fixed shape at a fixed pitch (v4 round 10): its drawing is wave.css's, so a wave takes no drawing and
// shows as much of the phrase as its row is wide.
export default function render({ size = 'row' } = {}, slots, { html, attrs }) {
  return html`<span class="aj-c-wave"${attrs({ 'data-size': size !== 'row' ? size : false })} aria-hidden="true"></span>`;
}
