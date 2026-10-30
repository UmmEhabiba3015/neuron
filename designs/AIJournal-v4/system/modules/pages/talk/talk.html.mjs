// talk: <Talk platform state /> in the developers' code. The page writes no markup of its own: it
// composes the shell and either the recorder section (ready, and the three microphone reference states)
// or the kept recording (kept, transcribing) from their modules. Platform rule: for the kept recording
// desktop puts the back link in the title block beside the page (mast form title, shell sidebar, page
// headed untitled); mobile and tablet carry the masthead row, with the back link, inside the page.
// The kept recording's waveform is the wave's own (the memo's phrase at a fixed pitch). The recorder's trace is the
// same phrase: flat before a memo starts, the shape once one is under way.
import data from './data.mjs';
import { traceBars } from '../../../content/wave-shape.mjs';
import { statePage } from '../../../content/state-page.mjs';
import { DELETE } from '../../../content/icons.mjs';

export default function render({ platform = 'mobile', state = 'ready', context = 'screen' } = {}, slots, kit) {
  const { html, raw, use } = kit;
  const desktop = platform === 'desktop';
  const d = data;
  const rail = use('rail');

  // The kept notice (16-flow-states) is a generic state page: its data is the state.
  if (state === 'kept-notice') return statePage(d['kept-notice'], platform, kit, context);

  // The recorder section: the compact transport, in the shell without a page around it. The flow pack's
  // states carry their route's id on the shell.
  const r = d.recorder[state];
  if (r) {
    return use('shell', { motion: 'arrive', layout: 'single', attrs: r.id ? { id: r.id } : undefined }, {
      children: html`${rail}${use('recorder', { phase: r.phase || 'ready', state: r.state, clock: r.clock, length: r.length, seconds: r.seconds, draft: r.draft, confirm: r.confirm, back: '00-prototype.html#today', place: 'main' }, { trace: raw(traceBars(!!r.phase)) })}`,
    });
  }

  // The kept recording's row: play, its drawing for this platform, the duration, and its tools.
  const k = d.kept;
  const recording = use('recrow', { head: 'dated', time: k.recording.time, datetime: k.recording.datetime, duration: k.recording.duration, transcript: k.recording.text, place: 'fill' }, {
    player: html`${use('play', { label: k.recording.play })}${use('wave')}`,
    children: use('entry-actions', { kind: 'recording', excluded: false, place: 'tools' }, {
      children: use('button', { grade: 'quiet', form: 'icon', href: k.delete.href, label: k.delete.label, data: { 'entry-action': 'delete' } }, { icon: raw(DELETE) }),
    }),
  });
  const back = use('back', { label: d.back.label, href: d.back.href, place: 'line' });
  const masthead = use('mast', { form: desktop ? 'title' : 'row', place: desktop ? undefined : 'head' }, { back });
  // Kept ends with the way back, in the stack's row; transcribing ends with its notice.
  const transcribing = state === 'transcribing';
  const notice = transcribing ? use('notice', { text: d.transcribing, place: 'block' }) : '';
  const row = transcribing ? '' : use('button', { grade: 'keyline', href: k.backToday.href, label: k.backToday.label });
  const stack = use('stack', { place: 'main' }, { children: html`${use('keybox', { key: k.date.key, value: k.date.value, date: 'printed', valueTag: 'h1' })}${recording}${notice}`, row: row });
  const page = use('page', { head: desktop ? 'untitled' : 'title' }, { children: desktop ? stack : html`${masthead}${stack}` });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single' }, {
    children: html`${rail}${desktop ? masthead : ''}${page}`,
  });
}
