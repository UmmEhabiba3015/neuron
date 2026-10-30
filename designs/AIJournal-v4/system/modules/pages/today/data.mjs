// Today's content (01-today, journal-website.html #today): the settled day, written once for every
// platform. Links point into the prototype, as the screens' do. The 14:05 recording's waveform is the
// wave's own (the memo's phrase at a fixed pitch).
import { DESTINATIONS } from '../../../content/destinations.mjs';
import reflection from '../reflection/data.mjs';
// The overview is the latest weekly reflection's line, read from the reflection itself so the two never disagree (v4 C4).
const week = reflection.latest.leaves[0];
const entry = "The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday. That lasted about an hour. I keep opening the email to check I read it right.";
export default {
  wordmark: 'Journal',
  day: { key: 'Day', value: "Sun 9 Aug '26" },
  destinations: DESTINATIONS,
  // The day's record, in order: entries (written, recording) and the product's notes on them.
  record: [
    { kind: 'written', time: '09:20', datetime: '2026-08-09T09:20', excluded: false, text: entry },
    { kind: 'note', text: "You wrote something close to this in March, about the job. That you'd decided not to think about it until Thursday.", cite: { label: '12 March', href: '00-prototype.html#day' } },
    { kind: 'recording', time: '14:05', datetime: '2026-08-09T14:05', excluded: false, duration: '2:41', play: 'Play recording, 2 minutes 41 seconds',
      text: "Walked the canal as far as the second bridge and back. Didn't listen to anything. There were two swans that have been there all summer and I've never once seen them move." },
    { kind: 'note', text: 'That stretch of canal is in your entry from 3 July too. What keeps taking you there?', cite: { label: '3 July', href: '00-prototype.html#day' } },
    { kind: 'written', time: '21:40', datetime: '2026-08-09T21:40', excluded: true, mark: 'Private, out of memory',
      text: "Priya rang. We talked for an hour about nothing. I'd forgotten that's a thing you can do." },
  ],
  noteLabel: 'From your record',
  actions: {
    edit: { label: 'Edit entry', href: '00-prototype.html#entry-edit' },
    delete: { label: 'Delete entry', href: '00-prototype.html#entry-delete-confirm' },
    deleteRecording: { label: 'Delete voice memo', href: '00-prototype.html#recording-delete-confirm' },
  },
  mood: 'Today felt',
  // A recording's label until it is transcribed (without models).
  untranscribed: 'Voice memo',
  overview: { line: week.line, dates: week.date, href: '00-prototype.html#reflections', reflection: '2026-08-03' },
  // a new account before its first reflection: Today's own first-week line (shorter than the booklet's, so it fits a
  // phone), opening the week so far
  overviewFirst: { first: true, line: 'Your first reflection comes on Sunday.', href: '00-prototype.html#reflections-empty', reflection: 'first:2026-08-03' },
  composer: { placeholder: 'Add to today', keepOut: 'Keep this out of memory', more: { label: 'More options', href: '00-prototype.html#composer-options' } },
  // The states (18-entry-system-states): the day as drawn with the first entry or the 14:05 recording changed.
  // editor: the entry's words in a field in place of the entry; confirm: the delete question in place of the
  // entry's (or recording's) tools. The copy is the packs' final markup (checked by page-parity).
  states: {
    'entry-edit': { entry: { editor: { text: entry } } },
    // Without models (no notes, no overview): before the model features, and a recording that didn't send.
    // The record replaced by a state message (no composer).
    'loading': { route: 'today-loading', skeleton: 'Opening your journal.' },
    'fetch-failed': { route: 'fetch-failed', message: { notice: 'We could not reach the server. Try loading it again.', retry: { label: 'Try again', href: '00-prototype.html#today', grade: 'solid' } } },
    // v4 C5: an entry and a voice memo that haven't uploaded, in the list at the time Save or Stop and keep was pressed,
    // with their standard tools and the pending line (retrying, or stopped when retries have given up).
    'entry-unsent': { route: 'entry-unsent', unsent: 'retrying' },
    'entry-unsent-stopped': { route: 'entry-unsent-stopped', unsent: 'stopped' },
    'mood-failed': { mood: { selected: 'low', failed: 'Mood was not changed. We could not reach the server; the saved mood is still Low. Choose a mood to try again.' } },
    'without-note': { route: 'today-without-note', withoutModels: true },
    'entry-edit-empty': { entry: { editor: { text: '', empty: 'An entry cannot be empty. Write something or delete the entry instead.' } } },
    'entry-edit-failed': { entry: { editor: { text: entry + ' I read the email again.', failed: 'Changes were not saved. We could not reach the server. Your changed text is still here; try saving again.' } } },
    'entry-delete-confirm': { entry: { confirm: { text: 'Delete this entry? This cannot be undone.', delete: { label: 'Delete entry', href: '00-prototype.html#entry-deleted' }, keep: { label: 'Keep entry', href: '00-prototype.html#today' } } } },
    'entry-delete-failed': { entry: { confirm: { text: 'We could not reach the server. The entry is still here.', delete: { label: 'Try again', href: '00-prototype.html#entry-delete-confirm' }, keep: { label: 'Keep entry', href: '00-prototype.html#today' } } } },
    'recording-delete-confirm': { recording: { confirm: { text: 'Delete this recording? This cannot be undone.', delete: { label: 'Delete recording', href: '00-prototype.html#recording-deleted' }, keep: { label: 'Keep recording', href: '00-prototype.html#today' } } } },
    'recording-delete-failed': { recording: { confirm: { text: 'We could not reach the server. The recording is still here.', delete: { label: 'Try again', href: '00-prototype.html#recording-delete-confirm' }, keep: { label: 'Keep recording', href: '00-prototype.html#today' } } } },
  },
  // v4 C5: the two rows that haven't uploaded (entry-unsent): a written entry and an untranscribed voice memo, at the
  // end of the day, and the pending line's words.
  unsent: {
    entry: { time: '22:14', datetime: '2026-08-09T22:14', text: "Sat on the step with tea until it went cold. The flat people still haven't written." },
    recording: { time: '22:31', datetime: '2026-08-09T22:31', duration: '1:05', play: 'Play recording, 1 minute 5 seconds' },
    retrying: 'Not uploaded yet. Trying again.',
    stopped: "Not uploaded. We can't reach the server; it tries again when you're back online.",
    retry: 'Try again',
  },
  // v4 C5: the voice memo draft line under the composer's field (opens the recorder on the draft).
  memoDraft: { form: 'draft', text: 'Voice memo draft', length: '0:47', action: 'Continue', label: 'Continue your voice memo draft, 0:47', hook: 'draft', place: 'span' },
  editor: { label: 'Entry text', id: 'state-entry-text', errorId: 'state-entry-error', save: 'Save changes', leave: { label: 'Leave as it was', href: '00-prototype.html#today' }, remove: { label: 'Delete entry', href: '00-prototype.html#entry-delete-confirm' } },
};
