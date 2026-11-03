// Copy from the screens (the recording row on Today, 01-today). The long and non-Latin fixtures are
// stress tests, not product copy. The entry actions carry their legacy class (.entry-actions), as on
// the screens: the gutter reads it.
const bars = '<rect x="0" y="18" width="2" height="8"/><rect x="7" y="15" width="2" height="14"/><rect x="14" y="13" width="2" height="18"/><rect x="21" y="8" width="2" height="28"/><rect x="28" y="4" width="2" height="36"/><rect x="35" y="10" width="2" height="24"/><rect x="42" y="15" width="2" height="14"/><rect x="49" y="17" width="2" height="10"/><rect x="56" y="19" width="2" height="6"/><rect x="63" y="14" width="2" height="16"/><rect x="70" y="7" width="2" height="30"/><rect x="77" y="11" width="2" height="22"/><rect x="84" y="16" width="2" height="12"/><rect x="91" y="9" width="2" height="26"/><rect x="98" y="2" width="2" height="40"/>';
const LINE = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const BIN = `<svg ${LINE}><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>`;
const said = 'Walked the canal as far as the second bridge and back. Didn\'t listen to anything.';
export default ({ html, raw, use }) => {
  const player = html`${use('play', { label: 'Play recording, 2 minutes 41 seconds' })}${use('wave', { size: 'row', viewBox: '0 0 99 44' }, { path: raw(bars) })}`;
  const del = raw('<a class="aj-c-button btn quiet entry-icon" data-grade="quiet" data-form="icon" data-entry-action="delete" href="00-prototype.html#recording-delete-confirm" aria-label="Delete voice memo">' + BIN + '</a>');
  const withClass = (x) => raw(x.text.replace('class="aj-c-entry-actions"', 'class="aj-c-entry-actions entry-actions"'));
  const actions = withClass(use('entry-actions', { place: 'tools', form: 'tools', excluded: false, kind: 'recording', memoryLabel: 'In memory' }, { children: del }));
  const kept = html`${withClass(use('entry-actions', { place: 'tools', form: 'tools', excluded: true, kind: 'recording', memoryLabel: 'Out of memory' }, { children: del }))}${use('mark', { glyph: 'lock', label: 'Private, out of memory' })}`;
  return [
    { name: 'Default', note: 'The recording on Today: time, play, waveform, duration, the transcript and its entry actions.', props: { head: 'dated', live: false, time: '14:05', datetime: '2026-08-09T14:05', duration: '2:41', transcript: said }, slots: { player, children: actions } },
    { name: 'Free', note: 'The Free form: the head only, no transcript body.', props: { head: 'dated', live: false, time: '14:05', datetime: '2026-08-09T14:05', duration: '2:41' }, slots: { player } },
    { name: 'Continues the day', note: 'A row continuing the day above: the time column is present and empty.', props: { head: 'dated', live: false, duration: '2:41' }, slots: { player } },
    { name: 'Capture', note: 'From direction-lock C3: the capture head, stacked, no date column. No screen draws it today.', props: { head: 'capture', live: false, duration: '2:41' }, slots: { player } },
    { name: 'Live memo', note: 'A memo recorded in this session, as the prototype runtime clones it (template recrow-live): play, then the row\'s own wave and clock; the runtime draws the bars and the times.', props: { head: 'dated', live: true, time: '14:05', datetime: '2026-08-09T14:05', transcript: said }, slots: { player: use('play', { label: 'Play voice memo' }), children: actions } },
    { name: 'Out of memory', note: 'The memo is kept out of memory: the mark is hidden inside the gutter (the trigger says it).', props: { head: 'dated', live: false, time: '14:05', datetime: '2026-08-09T14:05', duration: '2:41', transcript: said }, slots: { player, children: kept } },
    { name: 'Long', tags: ['long'], note: 'Stress test only: a long transcript.', props: { head: 'dated', live: false, time: '14:05', datetime: '2026-08-09T14:05', duration: '12:41', transcript: (said + ' ').repeat(6).trim() + ' Averyveryveryveryveryveryveryveryveryverylongunbrokenwordthatkeepsgoingandgoingandgoing' }, slots: { player, children: actions } },
    { name: 'Non-Latin', tags: ['non-latin'], note: 'Stress test only: Russian and Japanese, not product copy.', props: { head: 'dated', live: false, time: '14:05 · 日', datetime: '2026-08-09T14:05', duration: '2:41', transcript: 'Дошёл до второго моста и обратно. 運河を歩きました。' }, slots: { player, children: actions } },
  { name: 'Transcript, prose', note: 'A kept recording with its transcript (01-today).', props: { time: '14:05', datetime: '2026-08-09T14:05', duration: '2:41', transcript: 'Walked the canal as far as the second bridge and back.', transcriptForm: 'prose' } },
  { name: 'Not yet transcribed', note: 'The label a recording carries until it is transcribed (18-entry-system-states: entry-unsent, today-without-note).', props: { time: '14:05', datetime: '2026-08-09T14:05', duration: '2:41', transcript: 'Voice memo', transcriptForm: 'label' } },
];
};
