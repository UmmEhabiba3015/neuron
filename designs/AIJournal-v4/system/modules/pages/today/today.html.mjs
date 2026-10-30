// today: <Today platform state /> in the developers' code. The page writes no markup of its own: it
// composes the shell, the masthead and destinations, the day's record and the writing companion from
// their modules. Platform rules: desktop puts the masthead and the destinations in the title block
// beside the page (mast form title, shell sidebar); mobile and tablet carry them in the header section
// inside the page. A recording's waveform is the wave's own (the memo's phrase at a fixed pitch, v4 round 10).
import data from './data.mjs';
import { EDIT, DELETE } from '../../../content/icons.mjs';
import generic from './states-generic.mjs';
import { statePage } from '../../../content/state-page.mjs';
import { stateSheet } from '../../../content/state-sheet.mjs';
import { skeletonSheet, written, memo, note, mood } from '../../../content/skeleton.mjs';
import views, { excerpt } from './views.mjs';

export default function render({ platform = 'mobile', state = 'default', context = 'screen' } = {}, slots, kit) {
  // A state drawn as a generic state page (16, 18: options, memory, entry saved…): its data, the shared page.
  if (generic[state]) return statePage(generic[state], platform, kit, context);
  const { html, raw, use } = kit;
  // 11-states' views: clipped crops of today (a heading, a row or two, the composer).
  if (views[state]) return view(views[state], platform, kit, context);
  const desktop = platform === 'desktop';
  // A walkthrough below desktop: the header's navbar form, the blocks in the page's reader.
  const walk = context === 'walkthrough' && !desktop;
  const d = data;
  const masthead = mastheadOf(desktop, kit, walk);

  // An entry's tools: edit (written only), delete, and, if it is kept out of memory, its memory tag.
  const tools = (entry, recording) => use('entry-actions', {
    kind: recording ? 'recording' : 'written', excluded: entry.excluded,
    place: 'tools',
  }, {
    children: html`${recording ? '' : use('button', { grade: 'quiet', form: 'icon', href: d.actions.edit.href, label: d.actions.edit.label, data: { 'entry-action': 'edit' } }, { icon: raw(EDIT) })}${use('button', { grade: 'quiet', form: 'icon', href: (recording ? d.actions.deleteRecording : d.actions.delete).href, label: (recording ? d.actions.deleteRecording : d.actions.delete).label, data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) })}`,
  });
  // A contextual state (18): the first entry or the recording changed. A confirmation takes the place of the
  // tools; the editor takes the place of the entry's words.
  const s = d.states[state] || {};
  const confirm = c => use('entry-actions', { form: 'confirm', text: c.text, place: 'span' }, {
    children: html`${use('button', { grade: 'quiet', href: c.delete.href, label: c.delete.label })}${use('button', { grade: 'solid', href: c.keep.href, label: c.keep.label })}`,
  });
  const editor = e => {
    const x = d.editor;
    const field = use('field', { tag: 'textarea', form: 'editor', value: e.text, place: 'fill', attrs: { 'aria-label': false, id: x.id, rows: 5, required: true, 'aria-invalid': e.empty ? 'true' : false, 'aria-describedby': e.empty ? x.errorId : false } });
    const actions = use('cluster', { place: 'actions' }, {
      children: html`${use('button', { grade: 'solid', label: x.save, attrs: { type: 'submit' } })}${use('button', { grade: 'quiet', href: x.leave.href, label: x.leave.label })}${e.empty ? use('button', { grade: 'quiet', href: x.remove.href, label: x.remove.label }) : ''}`,
    });
    return use('entry-actions', { form: 'editor', place: 'span', label: x.label, fieldId: x.id }, {
      field,
      children: html`${e.empty ? use('text', { form: 'help', text: e.empty, attrs: { id: x.errorId, role: 'alert' } }) : ''}${e.failed ? use('state-message', { tag: 'line', text: e.failed, place: 'span' }) : ''}${actions}`,
    });
  };
  let seenWritten = false; let seenRecording = false;
  const record = d.record.map((item, i) => {
    // Without models: the day as written, no product notes (and no overview: the composer below).
    if (item.kind === 'note' && s.withoutModels) return '';
    if (item.kind === 'note') return use('said', { label: d.noteLabel, note: item.text }, {
      foot: html`${use('button', { grade: 'cite', href: item.cite.href, label: item.cite.label })}${use('thumbs', { id: `note-${i}`, form: 'pair' })}`,
    });
    if (item.kind === 'recording') {
      const mine = !seenRecording && s.recording; seenRecording = true;
      return use('recrow', { head: 'dated', time: item.time, datetime: item.datetime, duration: item.duration, transcript: s.withoutModels ? d.untranscribed : item.text, transcriptForm: s.withoutModels ? 'label' : 'prose' }, {
        player: html`${use('play', { label: item.play })}${use('wave')}`,
        children: mine ? confirm(s.recording.confirm) : tools(item, true),
      });
    }
    const mine = !seenWritten && s.entry; seenWritten = true;
    if (mine && s.entry.editor) return use('srow', { time: item.time, datetime: item.datetime }, { children: editor(s.entry.editor) });
    if (mine) return use('srow', { time: item.time, datetime: item.datetime }, { children: html`${use('text', { form: 'prose', text: item.text })}${confirm(s.entry.confirm)}` });
    return use('srow', { time: item.time, datetime: item.datetime }, {
      children: html`${use('text', { form: 'prose', text: item.text })}${tools(item, false)}${item.mark ? use('mark', { label: item.mark }) : ''}`,
    });
  });
  // v4 C5: an entry and a voice memo that haven't uploaded, at the end of the day (the time Save or Stop and keep was
  // pressed), drawn as any row with their tools, and the pending line under them. The memo is untranscribed.
  if (s.unsent) {
    const u = d.unsent;
    const line = () => use('pending', { sub: s.unsent, text: u[s.unsent], action: u.retry, place: 'span' });
    record.push(use('srow', { time: u.entry.time, datetime: u.entry.datetime }, { children: html`${use('text', { form: 'prose', text: u.entry.text })}${tools({}, false)}${line()}` }));
    record.push(use('recrow', { head: 'dated', time: u.recording.time, datetime: u.recording.datetime, duration: u.recording.duration, transcript: d.untranscribed, transcriptForm: 'label' }, {
      player: html`${use('play', { label: u.recording.play })}${use('wave')}`,
      children: html`${tools({}, true)}${line()}`,
    }));
  }
  const sheet = use('sheet', { place: 'block record' }, { children: html`${record}${use('moodrow', { form: 'ruled', label: d.mood, selected: s.mood?.selected || 'none' }, { after: s.mood?.failed ? use('state-message', { tag: 'line', text: s.mood.failed, place: 'span' }) : '' })}` });

  // Loading (v4 round 10): the day's skeleton in the real sheet, its rows in the record's order; the composer stays
  // usable (writing needn't wait), its overview line a bone.
  const skeleton = s.skeleton ? skeletonSheet(kit, s.skeleton, [written(kit, [1, 0.55]), note(kit, d.noteLabel), memo(kit, [1, 0.7]), note(kit, d.noteLabel), written(kit, [0.75]), mood(kit)]) : '';

  const c = d.composer;
  const composer = use('composer', { form: 'companion', placeholder: c.placeholder, place: 'foot' }, {
    overview: s.withoutModels ? '' : s.skeleton ? use('bone', { width: '260px', place: 'head' }) : use('overview', { ...d.overview, place: 'head' }),
    tools: html`${use('opt', { label: c.keepOut, place: 'option' })}${use('button', { grade: 'quiet', href: c.more.href, label: c.more.label, place: 'fixed' })}`,
  });

  // A state message in place of the record (fetch-failed): no composer.
  const page = use('page', { reader: walk ? d.wordmark : '' }, { header: desktop ? '' : masthead, children: s.message ? stateSheet(s.message, kit) : skeleton || sheet, foot: s.message ? '' : composer });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', attrs: state === 'default' ? undefined : { id: s.route || state } }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}

// A view (11-states): a clipped shell; the header section when the view has one; a heading and its rows, or the
// empty line; the plain composer (filled: the words typed and Save in place of the mic).
function view(v, platform, kit, context) {
  const { html, raw, use } = kit;
  const d = data;
  const desktop = platform === 'desktop';
  const walk = context === 'walkthrough' && !desktop && !!v.header;
  const header = v.header ? mastheadOf(desktop, kit, walk, v.day) : '';
  const first = d.record.find(i => i.kind === 'written'), rec = d.record.find(i => i.kind === 'recording'), note = d.record.find(i => i.kind === 'note');
  const rows = [];
  if (v.entry) rows.push(use('srow', { time: first.time, datetime: first.datetime }, { children: use('text', { form: 'prose', text: excerpt }) }));
  if (v.recording) rows.push(use('recrow', { head: 'dated', time: rec.time, datetime: rec.datetime, duration: rec.duration, transcript: v.recording }, {
    player: html`${use('play', { label: rec.play })}${use('wave')}`,
    children: use('entry-actions', { kind: 'recording', excluded: false, place: 'tools' }, { children: use('button', { grade: 'quiet', form: 'icon', href: d.actions.deleteRecording.href, label: d.actions.deleteRecording.label, data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) }) }),
  }));
  if (v.note) rows.push(use('said', { label: d.noteLabel, note: note.text, expanded: true }, { foot: html`${use('button', { grade: 'cite', href: note.cite.href, label: note.cite.label })}${use('thumbs', { id: 'note-view', form: 'pair' })}` }));
  for (const day of v.days || []) rows.push(use('dayrow', { date: day.date, datetime: day.datetime }, { children: use('text', { form: 'lede', text: day.text }) }));
  const sheet = v.heading ? use('sheet', { place: 'block record' }, { children: html`${use('shead', { text: v.heading })}${rows}` }) : '';
  const c = d.composer;
  // A view with an overview (Empty Today, the first day) takes the companion form, as Today does (v4 C4).
  const overview = v.overview ? use('overview', { ...(v.overview === 'first' ? d.overviewFirst : d.overview), place: 'head' }) : '';
  const composer = v.composer ? use('composer', { form: overview ? 'companion' : 'plain', placeholder: c.placeholder, filled: !!v.composer.typed, place: 'foot' }, {
    overview,
    row: v.composer.typed ? html`${use('field', { tag: 'div', value: v.composer.typed, hook: 'input' })}${use('send', { aria: false })}` : '',
    // v4 C5: the voice memo draft line under the field, with or without words in it.
    draft: v.memoDraft ? use('pending', d.memoDraft) : '',
    tools: html`${use('opt', { label: c.keepOut, place: 'option' })}${use('button', { grade: 'quiet', href: c.more.href, label: c.more.label, place: 'fixed' })}`,
  }) : '';
  // Desktop's views without the masthead start bare (no title block above the page).
  const page = use('page', { head: desktop && !v.header ? 'bare' : 'title', reader: walk ? d.wordmark : '' }, { header: desktop ? '' : header, children: html`${v.empty ? use('empty', { text: v.empty }) : ''}${sheet}`, foot: composer });
  // Desktop: the views with the header keep the sidebar layout, the masthead in its title block.
  return use('shell', { motion: 'arrive', clip: true, layout: v.header && desktop ? 'sidebar' : undefined }, { children: html`${use('rail')}${desktop ? header : ''}${page}` });
}

// The masthead: desktop's title block (wordmark, day, destinations); elsewhere the header section, in its
// navbar form on a walkthrough.
function mastheadOf(desktop, { html, use }, walk = false, day = data.day.value) {
  const d = data;
  const keybox = use('keybox', { key: d.day.key, value: day, date: 'hand', place: 'tool' });
  const destinations = use('dest', { links: d.destinations, current: 'today' });
  return desktop
    ? use('mast', { form: 'title', wordmark: d.wordmark }, { children: html`${keybox}${destinations}` })
    : use('header', { form: walk ? 'navbar' : 'static' }, { children: html`${use('mast', { form: 'row', wordmark: d.wordmark }, { children: keybox })}${destinations}` });
}
