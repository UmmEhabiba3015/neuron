// The plain-paper auth spread, shared by the login, register, forgot and reset pages (13-login,
// 14-register, their states in 15-auth-states): the masthead row, the auth section (context and region) and
// its form section, on the auth surface. One composition; each page passes its spread and one state's form
// (the auth-form section's data, system/modules/sections/auth-form). The calling page's kit is passed in:
// use() is limited to that page's contract.
export function authSpread(spread, form, id, { html, use }) {
  const masthead = use('mast', { form: 'row', wordmark: spreadContext.wordmark, place: 'head' }, {
    children: use('keybox', { key: spreadContext.keybox.key, value: spreadContext.keybox.value, place: 'tool' }),
  });
  const region = use('auth-form', { ...form, place: 'form' });
  const section = use('auth', { title: spreadContext.title, titleId: spread.titleId, copy: spreadContext.contextCopy, ways: spreadContext.ways, labelledBy: form.headingId, place: 'grow' }, { children: region });
  return use('shell', { motion: 'arrive', surface: 'auth', attrs: { id } }, {
    children: html`${use('rail')}${use('page', {}, { children: html`${masthead}${section}` })}`,
  });
}

// What every spread shares (the context side).
export const spreadContext = {
  wordmark: 'Journal',
  keybox: { key: 'Account', value: 'Your journal' },
  title: ['Some days are a sentence.', 'Some days need a page.'],
  contextCopy: 'Keep the small moments, the longer thoughts, and the things you would rather say aloud.',
  ways: [
    { label: 'Write', text: 'A few words, or as many as you need.' },
    { label: 'Record', text: 'Leave a voice memo in your journal.' },
  ],
};
// The two spreads: the login spread (sign in, forgot, reset, signed out) and the register spread.
export const spreads = {
  login: { titleId: 'login-context-title' },
  register: { titleId: 'register-context-title' },
};
