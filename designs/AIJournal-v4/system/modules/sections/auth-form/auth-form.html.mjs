// auth-form: the content of the auth spread's region, from data (13-login, 14-register and their states in
// 15-auth-states). In order: the heading; a status notice; the copy line (typed in when copyTyped); the
// form (data-auth-form and novalidate when given) with a row per field and the submit; the action row; the
// prototype's state links (prototype furniture: a shipped app passes none). Its own parts: the form, a
// field row (label, inner column), its head (the label with its note and error lines at the end), the password
// wrapper, the switch line. Each field:
//   { id, label, attrs (the input's own: type, value, autocomplete, required, minlength, aria-*),
//     auth (data-auth-input), toggle (the show/hide label), lines: [{ text, place, attrs, data }] (help,
//     hint and error lines, in order), forgot: { label, href } }
export default function render({ heading = '', headingId = '', notice = '', copy = '', copyTyped = false, form = null, fields = [], submit = '', actions = [], preview = [], blocks = [] } = {}, slots = {}, { html, attrs, use, el }) {
  const head = html`<h2 class="aj-s-auth-form__heading"${attrs({ id: headingId || false })}>${heading}</h2>`;
  const status = notice ? use('notice', { text: notice, announce: true, place: 'block' }) : '';
  const copyLine = copy ? use('text', { form: 'copy', chars: copyTyped ? copy.length : 0, text: copy, place: 'copy' }) : '';
  const row = f => {
    const input = use('field', { tag: f.options ? 'select' : 'input', options: f.options || [], form: 'account', place: 'fill', data: f.auth ? { 'auth-input': f.auth } : undefined, attrs: { id: f.id, ...f.attrs } });
    const control = f.toggle ? html`<div class="${el('password')}">${input}${use('button', { grade: 'quiet', form: 'toggle', place: 'toggle', label: f.toggle, attrs: { 'aria-controls': f.id } })}</div>` : input;
    const line = l => use('text', { form: 'help', text: l.text, place: l.place, attrs: l.attrs, data: l.data });
    // note and error lines (place note) stand on the label's row, at its end (v4 round 10); help lines stay under the field
    const isNote = l => String(l.place || '').split(' ').includes('note');
    const lines = (f.lines || []).filter(l => !isNote(l)).map(line), notes = (f.lines || []).filter(isNote).map(line);
    const label = html`<label for="${f.id}">${f.label}</label>`;
    const head = notes.length ? html`<div class="${el('head')}">${label}${notes}</div>` : label;
    const forgot = f.forgot ? use('button', { grade: 'quiet', form: 'note', place: 'start', href: f.forgot.href, label: f.forgot.label }) : '';
    // inner: false, the field beside its label with no inner column (17's timezone chooser).
    if (f.inner === false) return html`<div class="${el('field')}">${head}${control}${lines}${forgot}</div>`;
    return html`<div class="${el('field')}">${head}<div class="${el('inner')}">${control}${lines}${forgot}</div></div>`;
  };
  const formEl = form ? html`<form class="${el('form')}"${attrs({ 'data-auth-form': form.name || false })} action="${form.action}" method="get"${attrs({ novalidate: form.novalidate ? true : false })}>${fields.map(row)}${use('button', { grade: 'solid', place: 'fill', label: submit, attrs: { type: 'submit' } })}</form>` : '';
  const row2 = actions.length ? use('cluster', { place: 'actions' }, { children: html`${actions.map(a => a.text !== undefined ? html`<span class="${el('switch')}">${a.text}</span>` : use('button', { grade: a.grade || 'quiet', href: a.href, label: a.label }))}` }) : '';
  const states = preview.length ? html`<details class="auth-preview"><summary>Prototype states</summary><nav aria-label="Preview alternative outcomes">${preview.map(p => use('button', { grade: 'quiet', href: p.href, label: p.label }))}</nav></details>` : '';
  // blocks (pages round 4b): the generic state pages' bodies, in their own order. A block is { type: notice |
  // copy | form | actions, …the same data as above } or markup a page composed (rows, cards).
  if (blocks.length) {
    const one = b => !b || !b.type ? b
      : b.type === 'notice' ? use('notice', { text: b.text, announce: true, place: 'block' })
      : b.type === 'copy' ? use('text', { form: 'copy', chars: b.typed ? b.text.length : 0, text: b.text, place: 'copy' })
      : b.type === 'actions' ? use('cluster', { place: 'actions' }, { children: html`${b.items.map(a => a.text !== undefined ? html`<span class="${el('switch')}">${a.text}</span>` : use('button', { grade: a.grade || 'quiet', href: a.href, label: a.label }))}` })
      : b.type === 'form' ? html`<form class="${el('form')}"${attrs({ 'data-auth-form': b.form.name || false })} action="${b.form.action}" method="get"${attrs({ novalidate: b.form.novalidate ? true : false })}>${(b.fields || []).map(row)}${use('button', { grade: 'solid', place: 'fill', label: b.submit, attrs: { type: 'submit' } })}</form>`
      : '';
    return html`<div class="aj-s-auth-form">${head}${blocks.map(one)}${slots.children}</div>`;
  }
  return html`<div class="aj-s-auth-form">${head}${status}${copyLine}${formEl}${row2}${states}${slots.children}</div>`;
}
