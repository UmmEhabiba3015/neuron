// Today on each platform (01-today). The catalogue draws a page at its own width.
export default [
  { name: 'Mobile', note: 'The header section inside the page (01-today, mobile-web).', props: { platform: 'mobile', state: 'default' } },
  { name: 'Tablet', note: 'As mobile; the waveform drawn to the tablet row (01-today, tablet-web).', props: { platform: 'tablet', state: 'default' } },
  { name: 'Desktop', note: 'The masthead and destinations in the title block beside the page (01-today, desktop-web).', props: { platform: 'desktop', state: 'default' } },
  // Pages round 4b (18-entry-system-states): the day with the first entry or the recording changed.
  ...['entry-edit', 'entry-edit-empty', 'entry-delete-confirm', 'entry-delete-failed', 'recording-delete-confirm', 'recording-delete-failed']
    .map(state => ({ name: state, note: `#${state}`, props: { platform: 'mobile', state } })),
  // Pages round 4b, the generic states (18-entry-system-states).
  { name: 'Composer options', note: '#composer-options: the entry row and the options panel (the panel kind).', props: { platform: 'mobile', state: 'composer-options' } },
  { name: 'Support resource', note: '#support-resource.', props: { platform: 'mobile', state: 'support-resource' } },
  { name: 'Entry options', note: '#entry-options: the entry with its tools.', props: { platform: 'mobile', state: 'entry-options' } },
  { name: 'Recording options', note: '#recording-options, tablet.', props: { platform: 'tablet', state: 'recording-options' } },
  { name: 'Entry out of memory', note: '#entry-memory.', props: { platform: 'mobile', state: 'entry-memory' } },
  { name: 'Entry back in memory', note: '#entry-memory-return.', props: { platform: 'mobile', state: 'entry-memory-return' } },
  { name: 'Recording out of memory', note: '#recording-memory, desktop: the title block.', props: { platform: 'desktop', state: 'recording-memory' } },
  { name: 'Recording back in memory', note: '#recording-memory-return.', props: { platform: 'mobile', state: 'recording-memory-return' } },
  { name: 'Entry saved', note: '#entry-saved.', props: { platform: 'mobile', state: 'entry-saved' } },
  { name: 'entry-edit-failed', note: '18-entry-system-states: #entry-edit-failed.', props: { platform: 'mobile', state: 'entry-edit-failed' } },
  { name: 'entry-deleted', note: '18-entry-system-states: #entry-deleted.', props: { platform: 'mobile', state: 'entry-deleted' } },
  { name: 'recording-deleted', note: '18-entry-system-states: #recording-deleted.', props: { platform: 'mobile', state: 'recording-deleted' } },
  { name: 'without-note', note: '18-entry-system-states: #without-note.', props: { platform: 'mobile', state: 'without-note' } },
  { name: 'loading', state: 'loading', note: '18-entry-system-states: #today-loading, the skeleton (v4 round 10).', props: { platform: 'mobile', state: 'loading' } },
  { name: 'fetch-failed', note: '18-entry-system-states: #fetch-failed.', props: { platform: 'mobile', state: 'fetch-failed' } },
  { name: 'entry-unsent', note: 'v4 C5, 18-entry-system-states: #entry-unsent, a written entry and a voice memo not uploaded yet, retrying.', props: { platform: 'mobile', state: 'entry-unsent' } },
  { name: 'entry-unsent-stopped', note: 'v4 C5, 18-entry-system-states: #entry-unsent-stopped, retries have given up (desktop).', props: { platform: 'desktop', state: 'entry-unsent-stopped' } },
  { name: 'mood-failed', note: '18-entry-system-states: #mood-failed.', props: { platform: 'mobile', state: 'mood-failed' } },
  { name: 'empty', note: '11-states: #empty-today, with the week\'s overview in the companion form (v4 C4).', props: { platform: 'mobile', state: 'empty' } },
  { name: 'first', note: '11-states: #today-first, a new account\'s first day with the first-week line (v4 C4).', props: { platform: 'mobile', state: 'first' } },
  { name: 'audio-no-transcript', note: '11-states: #audio-no-transcript.', props: { platform: 'mobile', state: 'audio-no-transcript' } },
  { name: 'note-open', note: '11-states: #note-open.', props: { platform: 'mobile', state: 'note-open' } },
  { name: 'draft', note: '11-states: #draft.', props: { platform: 'mobile', state: 'draft' } },
  { name: 'memo-draft', note: 'v4 C5, 11-states: #memo-draft, the voice memo draft line under the field.', props: { platform: 'mobile', state: 'memo-draft' } },
  { name: 'memo-draft-typed', note: 'v4 C5, 11-states: #memo-draft-typed, words in the field and the draft line.', props: { platform: 'mobile', state: 'memo-draft-typed' } },
  { name: 'empty-today-memo-draft', note: 'v4 C5, 11-states: #empty-today-memo-draft, Empty Today with the draft line.', props: { platform: 'mobile', state: 'empty-today-memo-draft' } },
  // Pages round 5: as the prototypes and the website draw it (the navbar page where it has the header section).
  { name: 'Walkthrough', note: 'context walkthrough, mobile.', props: { platform: 'mobile', state: 'default', context: 'walkthrough' } },
];
