// The journal of the approved design (explore ask-readable, shared/ask.js): Sunday 9 August 2026, the first
// session. The long and non-Latin fixtures are stress tests, not product copy.
const DAY = '00-prototype.html#day';
const refs = [
  { short: '6 Aug', long: 'Thursday 6 August, 22:10', text: 'Slept badly again. I’ve stopped counting which night this is.', href: DAY },
  { short: '3 Jul', long: 'Friday 3 July, 18:20', text: 'Walked to the canal after work. The swans were exactly where they always are, which I found more reassuring than it probably is.', href: DAY },
];
const sleep = ['Sleep comes up in eleven of your entries since June. Nine of them were written after ten at night{1}, and most are less about the night than about the next day: work you haven’t started, a call you keep putting off.', 'The nights you slept well, you had been out walking first{2}.'];
const answer = { voice: 'answer', id: 'a1', paras: sleep, refs, used: '2 entries used' };
const you = { voice: 'you', id: 'q1', paras: ['What do I write about when I can’t sleep?'] };
const cant = { voice: 'answer', id: 'a4', cant: true, paras: ['Your journal doesn’t mention a wedding, or anyone called Sam, so I can’t answer that from it.', 'Entries you keep out of memory are never read, so if you wrote about it in one of those, it isn’t here.'], next: { label: 'Search Timeline for “wedding”', href: '00-prototype.html#timeline' } };
export default [
  { name: 'Yours', note: 'Your message: on the right, its tail at the lower right; bookmark and copy under it (with a mouse they fade in on hover).', props: you },
  { name: 'Answer', note: 'The answer: wider, on the left; the dates are its references (each opens that day); “2 entries used”; the tools inside it.', props: { ...answer, status: 'done', rating: 'none' } },
  { name: 'Answer hover', state: 'hover', note: 'With a mouse, hovering the message fades its tools in.', props: { ...answer, id: 'a2' } },
  { name: 'Answer focus', state: 'focus-visible', note: 'Keyboard focus inside the message shows its tools; the reference takes the ring.', props: { ...answer, id: 'a3' } },
  { name: 'Bookmarked, helpful', state: 'selected', note: 'A set bookmark and a filled thumbs up stay shown, filled (--rule, --rate-up).', props: { ...answer, id: 'a5', bookmarked: true, rating: 'up' } },
  { name: 'Asking why', note: 'The thumbs down pressed: its form open under the tools, the thumb expanded (drawn by asking; live, the script opens it).', props: { ...answer, id: 'a13', asking: true } },
  { name: 'Not helpful', state: 'selected', note: 'A sent thumbs down, filled --rate-down. Pressed again it returns to none; then it asks again.', props: { ...answer, id: 'a6', rating: 'down' } },
  { name: 'Can’t answer', state: 'error', note: 'Not in your journal (f-mix, A’s dashed outline): unfilled, dashed --w-dash in --rule-2, flagged, a way to search the Timeline; no thumbs.', props: cant },
  { name: 'Not sent', state: 'disabled', note: 'The question did not send (ask-states D): dimmed and dashed, “Not sent”, no tools; it goes back into the composer.', props: { voice: 'you', id: 'q7', unsent: true, paras: ['Have I written about the dentist?'] } },
  { name: 'Reading', state: 'loading', note: 'The answer before its first word: the reading line.', props: { voice: 'answer', id: 'a8', status: 'reading' } },
  { name: 'Writing', state: 'loading', note: 'The answer as it arrives: each word softly; “entries used” and the tools wait until it is done.', props: { voice: 'answer', id: 'a9', status: 'writing', paras: ['Sleep comes up in eleven of your entries since June. Nine of them were written'] } },
  { name: 'Yours long', tags: ['long'], note: 'Stress test only.', props: { voice: 'you', id: 'q10', paras: ['I keep thinking about what Priya said on Sunday about moving to Leeds, and whether I wrote down how I felt about it at the time. Did I? And what did I say about it the week after, when we talked again on the phone and she sounded so sure?'] } },
  { name: 'Answer long', tags: ['long'], note: 'Stress test only: a reference never parts from its brackets.', props: { ...answer, id: 'a11', paras: [...sleep, 'Antidisestablishmentarianism-length words wrap inside the bubble without pushing it wider than the column{1}.'] } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { voice: 'answer', id: 'a12', paras: ['О сне вы писали одиннадцать раз с июня{1}. 眠れない夜について、六月から十一回書いています。'], refs: [refs[0]], used: '1 запись' } },
];
