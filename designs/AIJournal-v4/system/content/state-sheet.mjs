// A page's record replaced by a state message (pages round 4b: the loading and fetch-failed states, 18): the
// sheet holding the state-message section, with an announced line ({ line }) or a notice and its retry
// ({ notice, retry }). The calling page's kit is passed in.
export function stateSheet(message, { html, use }) {
  const content = message.line
    ? use('state-message', { tag: 'line', text: message.line, place: 'span help' })
    : html`${use('notice', { text: message.notice, announce: true, place: 'block' })}${use('cluster', { place: 'actions' }, { children: use('button', { grade: message.retry.grade || 'solid', href: message.retry.href, label: message.retry.label }) })}`;
  return use('sheet', { place: 'block record' }, { children: use('state-message', { place: 'span' }, { children: content }) });
}
