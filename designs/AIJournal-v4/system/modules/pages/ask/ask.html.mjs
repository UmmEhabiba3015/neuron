// ask: <Ask platform state /> in the developers' code. The page writes no markup of its own.
// v4 C2 (explore ask-readable a-mirror-bubble, as revised; the states from ask-states D and ask-cant-loading f-mix;
// DESIGN.md 2026-10-25): the masthead with the open day's date box, then the chat (the head row with the drawers'
// pills and New or Today, the thread, the composer at its foot).
// Platform rules:
//   mobile and tablet: the header section (the masthead row with the date box, the destinations), the chat below.
//   desktop: the title block (wordmark, the date box, destinations); the chat in the page's column, from its top
//     (a bare page: the chat's head row is level with the wordmark).
// States (states.mjs): today, past (read only), history, bookmarks, drawers (both open), rate (the thumbs-down
// form open), writing, empty (a new session), cant (can't answer), failed (not sent), loading (Ask opening, 18).
import data from './data.mjs';
import states from './states.mjs';
import { DESTINATIONS } from '../../../content/destinations.mjs';
import { keyDate, longDate } from '../../../content/journal-days.mjs';
import { TODAY, sessionsOf, historyDays, bookmarksOf, dayOf } from '../../../content/ask-journal.mjs';

export default function render({ platform = 'mobile', state = 'today', context = 'screen' } = {}, slots, kit) {
  const { html, use } = kit;
  const desktop = platform === 'desktop';
  const d = data, s = states[state] || {};
  // A walkthrough below desktop: the header's navbar form, the blocks in the page's reader.
  const walk = context === 'walkthrough' && !desktop;
  const date = s.date || TODAY, day = dayOf(date);
  const keybox = use('keybox', { key: d.key, value: keyDate(date), date: 'hand', place: 'tool' });
  const destinations = use('dest', { links: DESTINATIONS, current: 'ask' });
  const masthead = desktop
    ? use('mast', { form: 'title', wordmark: d.title }, { children: html`${keybox}${destinations}` })
    : use('header', { form: walk ? 'navbar' : 'static' }, { children: html`${use('mast', { form: 'row', wordmark: d.title }, { children: keybox })}${destinations}` });

  // One chat per screen, but a screen file can hold several states: the ids carry the state past the first.
  const own = base => state === 'today' ? base : `${base}-${state}`;
  const drawers = use('drawers', {
    id: own('ask-drawers'), today: TODAY, current: date, days: historyDays(), open: s.open || {},
    bookmarks: { day: `${day.today ? 'Today, ' : ''}${longDate(date)}`, items: bookmarksOf(date) },
  });
  const chat = use('chat', {
    day, state: s.chat || 'day', sessions: s.sessions || sessionsOf(date, { dayHref: () => d.links.day, searchHref: d.links.search }),
    lead: s.lead || null, composer: { value: s.value || '', fieldId: own('aj-ask') }, todayHref: day.today ? '' : d.links.today, place: 'block fill',
  }, { tools: drawers });
  // desktop: the page is bare (no lead above the chat): the chat's head row stands at the top, level with the
  // wordmark, and stays there as the thread scrolls under it (DESIGN.md 2026-10-27).
  const page = use('page', { reader: walk ? d.title : '', head: desktop ? 'bare' : 'title' }, { header: desktop ? '' : masthead, children: chat });
  return use('shell', { motion: 'arrive', layout: desktop ? 'sidebar' : 'single', attrs: s.id ? { id: s.id } : undefined }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}
