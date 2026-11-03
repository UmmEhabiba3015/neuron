// shead: <SectionHeading level={2}>text</SectionHeading> in the developers' code.
export default function render({ text = '', level = 2 } = {}, slots, { html, raw }) {
  const tag = raw(level === 3 ? 'h3' : 'h2');
  return html`<${tag} class="aj-c-shead">${text}</${tag}>`;
}
