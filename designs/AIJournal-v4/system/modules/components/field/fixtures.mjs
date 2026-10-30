// Copy from the screens (04-ask search stand-in, 13-login, 15-auth-states, the entry editor).
// The long and non-Latin fixtures are stress tests, not product copy.
export default [
  { name: 'Input', note: 'A single-line field, as in the auth forms.', props: { tag: 'input', label: 'Email', value: 'mira@example.com' } },
  { name: 'Composer', note: "The composer's field, empty (01-today).", props: { tag: 'input', label: 'Add to today', value: '' } },
  { name: 'Textarea', note: 'The live composer’s field (the prototypes and the website): one line centred in the box, growing evenly.', props: { tag: 'textarea', label: 'Entry', value: 'Walked by the lake. Swans again.' } },
  { name: 'Account textarea', note: 'A textarea in an account form (16-flow-states): a block with the form\'s padding.', props: { tag: 'textarea', form: 'account', label: 'Your entry', value: 'We could not reach the server.' } },
  { name: 'Editor textarea', note: 'The entry editor\'s textarea (18-entry-system-states): three --ctl tall, --s6 padding.', props: { tag: 'textarea', form: 'editor', label: 'Entry text', value: 'The flat people said Tuesday.' } },
  { name: 'Select', note: 'The native timezone picker in the auth forms.', props: { form: 'account', tag: 'select', label: 'Timezone', value: 'Europe/London' } },
  { name: 'Div', note: 'The no-script comps stand in a div for the field.', props: { tag: 'div', label: 'Search', value: 'swans' } },
  { name: 'Placeholder', state: 'empty', note: 'The stand-in shows its hint in --rule-2.', props: { tag: 'div', placeholder: true, label: 'Search', value: 'Ask your journal' } },
  { name: 'Not placeholder', note: 'placeholder off, set explicitly.', props: { tag: 'input', placeholder: false, label: 'Email', value: 'mira@example.com' } },
  { name: 'Invalid', state: 'error', note: 'A refused value (15-auth-states). The 2px border belongs to the auth forms (legacy context .auth-field), so it shows on the screens, not here.', props: { form: 'account', tag: 'input', invalid: true, label: 'Email', value: 'not-an-email' } },
  { name: 'Valid', note: 'invalid off, set explicitly.', props: { tag: 'input', invalid: false, label: 'Email', value: 'mira@example.com' } },
  { name: 'Focus', state: 'focus-visible', note: 'Its own border, 2px in --block, drawn inward (v4 round 10): nothing under the box is covered.', props: { tag: 'input', label: 'Email', value: 'mira@example.com' } },
  { name: 'Bare', note: "The Timeline search pill's input (v4 C1): no box of its own; the pill draws it.", props: { tag: 'input', form: 'bare', label: 'Search your journal', value: 'sleep' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only.', props: { tag: 'input', label: 'Email', value: 'a.very.long.address.that.keeps.going.and.going@a-rather-long-subdomain.example.com' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only.', props: { tag: 'input', label: 'Имя · 名前', value: 'Анастасия · 山田花子' } },
];
