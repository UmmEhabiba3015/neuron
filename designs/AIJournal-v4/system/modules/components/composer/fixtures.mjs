// Copy from the screens: desktop-web/11-states (plain, with words), desktop-web/01-today (companion),
// mobile-app/01-today (iOS, the option straight after the row) and the guide's "Composer" (Developer).
// The field, send, option and button are modules built with use(). The long and non-Latin fixtures
// are stress tests, not product copy.
export default ({ html, raw, use }) => {
  const field = use('field', { tag: 'div', value: 'Add to today', placeholder: true });
  const words = use('field', { tag: 'div', value: 'Priya rang. We talked for an hour about nothing.' });
  const send = use('send', { label: 'Save' });
  const opt = use('opt', { label: 'Keep this out of memory', place: 'option' });
  const tools = html`${opt}${use('button', { grade: 'quiet', href: '#composer-options', label: 'More options', place: 'fixed' })}`;
  // A component cannot use a section, so the overview's place holds a plain line here (the section's own catalogue
  // draws the overview; the composer alone and together must match).
  const overview = use('text', { form: 'label', text: 'Five days here, and sleep on your mind.', place: 'head' });
  // v4 C5: the voice memo draft line under the row (pending's draft form, place span)
  const draft = use('pending', { form: 'draft', text: 'Voice memo draft', length: '0:47', action: 'Continue', label: 'Continue your voice memo draft, 0:47', place: 'span' });
  const help = html`<p class="auth-help" role="alert">An entry cannot be empty. Write something or delete the entry instead.</p>`;
  const note = 'Ask reads only your own entries. The 4 kept out of memory are never read.';
  // each chat fixture its own field id, so every label names its own field on the catalogue page
  let n = 0;
  const chat = () => ({ form: 'chat', fieldId: `aj-ask-${++n}`, note });
  const lead = (line) => ({ lead: use('text', { form: 'prose', text: line }) });
  return [
    { name: 'Plain', note: 'The empty composer: the field, the mic, the tools row (desktop-web/11-states).', props: { form: 'plain', filled: false, toolsRow: true, hooks: false }, slots: { row: field, tools } },
    { name: 'Companion', note: 'The website\'s writing companion: the recent overview first (desktop-web/01-today).', props: { form: 'companion' }, slots: { overview, row: field, tools } },
    { name: 'Companion with an error', note: 'The companion with its error line after the tools (the empty-entry state, 11-states).', props: { form: 'companion' }, slots: { overview, row: field, tools, after: help } },
    { name: 'Companion, memo draft', note: 'v4 C5: a voice memo draft is kept: its line under the field, the overview above (explore drafts a-quiet-line).', props: { form: 'companion' }, slots: { overview, row: field, draft, tools } },
    { name: 'With words, memo draft', note: 'v4 C5: words in the field, so Save stands where the mic was; the draft line is the way back to the memo.', props: { form: 'companion', filled: true }, slots: { overview, row: html`${words}${send}`, draft, tools } },
    { name: 'iOS', note: 'The native app: the option straight after the row, no tools row (mobile-app/01-today).', props: { toolsRow: false }, slots: { row: field, tools: opt } },
    { name: 'With words', note: 'The field holds words, so send stands in place of the mic (desktop-web/11-states).', props: { filled: true }, slots: { row: html`${words}${send}`, tools } },
    { name: 'Empty', state: 'empty', note: 'The field shows its placeholder and the filled control is the mic.', props: {}, slots: { row: field, tools } },
    { name: 'Hover', state: 'hover', note: 'The mic turns --block on a pointer device; drawn at rest here, hover it to see.', props: {}, slots: { row: field, tools } },
    { name: 'Focus', state: 'focus-visible', note: 'The product focus ring (base) on the field and the mic; tab to them to see it.', props: {}, slots: { row: field, tools } },
    { name: 'Active', state: 'active', note: 'The mic presses: scale .97 in the shell, 1px down without it; press it to see.', props: {}, slots: { row: field, tools } },
    { name: 'Developer', note: 'The guide\'s sample: the field (aria-labelled), the mic, the hidden send the runtime swaps in, the option and a status line, with the developer runtime\'s hooks (design system, "Composer").', props: { hooks: true, toolsRow: false }, slots: {
      row: use('field', { label: 'Add to today' }),
      standby: raw(use('send', { label: 'Save' }).text.replace('<button ', '<button data-action="save" hidden ')),
      tools: raw(opt.text.replace('<button ', '<button data-action="memory" ')),
      after: html`<p data-journal-status role="status" aria-live="polite"></p>`,
    } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long placeholder in the default field.', props: { placeholder: 'Add to today: everything that happened this morning, the long walk, the phone call and what was said' }, slots: { tools } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { placeholder: 'Добавить к сегодня 今日に追加' }, slots: { tools } },
    { name: 'Chat', note: 'Ask\'s composer: the empty rounded field, the round Ask button, the note on a slip.', props: chat(), slots: {} },
    { name: 'Chat, words', note: 'A question that was not sent goes back into the box.', props: { ...chat(), value: 'Have I written about the dentist?' }, slots: {} },
    { name: 'Chat focus', state: 'focus-visible', note: 'The rounded field takes the focus ring while its textarea has focus; click into it to see.', props: chat(), slots: {} },
    { name: 'Chat hover', state: 'hover', note: 'The Ask button turns --block on a pointer device; drawn at rest here, hover it to see.', props: chat(), slots: {} },
    { name: 'Chat, past day', state: 'disabled', note: 'A past day: the read-only slip in place of the field.', props: { form: 'chat', fieldId: 'aj-ask-past', readonly: true, readonlyText: 'Past sessions are read only.', todayLabel: 'Back to today', todayHref: '00-prototype.html#ask' }, slots: {} },
    { name: 'Chat, waiting', state: 'loading', note: 'A day is loading: the field at 60%, the lead says what it waits for.', props: { ...chat(), waiting: true }, slots: lead('Loading Sunday 9 August…') },
    { name: 'Chat, lead', note: 'The lead above the field.', props: chat(), slots: lead('What would you like to ask?') },
    { name: 'Chat long', tags: ['long'], note: 'Stress test only: three sentences in the field.', props: { ...chat(), value: 'I keep thinking about what Priya said on Sunday about moving to Leeds, and whether I wrote down how I felt about it at the time. Did I? And what did I say the week after?' }, slots: {} },
    { name: 'Chat non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian, not product copy.', props: { ...chat(), value: 'Что я писал о сне в июле?' }, slots: {} },
  ];
};
