// The generic state page (pages round 4b), shared by the pages whose states are drawn as one (16, 17, 18):
// the masthead by kind (journal: Journal, current Today; account: You, current You), a printed keybox, the
// destinations, on the account surface (the panel kind: a plain sheet and a panel); the body is the auth-form section's blocks in an account sheet.
// Mobile and tablet: the header section in the page (on a walkthrough, its navbar form and the blocks in the
// page's reader); desktop: the title block beside it. The calling page's kit and render context are passed in:
// use() is limited to that page's contract.
import { DESTINATIONS } from './destinations.mjs';
export function statePage({ id, kind = 'journal', title, blocks = [], panel = null }, platform, kit, context = 'screen') {
  const { html, use } = kit;
  // A block may be a function of the kit (a row the page composes with use()): resolved here, in order.
  const resolve = list => list.map(b => typeof b === 'function' ? b(kit) : b);
  const desktop = platform === 'desktop';
  const walk = context === 'walkthrough' && !desktop;
  const wordmark = kind === 'account' ? 'You' : 'Journal';
  const keybox = use('keybox', { key: 'Journal', value: 'Your journal', place: 'tool' });
  const destinations = use('dest', { links: DESTINATIONS, current: kind === 'account' ? 'you' : 'today' });
  const masthead = desktop
    ? use('mast', { form: 'title', wordmark }, { children: html`${keybox}${destinations}` })
    : use('header', { form: walk ? 'navbar' : 'static' }, { children: html`${use('mast', { form: 'row', wordmark }, { children: keybox })}${destinations}` });
  // The panel kind (composer-options): the record's row in a plain sheet, and a panel after it (the page's
  // markup, a function of the kit, composed with the page's own modules); no heading, no account sheet.
  const aside = panel ? panel(kit) : '';
  const sheet = panel
    ? use('sheet', { place: 'block record' }, { children: html`${resolve(blocks)}` })
    : use('sheet', { form: 'account', place: 'block record' }, { children: use('auth-form', { heading: title, blocks: resolve(blocks), place: 'form' }) });
  const page = use('page', { reader: walk ? wordmark : '' }, { header: desktop ? '' : masthead, children: html`${sheet}${aside}` });
  return use('shell', { motion: 'arrive', surface: 'account', layout: desktop ? 'sidebar' : 'single', attrs: { id } }, {
    children: html`${use('rail')}${desktop ? masthead : ''}${page}`,
  });
}
