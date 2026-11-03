// reflection: <Reflections platform state /> in the developers' code (v4 C3). The page writes no markup of
// its own: it composes the shell, the masthead, the week's booklet and Earlier weeks from their modules. States:
//   list: a destination (current reflections). The newest week's booklet (the week, a leaf per note, the signed
//     leaf), then Earlier weeks on a line by month, each week opening its booklet. The static screen opens on
//     leaf 1 (leaves 1 and 2 at the container's 1200).
//   week: an earlier week on a pushed page (back to Reflections, its date box "Week"): its booklet, then the
//     weeks before it.
//   first: the first week: its booklet without the trend, a Next week leaf before the signed one; no earlier weeks.
//   empty: a new account before its first week ends: the week so far, one leaf, nothing to turn.
//   rated: list, with a note's thumbs down pressed (What came up: its form open, as the script leaves it); the
//     booklet opens on its leaf.
// A note's foot is "N entries", which opens Timeline on those days (data-days, for the walkthroughs' coordinator,
// scripts/journal-reflection.js), and its thumbs (Ask's mechanic). The trend's source is Earlier weeks.
// Platform rules: desktop puts the masthead in the title block beside the page (mast form title, shell
// sidebar); the destination's title block carries the day's keybox and the destinations, as Timeline's.
// Mobile and tablet: the header section (on a walkthrough, its navbar form and the blocks in the page's
// reader); the week's masthead row is inside its page.
import data from './data.mjs';
import { DESTINATIONS } from '../../../content/destinations.mjs';
import { leaves as leafBones, weeks as weekBones } from '../../../content/skeleton.mjs';

export default function render({ platform = 'mobile', state = 'list', context = 'screen' } = {}, slots, kit) {
  const { html, use } = kit;
  const desktop = platform === 'desktop';
  const walk = context === 'walkthrough' && !desktop;
  const d = data;
  const shell = (title, page, id) => use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', attrs: id ? { id } : undefined }, { children: html`${use('rail')}${desktop ? title : ''}${page}` });

  // A note's foot: its source and its thumbs; rated, the thumbs-down form drawn open.
  const foot = (source, id, asking) => html`${use('button', { grade: 'cite', href: source.href, label: source.label, data: source.days ? { days: source.days.join(' ') } : {} })}${use('thumbs', { id: `note-${id}`, form: 'pair', asking })}`;
  const leaf = ({ picture, source, ...props }, asking = false) => ({
    ...props,
    picture: picture ? use('leafpic', { ...picture, place: 'pic' }) : '',
    foot: source ? foot(source, props.id, asking) : '',
  });
  const booklet = (week, { trend = true, next = false, back = true, rated = '' } = {}) => {
    const leaves = week.leaves.filter(l => trend || l.id !== 'trend').map(l => leaf(l, l.id === rated));
    if (next) leaves.push(leaf(d.next));
    leaves.push(back ? d.end : { form: 'end' });
    const at = Math.max(0, leaves.findIndex(l => rated && l.id === rated));
    return use('booklet', { id: 'booklet', label: week.label, leaves, at, place: 'block' });
  };
  const earlier = weeks => use('weekline', { ...d.earlier, weeks, place: 'block' });

  if (state === 'week') {
    const masthead = use('mast', { form: desktop ? 'title' : 'row', wordmark: 'Reflection', place: desktop ? undefined : 'head' }, {
      back: use('back', { label: d.back.label, href: d.back.href, place: 'line' }),
      children: use('keybox', { key: d.previous.key, value: d.previous.dates, date: 'hand', place: 'tool' }),
    });
    const body = html`${booklet(d.previous)}${earlier(d.earlier.weeks.slice(1))}`;
    return shell(masthead, use('page', { head: desktop ? 'pushed' : 'title' }, { children: desktop ? body : html`${masthead}${body}` }));
  }

  const day = state === 'empty' ? d.soFarDay : d.day;
  const destinations = use('dest', { links: DESTINATIONS, current: 'reflections' });
  const masthead = desktop
    ? use('mast', { form: 'title', wordmark: d.title }, { children: html`${use('keybox', { key: day.key, value: day.value, date: 'hand', place: 'tool' })}${destinations}` })
    : use('header', { form: walk ? 'navbar' : 'static' }, { children: html`${use('mast', { form: 'row', wordmark: d.title })}${destinations}` });
  // loading (v4 round 10; fixes 5): the latest week's booklet leaf for leaf in bones (its forms, pictures and feet, the
  // end leaf real), and the earlier weeks in bones, inside their real paper and spine; the line announced.
  if (state === 'loading') {
    const body = html`${use('booklet', { id: 'booklet', label: d.latest.label, leaves: leafBones(kit, [...d.latest.leaves, d.end]), place: 'block' })}${use('weekline', { ...d.earlier, since: '', weeks: weekBones(kit), place: 'block' })}${use('bone', { form: 'status', text: d.loading })}`;
    return shell(masthead, use('page', { reader: walk ? d.title : '' }, { header: desktop ? '' : masthead, children: body }), 'reflections-loading');
  }
  const body = state === 'empty'
    ? use('booklet', { id: 'booklet', label: d.soFar.label, leaves: [leaf(d.soFar.leaf)], place: 'block' })
    : state === 'first'
      ? booklet(d.latest, { trend: false, next: true, back: false })
      : html`${booklet(d.latest, { rated: state === 'rated' ? d.rated : '' })}${earlier(d.earlier.weeks)}`;
  return shell(masthead, use('page', { reader: walk ? d.title : '' }, { header: desktop ? '' : masthead, children: body }));
}
