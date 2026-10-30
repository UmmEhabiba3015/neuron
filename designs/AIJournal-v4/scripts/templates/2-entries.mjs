// Area 2 (entries): srow-entry, sheet-list, entry-actions-entry, entry-actions-recording, entry-actions-editor, entry-actions-confirm, mark-out.
// name -> render => markup (tools/modules/templates.mjs; files load in name order).
// The runtime clones these and fills only hooks, attributes and text: the time, the text, the memory
// state and the words of the editor and the confirmation. The static screens keep
// scripts/entry-controls.mjs's strings this round (round 3 corrections, 2026-10-13).
const LINE = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const PENCIL = `<svg ${LINE}><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>`;
const BIN = `<svg ${LINE}><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>`;

// The opt inside the memory dropdown is rendered by entry-actions itself, so its control hook is
// written on it here, once, when the template is built.
const memoryAction = html => html.replace('<button class="aj-c-opt"', '<button class="aj-c-opt" data-entry-action="memory"');

const tools = (r, kind) => {
  const recording = kind === 'recording';
  const edit = recording ? '' : r('button', { grade: 'quiet', form: 'icon', href: '#entry-edit', label: 'Edit entry' }, { icon: PENCIL }, { 'data-entry-action': 'edit' });
  const del = r('button', { grade: 'quiet', form: 'icon', href: recording ? '#recording-delete-confirm' : '#entry-delete-confirm', label: recording ? 'Delete voice memo' : 'Delete entry' }, { icon: BIN }, { 'data-entry-action': 'delete' });
  // Drawn kept out of memory, so the clone has the memory part; the runtime removes it from an entry in memory.
  return memoryAction(r('entry-actions', { form: 'tools', excluded: true, kind }, { children: edit + del }, { 'data-place': 'tools' }));
};

export default {
  'srow-entry': r => r('srow', { time: '00:00' }, { children: r('text', { form: 'prose', text: '' }) }),
  'sheet-list': r => r('sheet', { tag: 'div' }, { children: '' }, { 'data-place': 'block record', role: 'region', 'aria-label': 'Items added in this preview' }),
  'entry-actions-entry': r => tools(r, 'written'),
  'entry-actions-recording': r => tools(r, 'recording'),
  'entry-actions-editor': r => {
    const field = r('field', { tag: 'textarea', form: 'editor', label: 'Entry text', value: '' }, {}, { 'data-hook': 'editor-field', 'data-place': 'fill', rows: 5, required: true });
    const error = r('text', { form: 'help', text: '' }, {}, { hidden: true, role: 'alert' });
    const actions = r('cluster', {}, {
      children: r('button', { grade: 'solid', label: 'Save changes' }, {}, { type: 'submit' }) + r('button', { grade: 'quiet', label: 'Leave as it was' }),
    }, { 'data-place': 'actions' });
    return r('entry-actions', { form: 'editor' }, { children: `<label>Entry text${field}</label>${error}${actions}` }, { 'data-place': 'span', novalidate: true });
  },
  'entry-actions-confirm': r => r('entry-actions', { form: 'confirm', text: 'Delete this entry? This cannot be undone.' }, {
    children: r('button', { grade: 'quiet', label: 'Delete entry' }) + r('button', { grade: 'solid', label: 'Keep entry' }),
  }, { 'data-place': 'span', role: 'group', 'aria-label': 'Delete this entry?' }),
  'mark-out': r => r('mark', { label: 'Out of memory', glyph: 'lock' }, {}, { 'data-place': 'after' }),
};
