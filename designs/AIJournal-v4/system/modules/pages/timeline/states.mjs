// Timeline's states. The card's and the search's are v4 C1's (explore timeline-jump-arrival f-wash-and-frame;
// DESIGN.md 2026-10-23); earlier, end and loading are the old design's (18-entry-system-states: the shell carries
// the state's route as its id), and thin-week (11-states: a few days, the shell clipped as the pack's is).
// A state may give: open (the card's parts), shown (the card's week), day (the day in view), moods and items (a
// smaller journal), search ({ query, mode, status, found, marks, none }), arrive (a jumped-to day), foot, message.
import data from './data.mjs';

const ITEMS = data.items;
const at = date => ITEMS.findIndex(i => i.datetime === date);
const before = (moods, date) => Object.fromEntries(Object.entries(moods).filter(([d]) => d < date));
// The search's copy (the approved design; the no-matches explanation is Ask's old one, DESIGN.md 2026-10-23).
const FAILED = 'We could not reach the server, so the search did not run. Your words are still in the field.';
const PRIYA = { query: 'Priya', found: '2 days with “Priya”.' };

export default {
  // The card (both parts start closed).
  mood: { open: { mood: true } },
  calendar: { open: { calendar: true } },
  // An earlier week with one day written (27 Jul to 2 Aug): a straight line.
  'mood-one-day': { open: { mood: true }, shown: '2026-07-27' },
  // Nothing written this week yet: the empty strip and graph; history still steps back.
  'mood-empty-week': { open: { mood: true }, moods: before(data.moods, '2026-08-03'), items: [ITEMS[0], ...ITEMS.slice(at('2026-08-01'))], day: '2026-08-01' },

  // The search. Found: the days that match, the words marked; a later row of a day carries the date when the first
  // row is hidden.
  found: {
    search: { ...PRIYA, marks: ['Priya'] },
    items: [
      { kind: 'month', text: 'August 2026' },
      { ...ITEMS[3], date: 'Sun 9', datetime: '2026-08-09', id: 'd-2026-08-09' },
      { kind: 'month', text: 'June 2026' },
      ITEMS[at('2026-06-28')],
    ],
  },
  'no-matches': { search: { query: 'swans', none: { heading: 'No entries match those words', text: 'Search looks for the words you type. Nothing you have written uses these ones.' } } },
  searching: { search: { ...PRIYA, status: 'searching', found: 'Searching your journal.' } },
  'search-failed': { search: { ...PRIYA, status: 'failed', found: FAILED } },

  // The old design's.
  loading: { id: 'timeline-loading', skeleton: 'Loading your days.' },
  earlier: { id: 'timeline-earlier', foot: 'Fetching earlier entries.' },
  end: { id: 'timeline-end', foot: 'There is nothing earlier in this journal.' },
  'thin-week': {
    clip: true,
    foot: 'Since 3 August 2026',
    moods: { '2026-08-09': 'even', '2026-08-08': 'good', '2026-08-05': 'low', '2026-08-03': 'even' },
    items: [
      { kind: 'month', text: 'August 2026' },
      { kind: 'day', date: 'Sun 9', datetime: '2026-08-09', text: 'Tried again with the flat people. No answer, which I have decided is not an answer.', id: 'd-2026-08-09' },
      { kind: 'recording', date: 'Sat 8', datetime: '2026-08-08', play: 'Play recording from Saturday 8 August, 5 minutes 8 seconds', duration: '5:08', transcript: 'Voice memo', excluded: false, wave: 1, id: 'd-2026-08-08' },
      { kind: 'day', date: 'Wed 5', datetime: '2026-08-05', text: 'Nothing much. Wrote this so there would be something here.', id: 'd-2026-08-05' },
      { kind: 'day', date: 'Mon 3', datetime: '2026-08-03', text: 'First proper go at this. Felt strange talking to a page.', id: 'd-2026-08-03' },
    ],
  },
};
