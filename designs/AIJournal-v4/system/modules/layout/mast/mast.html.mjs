// mast: <Mast form wordmark collapsed>{back}{children}</Mast> in the developers' code.
export default function render({ form = 'row', wordmark = '', collapsed = false } = {}, slots, { html, raw, attrs }) {
  const title = form === 'title';
  const tag = raw(title ? 'div' : 'header');
  return html`<${tag} class="aj-l-mast"${attrs({ 'data-form': title ? 'title' : false, 'data-collapsed': !title && collapsed })}>${slots.back}${wordmark ? html`<h1 class="aj-l-mast__wordmark">${wordmark}</h1>` : ""}${slots.children}</${tag}>`;
}
