// settings: <Settings platform state /> in the developers' code. The page writes no markup of its own:
// it composes the shell, the masthead and the record from their modules. The platform rule: desktop puts
// the masthead in the title block beside the page (mast form title, shell sidebar, page headed pushed);
// mobile and tablet carry the masthead row inside the page. The state chooses the title, the sections of
// rows and the foot or notice (privacy, visible, data); the two a states pack shows are clipped.
// The account and data states (17-account-data): the account ones (devices, timezone-failed, …) are generic
// state pages (system/content/state-page.mjs); the contextual ones (delete-confirm, export-*, …) are the
// data page with a dialog after the record or a state message in it, from data.mjs.
import data, { contextual, accountStates } from './data.mjs';
import { statePage } from '../../../content/state-page.mjs';
import { skeletonSheet } from '../../../content/skeleton.mjs';

export default function render({ platform = 'mobile', state = 'privacy', context = 'screen' } = {}, slots, kit) {
  const { html, use } = kit;
  const desktop = platform === 'desktop';
  const d = data;
  const buttons = items => items.map(a => use('button', { grade: a.grade, href: a.href, label: a.label }));
  if (accountStates[state]) {
    const a = accountStates[state];
    const blocks = a.blocks.map(b => b.type === 'row' ? use('srowlink', { label: b.label, why: b.why, value: b.value, href: b.href, place: 'row' })
      : b.type === 'shead' ? use('shead', { text: b.text, level: 3, place: 'head' })
      : b);
    return statePage({ ...a, blocks }, platform, kit, context);
  }
  const c = contextual[state];
  const s = d.states[c ? c.base : state] || d.states.privacy;
  const masthead = use('mast', { form: desktop ? 'title' : 'row', wordmark: s.title, place: desktop ? undefined : 'head' }, {
    back: use('back', { label: d.back.label, href: d.back.href, place: 'line' }),
  });
  const row = r => c?.skeleton ? use('srowlink', { label: r.label, why: use('bone', { width: '80%' }), value: r.value ? use('bone', { width: '32px' }) : '' })
    : use('srowlink', { label: r.label, why: r.why, value: r.counted && c?.count ? c.count : r.value, href: r.href });
  const sections = s.sections.map(sec => html`${sec.heading ? use('shead', { text: sec.heading }) : ''}${sec.rows.map(row)}`);
  const message = !c?.message ? '' : use('state-message', { place: 'span' }, {
    children: html`${c.message.notice ? use('notice', { text: c.message.notice, announce: true, place: 'block' }) : use('text', { form: 'copy', chars: 0, text: c.message.copy, place: 'copy' })}${use('cluster', { place: 'actions' }, { children: html`${buttons(c.message.actions)}` })}`,
  });
  const record = c?.skeleton ? skeletonSheet(kit, c.skeleton, sections) : use('sheet', { place: 'block record' }, { children: html`${sections}${message}` });
  const after = s.notice ? use('notice', { text: s.notice, place: 'block' }) : s.foot ? use('foot', { text: s.foot }) : '';
  const dialog = !c?.dialog ? '' : use('dialog', { labelledBy: c.dialog.titleId }, {
    children: use('card', { title: c.dialog.title, titleId: c.dialog.titleId, paragraphs: c.dialog.paragraphs, place: 'block' }, { actions: html`${buttons(c.dialog.actions)}` }),
  });
  const body = html`${record}${after}${dialog}`;
  const page = use('page', { head: desktop ? 'pushed' : 'title' }, { children: desktop ? body : html`${masthead}${body}` });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', clip: s.clip, attrs: c ? { id: c.id } : undefined }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}
