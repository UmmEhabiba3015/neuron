// Copy from the screens (13-login, 17-account-data). The form's parts are the section's own markup;
// fields, buttons and settings rows are modules built with use(). The shared .auth-copy and
// .auth-actions keep their legacy classes, as on the screens. The long and non-Latin fixtures are
// stress tests, not product copy.
export default ({ html, use }) => {
  const field = (label, type) => html`<div class="aj-s-auth-form__field"><label>${label}</label><div class="aj-s-auth-form__inner">${use('field', { tag: 'input', form: 'account', label, value: '', place: 'fill' })}</div></div>`;
  const password = html`<div class="aj-s-auth-form__field"><label>Password</label><div class="aj-s-auth-form__inner"><div class="aj-s-auth-form__password">${use('field', { tag: 'input', form: 'account', label: 'Password', value: '', place: 'fill' })}</div>${use('button', { grade: 'quiet', href: '#auth-forgot', label: 'Forgot your password?' })}</div></div>`;
  const form = html`<form class="aj-s-auth-form__form">${field('Email')}${password}${use('button', { grade: 'solid', label: 'Sign in', place: 'fill' })}</form>`;
  const actions = html`${use('cluster', { place: 'actions' }, { children: html`${use('button', { grade: 'quiet', href: '#auth-register', label: 'Create an account' })}` })}`;
  return [
    { name: 'Sign in', state: 'default', note: 'The sign-in content: heading, copy, the form with the password field, the action row (13-login).', props: { heading: 'Sign in' }, slots: { children: html`<p class="auth-copy">Open your journal on this device.</p>${form}${actions}` } },
    { name: 'Sign-in failed', note: 'A notice in the content above the form (15-auth-states): the content places it flush and sets its padding.', props: { heading: 'Sign in' }, slots: { children: html`${use('notice', { text: 'We could not sign you in with those details.', announce: true, place: 'block' })}${form}${actions}` } },
    { name: 'Account state', note: 'An account screen without a form: heading, copy and a settings row (17-account-data).', props: { heading: 'Your data' }, slots: { children: html`<p class="auth-copy">148 entries and 31 recordings are kept on this device.</p>${use('srowlink', { href: '#export', label: 'Export your journal', value: 'PDF, JSON', place: 'row' })}` } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long heading and copy.', props: { heading: 'Choose a new password for the journal you have been keeping since the beginning' }, slots: { children: html`<p class="auth-copy">A very long explanatory sentence that runs on over several lines to show how the column wraps its copy without moving the form.</p>${form}` } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { heading: 'Вход 登录' }, slots: { children: html`<p class="auth-copy">Откройте журнал. 日記を開きます。</p>${form}` } },
  ];
};
