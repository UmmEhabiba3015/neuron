// auth: <AuthSpread title ways>{children}</AuthSpread> in the developers' code. The canvas holds the
// account sheet (the sheet module, with the legacy auth-sheet class its grid reads), its context
// side and its region side; the region holds the auth form (children).
export default function render({ title = '', titleId = '', copy = '', ways = [], labelledBy = '' } = {}, slots = {}, { html, use, attrs }) {
  // The title is a line or a list of lines (the approved two-line title: one <br> between them).
  const lines = (Array.isArray(title) ? title : [title]).map((line, i) => i ? html`<br>${line}` : html`${line}`);
  const list = ways.map(w => html`<div class="aj-s-auth__way"><p class="aj-s-auth__label">${w.label}</p><p>${w.text}</p></div>`);
  const sides = html`<section class="aj-s-auth__context"${attrs({ 'aria-labelledby': titleId || false })}><div><h2 class="aj-s-auth__title"${attrs({ id: titleId || false })}>${lines}</h2><p class="aj-s-auth__copy">${copy}</p></div><div class="aj-s-auth__ways">${list}</div></section><section class="aj-s-auth__region"${attrs({ 'aria-labelledby': labelledBy || false })}>${slots.children}</section>`;
  return html`<main class="aj-s-auth">${use('sheet', { tag: 'div', form: 'account', place: 'sheet' }, { children: sides })}</main>`;
}
