// recrow: <RecordingRow head live time datetime duration transcript>{player}{children}</RecordingRow> in the developers' code.
// kit: { html, raw, attrs, use, root, el }. use(name, props, slots) renders a module listed in "uses".
// The head always carries the time column (empty where the row continues the day); the body is the
// Pro transcript with its children (entry actions, mark). capture is the stacked head, no column.
// The live memo (live) is the row the prototype runtime keeps: its play control in the player slot, then
// the wave (two of the wave module, the memo's phrase at a fixed pitch: the base and the played copy, which the
// progress reveals) and the clock (hooks elapsed, total), and a body with an empty label paragraph (the text
// module) for the runtime to fill.
export default function render({ head = 'dated', live = false, time = '', datetime = '', duration = '', transcript = '', transcriptForm = 'prose' } = {}, slots = {}, { html, raw, attrs, use }) {
  const dated = head !== 'capture';
  const stamp = live || (time && datetime) ? html`<time${attrs({ datetime: datetime || false })}>${time}</time>` : time;
  const column = dated ? html`<div class="aj-c-recrow__time" data-hook="date">${stamp}</div>` : '';
  const playback = live
    ? html`<span class="aj-c-recrow__wave" aria-hidden="true"><span class="aj-c-recrow__wave-base">${use('wave')}</span><span class="aj-c-recrow__wave-played"><span class="aj-c-recrow__progress" data-hook="progress">${use('wave')}</span></span></span><span class="aj-c-recrow__clock" aria-label="Playback time"><span data-hook="elapsed">0:00</span><span class="aj-c-recrow__total">/ <span data-hook="total">0:00</span></span></span>`
    : '';
  const body = live
    ? html`<div class="aj-c-recrow__body"><div class="aj-c-recrow__time"></div><div class="aj-c-recrow__main">${use('text', { form: transcriptForm, text: transcript })}${slots.children}</div></div>`
    : transcript
      ? html`<div class="aj-c-recrow__body"><div class="aj-c-recrow__time"></div><div class="aj-c-recrow__main">${use('text', { form: transcriptForm, text: transcript })}${slots.children}</div></div>`
      : '';
  return html`<div class="aj-c-recrow"${live ? raw(' data-live-memo="1"') : ''}><div class="aj-c-recrow__head"${raw(dated ? ' data-dated' : ' data-capture')}>${column}<div class="aj-c-recrow__main">${slots.player}${playback}${live ? '' : html`<span class="aj-c-recrow__dur">${duration}</span>`}</div></div>${body}</div>`;
}
