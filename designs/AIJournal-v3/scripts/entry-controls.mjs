// Shared entry actions for numbered comps and the portable preview runtime.
const icon=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export function entryControlsFor(excluded=false){
 return `<div class="entry-actions" aria-label="Entry actions"><div class="entry-tools"><a class="btn quiet entry-icon" data-entry-action="edit" href="00-prototype.html#entry-edit" aria-label="Edit entry">${icon('<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/>')}</a><a class="btn quiet entry-icon" data-entry-action="delete" href="00-prototype.html#entry-delete-confirm" aria-label="Delete entry">${icon('<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>')}</a></div><details class="entry-memory-dropdown" data-excluded="${excluded}"><summary class="entry-memory-trigger" aria-label="Entry memory settings: ${excluded?'out of memory':'in memory'}"><span class="memory-state">${excluded?'Out of memory':'In memory'}</span>${icon('<path d="M6 9l6 6 6-6"/>')}</summary><div class="entry-memory-menu"><button class="opt" type="button" data-entry-action="memory" aria-pressed="${!excluded}"><span class="tick" aria-hidden="true"></span><span>Use in memory</span></button></div></details></div>`;
}
export const entryControls=entryControlsFor();
export function recordingControlsFor(excluded=false){
 return entryControlsFor(excluded).replace(/<a\b[^>]*data-entry-action="edit"[^>]*>[\s\S]*?<\/a>/,'').replaceAll('Entry actions','Voice memo actions').replaceAll('Delete entry','Delete voice memo').replaceAll('#entry-delete-confirm','#recording-delete-confirm').replaceAll('Entry memory settings','Voice memo memory settings').replaceAll('this entry','this voice memo');
}
export const recordingControls=recordingControlsFor();
export function replaceEntryLinks(html){
 return html.replace(/<a class="cite" href="00-prototype\.html#entry-options">Entry options<\/a>/g,entryControls);
}
