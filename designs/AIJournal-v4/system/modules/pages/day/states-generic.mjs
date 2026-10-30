// Day's state drawn as a generic state page (18-entry-system-states: last-deleted): state -> { id, kind, title,
// blocks } for system/content/state-page.mjs. Read from the pack's final markup (the same on every platform).
export default {
  'last-deleted': { id: "day-last-deleted", kind: 'journal', title: "Nothing on this day", blocks: [
    { type: 'copy', text: "The last item on this day was deleted, so this day no longer appears in Timeline." },
    { type: 'actions', items: [{ label: "Back to Timeline", href: "00-prototype.html#timeline", grade: "solid" }] },
  ] },
};
