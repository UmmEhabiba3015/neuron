// Area 4 (the Timeline, v4 C1): timeline-none-keyword, timeline-none-meaning, timeline-dayrow, timeline-mark, timeline-back.
// name -> render => markup (tools/modules/templates.mjs; files load in name order).
// The record's no-matches state as the stand-in search (scripts/journal-timeline.js) puts it in place of the
// rows: a heading and the explanation, the copy the record renders for the no-matches comp state (Ask's old
// one, DESIGN.md 2026-10-23), one per search mode.
const none = (render, heading, text) => `${render('shead', { text: heading })}${render('srow', {}, { children: render('text', { form: 'lede', text }) })}`;

// timeline-dayrow and timeline-mark: an entry the preview adds today, as the record draws a day's later writing (no
// date of its own, the writing as a lede) and the record's own mark for writing out of memory (prototype-runtime.js).

export default {
  'timeline-dayrow': render => render('dayrow', { date: '', datetime: '' }, { children: render('text', { form: 'lede', text: '' }) }),
  'timeline-mark': render => render('mark', { label: 'Private, out of memory', place: 'after' }),
  // timeline-back: the back module, whose chevron marks Timeline's Reflections destination as the way back to the
  // reflection when Timeline was opened from a leaf's N entries (v4 C3; scripts/journal-reflection.js).
  'timeline-back': render => render('back', { label: 'Reflections', href: '00-prototype.html#reflections' }),
  'timeline-none-keyword': render => none(render, 'No entries match those words', 'Search looks for the words you type. Nothing you have written uses these ones.'),
  'timeline-none-meaning': render => none(render, 'No entries are about that', 'By meaning, search looks for what an entry is about, in any words. Nothing you have written comes close.'),
};
