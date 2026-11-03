// The You page's content (07-you, journal-website.html #you): the settings rows in their groups, written
// once for every platform. Links point into the prototype, as the screens' do.
import { DESTINATIONS } from '../../../content/destinations.mjs';
export default {
  wordmark: 'You',
  since: { key: 'Keeping', value: "Since March '26" },
  destinations: DESTINATIONS,
  groups: [
    { heading: 'What is private', rows: [
      { label: 'What the model can see', why: 'The entries, transcripts and moods it may read, and what stays out of memory.', value: 'Review', href: '00-prototype.html#settings-visible' },
      { label: 'Privacy', why: 'What is sent, who processes it, and how long it is kept.', value: 'Read it', href: '00-prototype.html#settings-privacy' },
    ] },
    { heading: 'What is yours', rows: [
      { label: 'Your data', why: 'Export entries and recordings, or delete the account and everything in it.', value: '148 and 31', href: '00-prototype.html#settings-data' },
    ] },
    { heading: 'Your account', rows: [
      { label: 'Account', why: 'Your email, signed-in devices, sign out and timezone.', value: 'mubeen@example.com', href: '00-prototype.html#account-devices' },
    ] },
  ],
  foot: 'Since March 2026',
};
