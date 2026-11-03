// The settings page on each platform and state (10-settings-privacy). The catalogue draws a page at the
// catalogue's width, so the desktop fixture shows the title block's markup, not the desktop stage.
export default [
  { name: 'Mobile', note: 'Privacy: the masthead row inside the page (10-settings-privacy, mobile-web).', props: { platform: 'mobile', state: 'privacy' } },
  { name: 'Tablet', note: 'As mobile, at tablet width (10-settings-privacy, tablet-web).', props: { platform: 'tablet', state: 'privacy' } },
  { name: 'Desktop', note: 'The masthead in the title block beside the page (10-settings-privacy, desktop-web).', props: { platform: 'desktop', state: 'privacy' } },
  { name: 'What it sees', note: 'The model visibility state: two headed lists and a notice (settings-visible).', props: { platform: 'mobile', state: 'visible' } },
  { name: 'Your data', note: 'The data state: export and delete (settings-data).', props: { platform: 'mobile', state: 'data' } },
  // 17-account-data (pages round 4b)
  { name: 'Delete confirm', note: 'The data page with the delete dialog after the record (account-delete-confirm).', props: { platform: 'mobile', state: 'delete-confirm' } },
  { name: 'Delete failed', note: 'The delete dialog with its failure line (account-delete-failed).', props: { platform: 'mobile', state: 'delete-failed' } },
  { name: 'Export preparing', note: 'The data page with the export message and its button (export-preparing).', props: { platform: 'mobile', state: 'export-preparing' } },
  { name: 'Export ready', note: 'A notice and two buttons in the state message (export-ready).', props: { platform: 'mobile', state: 'export-ready' } },
  { name: 'Export empty', state: 'empty', note: 'The export row counts 0 and 0 (export-empty).', props: { platform: 'mobile', state: 'export-empty' } },
  { name: 'Export failed', state: 'error', note: 'A failure notice and a retry button (export-failed).', props: { platform: 'mobile', state: 'export-failed' } },
  { name: 'Account devices', note: 'The account state page: two signed-in devices (account-devices).', props: { platform: 'mobile', state: 'devices' } },
  { name: 'Only device', note: 'This device only (account-only-device).', props: { platform: 'mobile', state: 'only-device' } },
  { name: 'Device signed out', note: 'After a device is signed out (account-device-signed-out).', props: { platform: 'mobile', state: 'device-signed-out' } },
  { name: 'Device failed', note: 'The sign-out failure notice among the devices (account-device-failed).', props: { platform: 'mobile', state: 'device-failed' } },
  { name: 'Timezone failed', note: 'The timezone was not changed (timezone-failed).', props: { platform: 'mobile', state: 'timezone-failed' } },
  { name: 'Delete pending', note: 'The account is being deleted (account-delete-pending).', props: { platform: 'mobile', state: 'delete-pending' } },
  { name: 'Account devices, desktop', note: 'The generic state page on desktop: the title block (account-devices).', props: { platform: 'desktop', state: 'devices' } },
  { name: 'timezone', note: '17-account-data: #timezone.', props: { platform: 'mobile', state: 'timezone' } },
  { name: 'Loading', state: 'loading', note: '18-entry-system-states: #settings-loading, What it sees in bones (v4 round 10).', props: { platform: 'mobile', state: 'loading' } },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'privacy', context: 'walkthrough' } },
];
