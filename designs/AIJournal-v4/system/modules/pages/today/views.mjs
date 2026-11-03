// 11-states' views of today (journal-website.html #empty-today, #today-first, #audio-no-transcript, #note-open,
// #draft; v4 C5: #memo-draft, #memo-draft-typed, #empty-today-memo-draft): clipped crops of the page, copied from the screen. The recording and the first note are today's own
// (data.mjs); the crops cut the first entry to its first sentence (excerpt).
export const excerpt = "The flat people said Tuesday, and it's Sunday, so I've decided not to think about it until Tuesday.";

export default {
  // v4 C4: Empty Today carries the week's overview (the companion form); a new account's first day carries the
  // first-week line instead, dated the day it joined (Thu 6 Aug, as Reflections' week so far).
  empty: { header: true, empty: "What's today been like?", composer: {}, overview: 'week' },
  first: { header: true, day: "Thu 6 Aug '26", empty: "What's today been like?", composer: {}, overview: 'first' },
  'audio-no-transcript': { heading: 'Today, before transcription', entry: true, recording: 'Voice memo' },
  'note-open': { heading: 'The note, opened', entry: true, note: true },
  draft: { heading: 'Something is typed', entry: true, composer: { typed: 'Priya rang. We talked for an hour about nothing.' } },
  // v4 C5: a voice memo draft is kept on the device: its line under the field, empty, with words (Save stands where the
  // mic was), and on Empty Today.
  'memo-draft': { heading: 'A voice memo draft is kept', entry: true, composer: {}, memoDraft: true },
  'memo-draft-typed': { heading: 'Something is typed, and a memo draft is kept', entry: true, composer: { typed: 'Priya rang back. She wants to come on Saturday.' }, memoDraft: true },
  'empty-today-memo-draft': { header: true, empty: "What's today been like?", composer: {}, overview: 'week', memoDraft: true },
};
