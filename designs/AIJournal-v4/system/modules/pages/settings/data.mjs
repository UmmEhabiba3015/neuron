import timezones from './timezones.mjs';
// The settings page's content (10-settings-privacy, journal-website.html #settings-privacy,
// #settings-visible, #settings-data): written once for every platform. Links point into the prototype,
// as the screens' do. Each state is a pushed page back to You: a title, sections of rows (a row with an
// href leads somewhere; one without is read only), and a foot or a notice.
export default {
  back: { label: 'You', href: '00-prototype.html#you' },
  states: {
    privacy: {
      title: 'Privacy',
      clip: true,
      sections: [
        { rows: [
          { label: 'What leaves this device', why: 'Entries, transcripts and moods you allow the model to read are sent only when you use a model feature.' },
          { label: 'Who processes it', why: 'Anthropic processes the material needed for answers, notes and reflections.' },
          { label: 'Training', why: 'Your writing is never used to train anything, at any time.' },
          { label: 'How long it is kept', why: 'A deleted item leaves the product at once and stays hidden in storage until you delete your account. Deleting your account removes everything permanently.' },
          { label: 'Who else can read it', why: 'Nobody. There is no sharing anywhere in this product and no link that works for anyone but you.' },
          { label: 'Support resource', why: 'If you want to talk to someone, this is always available.', value: 'Read', href: '00-prototype.html#support-resource' },
        ] },
      ],
      foot: 'Last changed 2 March 2026',
    },
    visible: {
      title: 'What it sees',
      clip: true,
      sections: [
        { heading: 'It can read', rows: [
          { label: 'Your entries', why: '144 of 148. Four are held out of memory.', value: '144' },
          { label: 'Your recordings', why: 'All 31, as the text they were turned into.', value: '31' },
          { label: 'Your moods', why: 'The five state answer, on the days you gave one.', value: '96' },
        ] },
        { heading: 'It cannot read', rows: [
          { label: 'Entries you kept out of memory', why: 'Never sent, never indexed, never cited. You can see them marked wherever they appear.', value: '4' },
          { label: 'Your audio itself', why: 'Only the text it was turned into. The recordings stay yours.', value: 'None' },
        ] },
      ],
      notice: 'Every one of these can be changed, and changing it applies to everything already written, not only to what comes next.',
    },
    data: {
      title: 'Your data',
      clip: false,
      sections: [
        { heading: 'Take it out', rows: [
          { label: 'Export everything', why: 'PDF, JSON, and your recordings as audio files. One tap, no email.', value: '148 and 31', counted: true, href: '00-prototype.html#export-preparing' },
        ] },
        { heading: 'End it', rows: [
          { label: 'Delete everything', why: 'Delete this account and everything in it. Export is directly above this for a reason.', value: 'Permanent', href: '00-prototype.html#account-delete-confirm' },
        ] },
      ],
    },
  },
};

// The data screen with something added or changed (17-account-data; the retired scripts/state-layouts.mjs drew them):
// `base` is the state whose page it is, `count` the export row's value where it differs, `message` the
// state message in the record (a notice or a copy line, then its buttons), `dialog` the confirm card after
// the record. `id` is the route the shell carries.
const dataLink = { label: 'Back to Your data', href: '00-prototype.html#settings-data' };
const deleteDialog = (notice, again) => ({
  titleId: 'delete-account-heading',
  title: 'Delete everything?',
  paragraphs: [
    'This deletes your account, 148 entries and 31 recordings, including items deleted earlier. You will be signed out everywhere. It cannot be undone.',
    ...(notice ? [{ text: notice, status: true }] : []),
    'Export first if you want a copy.',
  ],
  actions: [
    { label: 'Export instead', href: '00-prototype.html#export-preparing', grade: 'solid' },
    { label: again, href: '00-prototype.html#account-delete-pending', grade: 'keyline' },
    { label: 'Keep my account', href: '00-prototype.html#settings-data', grade: 'quiet' },
  ],
});
export const contextual = {
  // loading (v4 round 10): What it sees while its counts load: the rows' labels are the interface's, their lines and
  // values bones, no row a link yet; the line announced.
  loading: { id: 'settings-loading', base: 'visible', skeleton: 'Loading what it can see.' },
  'delete-confirm': { id: 'account-delete-confirm', base: 'data', dialog: deleteDialog('', 'Delete everything') },
  'delete-failed': { id: 'account-delete-failed', base: 'data', dialog: deleteDialog('We could not reach the server. Nothing was deleted.', 'Try deleting again') },
  'export-preparing': { id: 'export-preparing', base: 'data', message: { copy: 'We are packaging your entries as PDF and JSON, with recordings as audio files.', actions: [{ label: 'Download when ready', href: '00-prototype.html#export-ready', grade: 'quiet' }] } },
  'export-ready': { id: 'export-ready', base: 'data', message: { notice: 'Your download is ready. If it did not start, download it again.', actions: [{ label: 'Download file', href: '00-prototype.html#export-ready', grade: 'solid' }, { ...dataLink, grade: 'quiet' }] } },
  'export-empty': { id: 'export-empty', base: 'data', count: '0 and 0', message: { copy: 'There are no entries or recordings in this account yet.', actions: [{ ...dataLink, grade: 'solid' }] } },
  'export-failed': { id: 'export-failed', base: 'data', message: { notice: 'We could not reach the server. Nothing was downloaded. You can try again.', actions: [{ label: 'Try export again', href: '00-prototype.html#export-preparing', grade: 'solid' }] } },
};

