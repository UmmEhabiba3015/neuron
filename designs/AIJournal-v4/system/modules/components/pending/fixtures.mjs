// Copy from the decided exploration (explore/2026-10-29-drafts a-quiet-line). The long and non-Latin fixtures are
// stress tests, not product copy.
const status = { form: 'status', action: 'Try again' };
const draft = { form: 'draft', text: 'Voice memo draft', length: '0:47', action: 'Continue', label: 'Continue your voice memo draft, 0:47' };
export default [
  { name: 'Retrying', note: 'An unsent entry or memo, retrying on its own: under its words, in --rule-2, with Try again.', props: { ...status, text: 'Not uploaded yet. Trying again.' } },
  { name: 'Stopped', state: 'error', note: 'Retries have given up (offline for a while): the same line in --rule, the words say why.', props: { ...status, sub: 'stopped', text: 'Not uploaded. We can\'t reach the server; it tries again when you\'re back online.' } },
  { name: 'Sending', state: 'loading', note: 'After Try again: no button; the arrow lifts 2px and settles, --g-lift on --gc, looping (reduced motion: still).', props: { ...status, sub: 'sending', text: 'Uploading…' } },
  { name: 'Draft', note: 'The voice memo draft under the composer\'s field: one button, its length in --block, Continue with the dotted mark.', props: draft },
  { name: 'Draft hover', state: 'hover', note: 'On a fine pointer Continue turns --block and its underline solid; hover it to see.', props: draft },
  { name: 'Draft focus', state: 'focus-visible', note: 'The product focus ring (base) round the whole line; tab to it to see.', props: draft },
  { name: 'Long', tags: ['long'], note: 'Stress test only: a long line wraps, Try again stays whole.', props: { ...status, sub: 'stopped', text: 'Not uploaded. We can\'t reach the server at the moment, and it will try again on its own as soon as you\'re back online, so there is nothing you need to do.' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { ...status, text: 'Ещё не загружено. アップロードを再試行しています。', action: 'Повторить' } },
];
