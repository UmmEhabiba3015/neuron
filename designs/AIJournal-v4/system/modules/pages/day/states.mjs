// Day's contextual states (pages round 4b), read from the pack's final markup (18-entry-system-states, the same on
// every platform): fetch-failed is the page as drawn with its sheet holding a state message (a notice and the
// retry action); the shell carries the state's route as its id.
export default {
  // without-note: the day as written, no notes, Today's recording first (as the pack draws it).
  'without-note': { id: 'day-without-note', withoutModels: true },
  // loading (v4 round 10): the day's skeleton in the real sheet, its rows in the record's order; the line announced.
  'loading': { id: 'day-loading', skeleton: 'Loading this day.' },
  'fetch-failed': { id: 'day-fetch-failed', notice: 'We could not reach the server. Try loading this day again.', retry: { label: 'Try again', href: '00-prototype.html#day', grade: 'solid' } },
};
