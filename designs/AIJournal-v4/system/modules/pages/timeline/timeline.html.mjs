// timeline: <Timeline platform state /> in the developers' code. The page writes no markup of its own.
// v4 C1 (explore timeline-jump-arrival f-wash-and-frame; DESIGN.md 2026-10-23): the masthead with the day's date
// box on every platform; the date and mood card (daycard), the search (find, pill form) and the list (record).
// Platform rules:
//   mobile and tablet: the header section (the masthead row with the date box, the destinations); the card above
//     the search, the search above the list.
//   desktop: the title block (wordmark, the date box, destinations); the page is split: the search and the list in
//     the record's column, the card the sticky column right of it (aside column).
// States: the card's (mood, calendar, mood-one-day, mood-empty-week), the search's (found, no-matches, searching,
// search-failed), and the old design's (earlier, end, thin-week, loading). The arrival is the live jump's only
// (the record's own catalogue shows it): a rendered jump would scroll whatever hosts the page. Data in data.mjs and states.mjs.
import data from './data.mjs';
import states from './states.mjs';
import { stateSheet } from '../../../content/state-sheet.mjs';
import { skeletonSheet, day as dayBone, memo, LINES } from '../../../content/skeleton.mjs';
import { DESTINATIONS } from '../../../content/destinations.mjs';
import { weeksOf, monthsOf, keyDate, longDate } from '../../../content/journal-days.mjs';

export default function render({ platform = 'mobile', state = 'list', context = 'screen' } = {}, slots, kit) {
  const { html, use } = kit;
  const desktop = platform === 'desktop';
  const d = data;
  const s = states[state] || {};
  // A walkthrough below desktop: the header's navbar form, the blocks in the page's reader.
  const walk = context === 'walkthrough' && !desktop;
  const keybox = use('keybox', { key: d.day.key, value: d.day.value, date: 'hand', place: 'tool' });
  const destinations = use('dest', { links: DESTINATIONS, current: 'timeline' });
  const masthead = desktop
    ? use('mast', { form: 'title', wordmark: d.title }, { children: html`${keybox}${destinations}` })
    : use('header', { form: walk ? 'navbar' : 'static' }, { children: html`${use('mast', { form: 'row', wordmark: d.title }, { children: keybox })}${destinations}` });

  // The journal a state shows: its days and their moods (the card), and its rows (the list).
  const moods = s.moods || d.moods;
  const written = Object.entries(moods).map(([date, mood]) => ({ date, mood }));
  const day = s.day || d.today;
  const card = use('daycard', {
    day, date: keyDate(day), dateName: longDate(day), weeks: weeksOf(written, d.today), shown: s.shown || '',
    calendar: { months: monthsOf(written, d.today, day), selected: day.slice(0, 7) }, open: s.open || {},
    place: desktop ? 'aside column' : 'block',
  });
  const q = s.search || {};
  // On a numbered comp below desktop the page scrolls under the pinned header and no script can measure it, so the
  // pill stays in the flow (find's flow). In the reader (walkthroughs, the website) and on desktop it sticks.
  const search = use('find', { form: 'pill', query: q.query || '', mode: q.mode || 'keyword', status: q.status || 'idle', found: q.found || '', flow: !desktop && !walk, place: 'block' });
  // loading (v4 round 10): the list's skeleton (days and a memo, as the list draws them), the line announced; no foot.
  const list = s.skeleton
    ? skeletonSheet(kit, s.skeleton, [dayBone(kit, LINES[0]), dayBone(kit, LINES[2]), memo(kit, LINES[3]), dayBone(kit, LINES[1]), dayBone(kit, LINES[0])])
    : s.message
    ? stateSheet(s.message, kit)
    : use('record', { items: s.items || d.items, moods, marks: q.marks || [], message: q.none || null, place: 'block record' });
  const body = html`${card}${search}${list}${s.message || s.skeleton ? '' : use('foot', { text: s.foot || d.since })}`;
  const page = use('page', { layout: desktop ? 'split' : 'single', reader: walk ? d.title : '' }, { header: desktop ? '' : masthead, children: body });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', clip: !!s.clip, attrs: s.id ? { id: s.id } : undefined }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}
