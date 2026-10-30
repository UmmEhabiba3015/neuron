// Copy from the approved design (v4 round 10: one line everywhere). The long and non-Latin fixtures are stress
// tests, not product copy.
export default [
  { name: 'Open', note: 'As it opens after the thumbs down: one row as tall as the thumb\'s box, the question as the placeholder, Send at its end.', width: 320, props: { id: 'why-a1' } },
  { name: 'Empty', state: 'empty', note: 'The placeholder in --rule-2 until something is typed.', width: 320, props: { id: 'why-a6' } },
  { name: 'Field focus', state: 'focus-visible', note: 'The box\'s border thickens inward as every field\'s does (the thumbs focus it on opening).', width: 320, props: { id: 'why-a2' } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: the words scroll inside the line; the row keeps its height.', width: 320, props: { id: 'why-a3', value: 'It mixed up two different weeks. The walk to the canal was in July, not August.' } },
  { name: 'Narrow', note: 'At its narrowest (180px), where the thumbs drop it under them.', width: 180, props: { id: 'why-a5' } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian, not product copy.', width: 320, props: { id: 'why-a4', question: 'Что было не так?', send: 'Отправить' } },
];
