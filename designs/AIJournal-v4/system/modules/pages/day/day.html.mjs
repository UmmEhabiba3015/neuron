// day: <Day platform state /> in the developers' code. A past day's record, composed as Today's sheet is:
// the same entry rows, tools and notes, then the mood, with no composer. The page writes no markup of
// its own. Platform rule: desktop puts the masthead (back to Timeline, the day's keybox) in the title
// block beside the page (mast form title, shell sidebar, page headed untitled); mobile and tablet carry
// the masthead row inside the page.
import data from './data.mjs';
import generic from './states-generic.mjs';
import states from './states.mjs';
import { statePage } from '../../../content/state-page.mjs';
import { EDIT, DELETE } from '../../../content/icons.mjs';
import { skeletonSheet, written, note, mood, LINES } from '../../../content/skeleton.mjs';
// without-note shows Today's recording: its data and drawings are Today's (read, not copied).
import today from '../today/data.mjs';

// States: default; fetch-failed (the page with its sheet holding a state message: states.mjs); last-deleted (a
// generic state page: states-generic.mjs).
export default function render({ platform = 'mobile', state = 'default', context = 'screen' } = {}, slots, kit) {
  if (generic[state]) return statePage(generic[state], platform, kit, context);
  const { html, raw, use } = kit;
  const st = states[state] || {};
  const failed = st.notice || st.line ? st : null;
  const desktop = platform === 'desktop';
  const d = data;
  const masthead = use('mast', { form: desktop ? 'title' : 'row', place: desktop ? undefined : 'head' }, {
    back: use('back', { label: d.back.label, href: d.back.href, place: 'line' }),
    children: use('keybox', { key: d.day.key, value: d.day.value, date: 'hand', valueTag: 'h1', place: 'tool' }),
  });

  // An entry's tools: edit, delete and, if it is kept out of memory, its memory tag.
  const tools = entry => use('entry-actions', {
    kind: 'written', excluded: entry.excluded, place: 'tools',
  }, {
    children: html`${use('button', { grade: 'quiet', form: 'icon', href: d.actions.edit.href, label: d.actions.edit.label, data: { 'entry-action': 'edit' } }, { icon: raw(EDIT) })}${use('button', { grade: 'quiet', form: 'icon', href: d.actions.delete.href, label: d.actions.delete.label, data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) })}`,
  });
  // without-note: Today's recording first, as its label (no transcript yet), with its tools.
  const memo = st.withoutModels ? (() => {
    const r = today.record.find(i => i.kind === 'recording');
    return use('recrow', { head: 'dated', time: r.time, datetime: r.datetime, duration: r.duration, transcript: today.untranscribed, transcriptForm: 'label' }, {
      player: html`${use('play', { label: r.play })}${use('wave')}`,
      children: use('entry-actions', { kind: 'recording', excluded: false, place: 'tools' }, { children: use('button', { grade: 'quiet', form: 'icon', href: today.actions.deleteRecording.href, label: today.actions.deleteRecording.label, data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) }) }),
    });
  })() : '';
  const record = d.record.map((item, i) => {
    if (item.kind === 'note' && st.withoutModels) return '';
    if (item.kind === 'note') return use('said', { label: item.label, ariaLabel: item.aria, note: item.text, open: true }, {
      foot: item.cite ? html`${use('button', { grade: 'cite', href: item.cite.href, label: item.cite.label })}${use('thumbs', { id: `note-${i}`, form: 'pair' })}` : '',
    });
    return use('srow', { time: item.time, datetime: item.datetime }, {
      children: html`${use('text', { form: 'prose', text: item.text })}${tools(item)}`,
    });
  });
  const message = failed?.line ? use('state-message', { place: 'span' }, { children: use('state-message', { tag: 'line', text: failed.line, place: 'span help' }) }) : failed ? use('state-message', { place: 'span' }, {
    children: html`${use('notice', { text: failed.notice, announce: true, place: 'block' })}${use('cluster', { place: 'actions' }, { children: use('button', { grade: failed.retry.grade, href: failed.retry.href, label: failed.retry.label }) })}`,
  }) : '';
  const sheet = use('sheet', { place: 'block record' }, { children: failed ? message : html`${memo}${record}${use('moodrow', { form: 'ruled', label: d.mood.label, selected: d.mood.selected })}` });
  // loading (v4 round 10): the skeleton in the sheet's place, the rows in the record's order (open notes as drawn).
  let n = 0;
  const skeleton = st.skeleton ? skeletonSheet(kit, st.skeleton, [...d.record.map(item => item.kind === 'note' ? note(kit, item.label, { open: true, ariaLabel: item.aria }) : written(kit, LINES[n++ % LINES.length])), mood(kit)]) : '';
  const body = skeleton || (failed ? sheet : html`${sheet}${use('foot', { text: d.foot })}`);

  const page = use('page', { head: desktop ? 'untitled' : 'title' }, { children: desktop ? body : html`${masthead}${body}` });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', attrs: st.id ? { id: st.id } : undefined }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}
