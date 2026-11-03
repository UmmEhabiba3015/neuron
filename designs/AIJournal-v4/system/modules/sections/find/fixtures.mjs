// Copy from 04-ask (the row) and the approved Timeline search (explore timeline-jump-arrival f-wash-and-frame;
// DESIGN.md 2026-10-23). The long and non-Latin fixtures are stress tests.
const FAILED = 'We could not reach the server, so the search did not run. Your words are still in the field.';
export default ({ use }) => [
  { name: 'Default', state: 'default', note: "Ask's search row holding the field (04-ask).", props: {}, slots: { children: use('field', { tag: 'div', value: 'swans' }) } },
  { name: 'Pill', state: 'empty', note: 'The Timeline search at rest: nothing typed, no clear control, the found line empty.', props: { form: 'pill', mode: 'keyword', status: 'idle' } },
  { name: 'Pill, found', note: 'Keyword: the words typed, the clear control, the found line.', props: { form: 'pill', query: 'sleep', found: '3 days with “sleep”.' } },
  { name: 'Pill, in the flow', note: 'flow: the numbered comps below desktop, where the page scrolls under its pinned header; the pill does not stick.', props: { form: 'pill', mode: 'keyword', status: 'idle', flow: true } },
  { name: 'Pill, by meaning', state: 'selected', note: 'The switch on: in any words.', props: { form: 'pill', mode: 'meaning', query: 'sleep', found: '3 days about “sleep”, in any words.' } },
  { name: 'Pill, focus', state: 'focus-visible', note: 'The product focus ring round the whole bar while the field has focus.', props: { form: 'pill' } },
  { name: 'Pill, searching', state: 'loading', note: 'The app is running the search.', props: { form: 'pill', status: 'searching', query: 'the flat', found: 'Searching your journal.' } },
  { name: 'Pill, failed', state: 'error', note: 'The search did not run: the failure line and Try again.', props: { form: 'pill', status: 'failed', query: 'the flat', found: FAILED } },
  { name: 'Pill, stuck', note: 'Floating over the list as the running head: the pill, lifted, its found line a tag under it (from 1200 it narrows to 480px).', props: { form: 'pill', stuck: true, query: 'sleep', found: '3 days with “sleep”.' } },
  { name: 'Pill, stuck and failed', note: 'Floating, the failure in the tag with Try again.', props: { form: 'pill', stuck: true, status: 'failed', query: 'the flat', found: FAILED } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: {}, slots: { children: use('field', { tag: 'div', value: 'have I felt like this before, the week the flat people said Tuesday' }) } },
  { name: 'Pill, long', tags: ['long'], note: 'Stress test only.', props: { form: 'pill', query: 'have I felt like this before, the week the flat people said Tuesday', found: '12 days with “have I felt like this before, the week the flat people said Tuesday”.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese.', props: {}, slots: { children: use('field', { tag: 'div', value: 'лебеди 白鳥' }) } },
  { name: 'Pill, non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese.', props: { form: 'pill', mode: 'meaning', query: 'лебеди 白鳥', found: '2 days about “лебеди 白鳥”, in any words.' } },
];
