// The loading pages' skeletons (v4 round 10, from Ask's): the page's real frame (its masthead, nav and sheet), only
// the content in bones, drawn with the real row modules so the gutters, widths and rhythm are the page's own and
// nothing jumps when it arrives. The status line is announced (bone form status, role status) and hidden. The
// calling page's kit is passed in.
const STAMP = '34px';  // a time in the gutter ("09:20")

// A written entry: its time and its lines (each a fraction of the row).
export const written = ({ use }, lines) => use('srow', { time: use('bone', { width: STAMP }), bareTime: true }, { children: use('bone', { form: 'text', lines }) });

// A voice memo: its time, the play button's box and the waveform in bone; its transcript's lines, if any.
export const memo = ({ html, use }, lines = []) => use('recrow', { head: 'dated', time: use('bone', { width: STAMP }), transcript: lines.length ? use('bone', { form: 'text', lines }) : '' }, {
  player: html`${use('bone', { form: 'block', width: 'var(--tap)', height: 'var(--tap)' })}${use('bone', { form: 'wave' })}`,
});

// The journal's note as the page draws it (folded, or open on the Day page): its label and the fold are the
// interface's own words, so they are real; the note's words are bones.
export const note = ({ use }, label, { open = false, ariaLabel = '' } = {}) => use('said', { label, ariaLabel, open, note: use('bone', { form: 'text', lines: [1, 0.6] }) });

// A day's entries' lines, varied so the skeleton reads as a day rather than a pattern (each row takes the next).
export const LINES = [[1, 0.55], [1, 1, 0.4], [0.75], [1, 0.7]];

// A day in the Timeline's list: its date in the gutter and the day's line.
export const day = ({ use }, lines) => use('dayrow', { date: use('bone', { width: '40px' }) }, { children: use('bone', { form: 'text', lines }) });

// The Reflections booklet's leaves, one for one (fixes 5): each leaf in its own form, the week's headline lines at
// its type, a note's big figures as one block on their line, its picture in its own grid (leafpic loading), its words at their type
// and its foot (the entries link, the thumbs) in bone. The end leaf is the interface's and stays; the leaf itself
// (paper, rule, stitches, number) is the booklet's. Each is named "loading", not by a bone.
export const leaves = ({ html, use }, list) => list.map(({ id, picture, source, ...l }) => l.form === 'end' ? l : ({
  ...l, name: 'loading', kicker: use('bone', { width: '96px' }), date: use('bone', { width: '48px' }),
  line: l.line ? use('bone', { form: 'text', size: 'inherit', height: '20px', lines: [1, 0.6] }) : '',
  big: l.big?.length ? [{ n: use('bone', { form: 'block', width: `${l.big.length * 120}px`, height: '44px' }), unit: '' }] : [],
  words: l.words ? use('bone', { form: 'text', size: 'inherit', lines: [1, 1, 0.5] }) : '',
  picture: picture ? use('leafpic', { ...picture, loading: true, place: 'pic' }) : '',
  foot: source ? html`${use('bone', { width: '64px', height: '10px' })}${use('bone', { form: 'block', width: '16px', height: '16px' })}${use('bone', { form: 'block', width: '16px', height: '16px' })}` : '',
}));

// Earlier weeks: one month and three weeks, each its dates and its line.
export const weeks = ({ use }) => { const month = use('bone', { width: '48px' }); return [0.7, 0.55, 0.8].map(w => ({ month, href: '', dates: use('bone', { width: '72px' }), line: use('bone', { form: 'text', lines: [w] }) })); };

// The mood row: its question in the gutter and the five words.
export const mood = ({ use }) => use('srow', { time: use('bone', { width: '40px' }), bareTime: true }, { children: use('bone', { form: 'spread' }) });

// The sheet with the announced line first, then the rows.
export const skeletonSheet = ({ html, use }, status, rows) => use('sheet', { place: 'block record' }, { children: html`${use('bone', { form: 'status', text: status })}${rows}` });
