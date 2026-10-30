// text: <Text form="prose|lede|copy|help|label" chars>{text}</Text> in the developers' code.
// copy with chars wraps the sentence in its motion span (the printed-line gesture).
export default function render({ form = 'prose', chars = 0, text = '' } = {}, slots, { html }) {
  const body = form === 'copy' && chars ? html`<span data-motion-copy style="--aj-c-text-chars:${chars}">${text}</span>` : text;
  return html`<p class="aj-c-text" data-form="${form}">${body}</p>`;
}
