// The error pages (18-entry-system-states, journal-website.html #not-found, #server-error): generic state
// pages (system/content/state-page.mjs), their body as the auth-form section's blocks.
export default {
  'not-found': { id: 'not-found', kind: 'journal', title: 'Page not found', blocks: [
    { type: 'copy', text: 'This entry or day could not be found.' },
    { type: 'actions', items: [{ label: 'Back to Today', href: '00-prototype.html#today', grade: 'solid' }] },
  ] },
  'server-error': { id: 'server-error', kind: 'journal', title: 'Something went wrong', blocks: [
    { type: 'copy', text: 'We could not show this page. Please try again.' },
    { type: 'actions', items: [{ label: 'Try again', href: '00-prototype.html#today', grade: 'solid' }] },
  ] },
};
