// Icons the pages place in their modules' slots (copied from the screens, 2026-10-14). Drawing data:
// a page passes them to a module (button form icon, its icon slot); no page draws its own.
export const EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg>';
export const DELETE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
// v4 C2, Ask (explore ask-readable A and ask-cant-loading f-mix). Line icons draw in currentColor; a module
// fills a pressed one (a set bookmark or thumb) by setting the svg's fill.
const LINE16 = 'viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
export const HISTORY = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2 7a5 5 0 1 0 1.5-3.6M2 2v2.5h2.5M7 4.2V7l2 1.4"/></svg>';
export const BOOKMARK = `<svg ${LINE16}><path d="M4 2.5h8v11l-4-3-4 3z"/></svg>`;
// The Bookmarks pill's glyph: the same shape, filled.
export const BOOKMARK_SOLID = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5h8v11l-4-3-4 3z"/></svg>';
export const COPY = `<svg ${LINE16}><path d="M5.5 5.5h8v8h-8z"/><path d="M10.5 5.5v-3h-8v8h3"/></svg>`;
export const THUMB_UP = `<svg ${LINE16}><path d="M2.5 7h2.5v6.5h-2.5z"/><path d="M5 7l2.6-4.6c1.3 0 2 .9 1.7 2.1L8.8 6.5h3.9c.9 0 1.5.8 1.3 1.6l-1.1 4.3c-.2.6-.7 1.1-1.4 1.1H5"/></svg>`;
export const THUMB_DOWN = `<svg ${LINE16}><path d="M2.5 2.5h2.5V9h-2.5z"/><path d="M5 9l2.6 4.6c1.3 0 2-.9 1.7-2.1L8.8 9.5h3.9c.9 0 1.5-.8 1.3-1.6l-1.1-4.3c-.2-.6-.7-1.1-1.4-1.1H5"/></svg>`;
export const PLUS = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 1.5v9M1.5 6h9"/></svg>';
// The send arrow: up, as the message rises into the thread.
export const SEND = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 12V2.5M2.8 6.5L7 2.3l4.2 4.2"/></svg>';
// The chevron after "n entries used" and a history count; turned 180° when open.
export const CHEVRON = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 4.5l4 4 4-4"/></svg>';
// "Not in your journal": a lens struck through.
export const NOT_FOUND = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4L14 14M4.4 9.6l5.2-5.2"/></svg>';
// v4 C3, Reflections (explore booklet-feel f-mix): what a day kept, a pen for written and a microphone for recorded,
// drawn in the kept picture's squares.
export const WRITTEN = `<svg ${LINE16}><path d="M3 13l1-3.5L11 2.5l2.5 2.5L6.5 12 3 13z"/></svg>`;
export const RECORDED = `<svg ${LINE16}><rect x="5.5" y="1.8" width="5" height="8" rx="2.5"/><path d="M3.2 7.8a4.8 4.8 0 0 0 9.6 0M8 12.6v1.8"/></svg>`;
// v4 C4, the overview on Today (explore overview-single-line c): the chevron after the line, pointing to where the
// line leads (the reflection). Drawn on a 24 grid at 1.8, shown at 16px.
export const OPENS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
// v4 C5, drafts (explore drafts a-quiet-line): the upload arrow of an unsent entry or memo, drawn on a 24 grid at 1.7,
// shown at 14px; while it sends, the pending line lifts it.
export const UPLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V5"/><path d="m7.5 9.5 4.5-4.5 4.5 4.5"/><path d="M5 19h14"/></svg>';
// The memo draft line's microphone, the composer's mic drawn at 14px.
export const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3.5"/></svg>';
// The recorder's player: play and pause filled, the skips a turning arrow round "10". The "10" takes the control's own
// face (no font named here, so it is the bundled label face); the arrow is in data-turn, so right to left the arrow
// mirrors and the number does not.
export const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
export const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14"/><rect x="13.5" y="5" width="4" height="14"/></svg>';
export const BACK_10 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g data-turn><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></g><text x="12" y="15.2" font-size="7" text-anchor="middle" fill="currentColor" stroke="none">10</text></svg>';
export const FORWARD_10 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g data-turn><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/></g><text x="12" y="15.2" font-size="7" text-anchor="middle" fill="currentColor" stroke="none">10</text></svg>';