// The account states (17-account-data) are generic state pages (system/content/state-page.mjs, kind account):
// `blocks` in the order the screen has them. A `row` is a settings row (href: it leads somewhere), a `shead`
// a section heading; the other types are the auth-form section's (notice, copy, actions).
const row = (label, why, value, href) => ({ type: 'row', label, why, value, ...(href ? { href } : {}) });
const email = row('Email', 'The address used to sign in.', 'mubeen@example.com');
const timezone = row('Timezone', 'A day ends at midnight in this timezone. Changing it does not move anything already written.', 'Karachi (UTC+5)', '00-prototype.html#timezone-choose');
const devicesHead = { type: 'shead', text: 'Signed-in devices' };
const thisDevice = row('Chrome on Windows', 'This device · last used now · signed in 30 September 2026.', 'This device');
const otherDevice = row('Safari on iPhone', 'Last used 5 October 2026 · signed in 2 October 2026.', 'Sign out', '00-prototype.html#account-device-signed-out');
const signOut = { label: 'Sign out of this device', href: '00-prototype.html#auth-signed-out', grade: 'quiet' };
const signOutAll = { label: 'Sign out everywhere', href: '00-prototype.html#auth-signed-out', grade: 'quiet' };
const passwordCopy = { type: 'copy', text: 'To choose a new password, use the forgot-password link on sign in.' };
const account = (id, blocks) => ({ id, kind: 'account', title: 'Account', blocks });
export const accountStates = {
  // The chooser: the copy, a select of every zone (a field row without its inner column), Save and Leave.
  timezone: { id: 'timezone-choose', kind: 'account', title: 'Timezone', blocks: [
    { type: 'copy', text: 'A day ends at midnight in this timezone. Changing it does not move what you have already written.' },
    { type: 'form', form: { action: '00-prototype.html#account-devices' }, fields: [{ id: 'timezone-list', label: 'Timezone', attrs: {}, options: timezones, inner: false }], submit: 'Save timezone' },
    { type: 'actions', items: [{ label: 'Leave as it is', href: '00-prototype.html#account-devices', grade: 'quiet' }] },
  ] },
  devices: account('account-devices', [email, timezone, devicesHead, thisDevice, otherDevice, { type: 'actions', items: [signOut, signOutAll] }, passwordCopy]),
  'only-device': account('account-only-device', [email, timezone, devicesHead, thisDevice, { type: 'actions', items: [signOut] }, passwordCopy]),
  'device-signed-out': account('account-device-signed-out', [email, timezone, devicesHead, thisDevice, { type: 'actions', items: [signOut] }, passwordCopy]),
  'device-failed': account('account-device-failed', [email, timezone, devicesHead, thisDevice, otherDevice, { type: 'notice', text: 'We could not reach the server. That device is still signed in. Try its Sign out action again.' }, { type: 'actions', items: [signOut, signOutAll] }, passwordCopy]),
  'timezone-failed': { id: 'timezone-failed', kind: 'account', title: 'Timezone not changed', blocks: [
    { type: 'notice', text: 'We could not reach the server. Your timezone is still Karachi (UTC+5).' },
    { type: 'actions', items: [{ label: 'Try again', href: '00-prototype.html#timezone-choose', grade: 'solid' }] },
  ] },
  'delete-pending': { id: 'account-delete-pending', kind: 'account', title: 'Deleting account', blocks: [
    { type: 'copy', text: 'Deleting your account and everything in it. You will be signed out everywhere.' },
  ] },
};
