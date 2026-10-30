// you: <You platform state /> in the developers' code. The settings page: rows in groups, each a link to
// its own screen. The page writes no markup of its own: it composes the shell, the masthead and the
// destinations, the sheet of settings rows and the foot from their modules. Platform rule: desktop puts
// the masthead and the destinations in the title block beside the page (mast form title, shell
// sidebar); mobile and tablet carry them in the header section inside the page.
import data from './data.mjs';
import { skeletonSheet } from '../../../content/skeleton.mjs';
// loading (18; v4 round 10 a skeleton; fixes 5): the labels and headings real, the keeping date (printed: no hand to
// sweep in) and each row's line and value bones (as What it sees), no row a link yet; the line announced, no foot;
// the shell carries the route.
const states = { loading: { id: 'you-loading', skeleton: 'Loading your settings.' } };

export default function render({ platform = 'mobile', state = 'default', context = 'screen' } = {}, slots, kit) {
  const { html, use } = kit;
  const st = states[state];
  const desktop = platform === 'desktop';
  // A walkthrough below desktop: the header's navbar form, the blocks in the page's reader.
  const walk = context === 'walkthrough' && !desktop;
  const d = data;
  const keybox = use('keybox', { key: d.since.key, value: st ? use('bone', { width: '120px' }) : d.since.value, date: st ? 'printed' : 'hand', place: 'tool' });
  const destinations = use('dest', { links: d.destinations, current: 'you' });
  const masthead = desktop
    ? use('mast', { form: 'title', wordmark: d.wordmark }, { children: html`${keybox}${destinations}` })
    : use('header', { form: walk ? 'navbar' : 'static' }, { children: html`${use('mast', { form: 'row', wordmark: d.wordmark }, { children: keybox })}${destinations}` });

  const row = r => st ? use('srowlink', { label: r.label, why: use('bone', { width: '80%' }), value: use('bone', { width: '72px' }) }) : use('srowlink', r);
  const groups = d.groups.flatMap(g => [use('shead', { text: g.heading }), ...g.rows.map(row)]);
  const sheet = st ? skeletonSheet(kit, st.skeleton, groups) : use('sheet', { place: 'block record' }, { children: html`${groups}` });

  const page = use('page', { reader: walk ? d.wordmark : '' }, { header: desktop ? '' : masthead, children: st ? sheet : html`${sheet}${use('foot', { text: d.foot })}` });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', attrs: st ? { id: st.id } : undefined }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}
