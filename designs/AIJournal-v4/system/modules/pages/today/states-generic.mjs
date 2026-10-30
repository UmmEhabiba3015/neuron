// Today's states drawn as generic state pages (18-entry-system-states): state -> { id, kind, title, blocks }
// for system/content/state-page.mjs. A block is the auth-form's data ({ type: notice | copy | actions }) or,
// where a state holds a row the auth-form can't write, a function of the page's kit returning the markup
// composed with use(). The panel kind (composer-options) also carries its panel: a function of the kit returning the panel.
import data from './data.mjs';
import { EDIT, DELETE } from '../../../content/icons.mjs';

const link = (href, label, grade = 'quiet') => ({ label, href: `00-prototype.html#${href}`, grade });
const back = (...items) => ({ type: 'actions', items });

// The 09:20 entry as these states draw it (bare time, the entry's own words), with its tools: edit and delete
// (in memory, so no memory part: memory is one way, decision 2026-10-28). Shared by the entry states; the recording's row is the same shape with the player.
const ENTRY = 'The flat people said Tuesday, and it is Sunday, so I decided not to think about it until Tuesday.';
const tools = ({ html, raw, use }, recording) => use('entry-actions', {
  kind: recording ? 'recording' : 'written', excluded: false, place: 'tools',
}, {
  children: html`${recording ? '' : use('button', { grade: 'quiet', form: 'icon', href: data.actions.edit.href, label: data.actions.edit.label, data: { 'entry-action': 'edit' } }, { icon: raw(EDIT) })}${use('button', { grade: 'quiet', form: 'icon', href: (recording ? data.actions.deleteRecording : data.actions.delete).href, label: (recording ? data.actions.deleteRecording : data.actions.delete).label, data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) })}`,
});
const entry = (text, withTools) => kit => kit.use('srow', { time: '09:20', bareTime: true }, {
  children: kit.html`${kit.use('text', { form: 'prose', text })}${withTools ? tools(kit, false) : ''}`,
});
const recording = kit => kit.use('recrow', { head: 'dated', time: '14:05', duration: '2:41', transcript: 'Voice memo' }, {
  player: kit.use('play', { label: 'Play voice memo' }),
  children: tools(kit, true),
});

export default {
  'composer-options': { id: 'composer-options', kind: 'panel', title: 'Composer options',
    blocks: [entry(ENTRY, false)],
    panel: ({ html, use }) => use('panel', { title: 'Composer options', place: 'aside' }, {
      children: html`${use('srowlink', { label: 'If you want to talk to someone', why: 'A support resource is available whenever you need it.', value: 'Read', href: '00-prototype.html#support-resource' })}${use('cluster', { place: 'actions' }, { children: use('button', { grade: 'quiet', href: '00-prototype.html#today', label: 'Back to Today' }) })}`,
    }) },
  'support-resource': { id: 'support-resource', kind: 'journal', title: 'If you want to talk to someone', blocks: [
    { type: 'copy', text: 'In the UK or Ireland, Samaritans are available all night, every night, on 116 123. There is no charge for the call, and you do not need to give your name. Elsewhere, use a local support line.' },
    back(link('composer-options', 'Back to options'), link('settings-privacy', 'Back to settings')),
  ] },
  'entry-options': { id: 'entry-options', kind: 'journal', title: 'Entry', blocks: [entry(ENTRY, true)] },
  'recording-options': { id: 'recording-options', kind: 'journal', title: 'Voice memo', blocks: [recording] },
  'entry-memory': { id: 'entry-memory', kind: 'journal', title: 'Out of memory', blocks: [
    { type: 'notice', text: 'This entry is out of memory. It stays in your journal and cannot be read or cited by the model. Using it in memory later cannot be undone.' },
    back(link('entry-memory-return', 'Use in memory', 'solid'), link('entry-options', 'Back to entry')),
  ] },
  'entry-memory-return': { id: 'entry-memory-return', kind: 'journal', title: 'In memory', blocks: [
    { type: 'notice', text: 'This entry is in memory now: the model can read and cite it. Once in, it cannot be taken out.' },
    back(link('entry-options', 'Back to entry', 'solid')),
  ] },
  'recording-memory': { id: 'recording-memory', kind: 'journal', title: 'Out of memory', blocks: [
    { type: 'notice', text: 'This recording stays in your journal but is out of memory. Using it in memory later cannot be undone.' },
    back(link('recording-memory-return', 'Use in memory', 'solid'), link('recording-options', 'Back to recording')),
  ] },
  'recording-memory-return': { id: 'recording-memory-return', kind: 'journal', title: 'In memory', blocks: [
    { type: 'notice', text: 'This recording goes into memory once it is transcribed. Once in, it cannot be taken out.' },
    back(link('recording-options', 'Back to recording', 'solid')),
  ] },
  'entry-saved': { id: 'entry-saved', kind: 'journal', title: 'Entry', blocks: [entry(`${ENTRY} I read the email again.`, true)] },
  'entry-deleted': { id: 'entry-deleted', kind: 'journal', title: 'Entry deleted', blocks: [{ type: 'copy', text: 'The entry is gone from your journal.' }, { type: 'actions', items: [{ label: 'Back to Today', href: '00-prototype.html#today', grade: 'solid' }] }] },
  'recording-deleted': { id: 'recording-deleted', kind: 'journal', title: 'Recording deleted', blocks: [{ type: 'copy', text: 'The recording is gone from your journal.' }, { type: 'actions', items: [{ label: 'Back to Today', href: '00-prototype.html#today', grade: 'solid' }] }] },
};
