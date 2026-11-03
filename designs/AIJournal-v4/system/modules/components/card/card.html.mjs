// card: <Card title titleId level paragraphs>{actions}</Card> in the developers' code.
export default function render({ title = '', titleId, level = 3, paragraphs = [] } = {}, slots, { html, raw, attrs }) {
  const tag = raw(level === 2 ? 'h2' : 'h3');
  const body = paragraphs.map((p) => {
    const item = typeof p === 'string' ? { text: p } : p;
    return html`<p class="aj-c-card__text"${attrs({ role: item.status ? 'status' : false })}>${item.text}</p>`;
  });
  const actions = slots.actions && slots.actions.text ? html`<div class="aj-c-card__actions">${slots.actions}</div>` : '';
  return html`<div class="aj-c-card"><${tag} class="aj-c-card__title"${attrs({ id: titleId || false })}>${title}</${tag}>${body}${actions}</div>`;
}
