// Children are the legacy rail, title block and page from the screens (01-today, 02-timeline,
// 13-login); they render without their component styling on the catalogue page because those
// are not modules yet. Copy is the screens' own. The shell paints the paper ground and the
// rail's width, so every fixture shows a page of paper with a left margin.
const rail = '<div class="rail" aria-hidden="true"></div>';
const page = '<div class="page"><header class="mast"><h1 class="wordmark">Journal</h1></header></div>';
const title = '<div class="title"><h1 class="wordmark">Timeline</h1></div>';
export default [
  { name: 'Default', note: 'The notebook shell every screen sits on: rail, then page (01-today).', props: {}, slots: { children: rail + page } },
  { name: 'Auth surface', note: 'The plain-paper sign-in spread: full window height, set in --rule (13-login).', props: { surface: 'auth' }, slots: { children: rail + page } },
  { name: 'Account surface', note: 'The signed-out screens without the spread (16-flow-states, 17-account-data): drawn as the notebook; modules read data-surface="account" as a context.', props: { surface: 'account' }, slots: { children: rail + page } },
  { name: 'Motion scope', note: 'The product shell (data-motion="arrive"): arrival motion runs only inside it, never in the guide or the catalogue. Modules read it as a context.', props: { motion: 'arrive' }, slots: { children: rail + page } },
  { name: 'Sidebar', note: 'The desktop shell with a title block as its first column. Its grid follows the layout (v4 D1: pages ask for sidebar only from 1200), so it reads as two columns here too (02-timeline).', props: { layout: 'sidebar' }, slots: { children: rail + title + page } },
  { name: 'Clip', note: 'Presentation only: the states packs show many states of one screen without a full viewport each.', props: { clip: true }, slots: { children: rail + page } },
];
