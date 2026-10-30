// bone: <Bone form width height lines text /> in the developers' code. The skeleton's piece (v4 round 10): the shape
// of something still to come, in --bone with the one shared shimmer. Decorative (aria-hidden), except form status.
//   line: one bar, 12px tall unless height is given, round ends. block: a box (a button, a tool), width by height,
//   4px corners. round: a circle, width across. text: lines of prose at the prose line height, one bar per line
//   (lines: each line's width as a fraction of the row), so the skeleton is as tall as the words it stands for;
//   size inherit takes the parent's type (a leaf's headline, its words), height the bars' thickness.
//   spread: count bars of width each, spread evenly across a --tap row (a mood row's five words).
//   wave: the memo's waveform itself (the wave module) in bone. status: the skeleton's announced line, visually
//   hidden (role status), e.g. "Opening your journal.".
export default function render({ form = 'line', size = 'body', width = '', height = '', lines = [1], count = 5, text = '' } = {}, slots, { html, attrs, use }) {
  if (form === 'status') return html`<span class="aj-c-bone" data-form="status" role="status">${text}</span>`;
  if (form === 'wave') return html`<span class="aj-c-bone" data-form="wave" aria-hidden="true">${use('wave', { place: 'fill' })}</span>`;
  const style = [width && `--aj-c-bone-w:${width}`, height && `--aj-c-bone-h:${height}`].filter(Boolean).join(';');
  if (form === 'spread') return html`<span class="aj-c-bone" data-form="spread" aria-hidden="true"${attrs({ style: style || false })}>${Array.from({ length: count }, () => html`<i></i>`)}</span>`;
  if (form === 'text') return html`<span class="aj-c-bone" data-form="text" aria-hidden="true"${attrs({ 'data-size': size === 'inherit' ? 'inherit' : false, style: style || false })}>${lines.map(w => html`<i${attrs({ style: `--aj-c-bone-w:${Math.round(w * 100)}%` })}></i>`)}</span>`;
  return html`<i class="aj-c-bone"${attrs({ 'data-form': form !== 'line' ? form : false, style: style || false })} aria-hidden="true"></i>`;
}
