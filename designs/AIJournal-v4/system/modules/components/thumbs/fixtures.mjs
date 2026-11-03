// The thumbs on their own (the catalogue's frame is the containing block the form floats in). The long and
// non-Latin fixtures are stress tests, not product copy.
export default [
  { name: 'Default', note: 'Helpful and Not helpful, neither set.', props: { id: 't1', rating: 'none' } },
  { name: 'Helpful', state: 'selected', note: 'The thumbs up set: filled --rate-up.', props: { id: 't2', rating: 'up' } },
  { name: 'Not helpful', state: 'selected', note: 'A sent thumbs down: filled --rate-down. Pressed again it returns to none; then it asks again.', props: { id: 't3', rating: 'down' } },
  { name: 'Hover', state: 'hover', note: 'Each thumb’s hover in its own colour.', props: { id: 't4' } },
  { name: 'Focus', state: 'focus-visible', note: 'A thumb takes the product’s ring.', props: { id: 't5' } },
  { name: 'Asking why', note: 'The thumbs down pressed: its form open under the row, from its start, the thumb expanded.', props: { id: 't6', asking: true } },
  { name: 'Pair', note: 'A note’s foot: a small row of its own, the thumbs --s1 apart.', props: { id: 't10', form: 'pair' } },
  { name: 'Pair asking', note: 'The pair’s form floats from the start of the row that holds it.', props: { id: 't7', form: 'pair', asking: true } },
  { name: 'Long', tags: ['long'], note: 'Stress test only: long names.', props: { id: 't8', labels: { up: 'This was helpful to me and I would like more like it', down: 'This was not helpful and I would like to say why' } } },
  { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Japanese names.', props: { id: 't9', labels: { up: '役に立った', down: '役に立たなかった' } } },
];
