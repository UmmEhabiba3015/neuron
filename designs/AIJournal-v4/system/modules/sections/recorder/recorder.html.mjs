// recorder: <Recorder phase state clock trace /> in the developers' code. It draws the date box and the
// controls itself (keybox and button modules); the runtime swaps the start controls and the
// transport with hidden. The trace is the memo's fixed decorative shape (slot trace, from the page);
// it never follows the sound. Keep this out of memory (the composer's option) sits under the controls in
// every phase, so it can be set before or while recording; the kept memo takes it (decision 2026-10-28).
// v4 C5 (explore drafts a-quiet-line): while paused the field is the player (the trace is the track, a veil over what
// is not played yet, a playhead; play / pause, back and forward 10 s, position / length under it) and Discard stands at
// the transport's far end, asking first. Both are drawn in every phase and shown only while paused
// (data-recorder-phase), so the runtime never builds them (it opens on a ready recorder). Leaving keeps the memo as a draft; the session line shows
// the day only (a memo is dated when it is kept).
import { PLAY, PAUSE, BACK_10, FORWARD_10 } from '../../../content/icons.mjs';
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12"/></svg>';
// The state line says which microphone state is drawn (as the retired scripts/compact-recorder.mjs had them: denied, missing, pending).
const MIC_STATES = {
  'Microphone blocked': 'Microphone access is blocked. Allow it in your browser settings, then try again.',
  'Microphone unavailable': 'No microphone found. Connect a microphone, then try again.',
  'Microphone access': 'Waiting for microphone access. Respond to your browser’s permission prompt.',
};
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export default function render({ phase = 'ready', state = 'Ready', clock = '0:00', back = '#today', date = 'Sun 9 Aug', draft = false, length = '', seconds = 0, position = 0, playing = false, confirm = false } = {}, slots = {}, { html, raw, attrs, use }) {
  const paused = phase === 'paused';
  // A memo under way (recording or paused) shows the transport; before one starts, the start controls.
  const started = phase === 'recording' || paused;
  const blocked = state in MIC_STATES;
  const retry = state === 'Microphone blocked' || state === 'Microphone unavailable';
  // Without a trace from the page, a flat line: 128 bars at .015.
  const bars = slots.trace && slots.trace.text ? slots.trace : raw(Array.from({ length: 128 }, (_, i) => `<g style="transform:scaleY(.015)"><rect x="${i * 8 + 2}" y="10" width="4" height="160" fill="currentColor"/></g>`).join(''));
  const message = MIC_STATES[state] || '';
  const pauseLabel = raw(`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paused ? 'm9 5 11 7-11 7Z' : 'M8 5v14M16 5v14'}"/></svg><span>${paused ? 'Resume' : 'Pause'}</span>`);
  // The player's place (0 to 1, the root's --aj-s-recorder-at) and whether playback has begun: before it, the trace is
  // drawn as recorded; position / length is always read left to right (dir ltr), or right to left it reverses.
  // The track is a slider only while paused (the runtime sets and clears it with the phase).
  const at = seconds ? Math.min(1, Math.max(0, position / seconds)) : 0;
  const playback = paused && playing ? 'playing' : paused && position > 0 ? 'started' : false;
  const track = paused ? { role: 'slider', tabindex: '0', 'aria-label': 'Position in the memo', 'aria-valuemin': '0', 'aria-valuemax': String(seconds), 'aria-valuenow': String(Math.round(position)), 'aria-valuetext': `${fmt(position)} of ${length}` } : {};
  const player = html`<div class="aj-s-recorder__player" data-hook="player"><button class="aj-s-recorder__ctl aj-s-recorder__play" type="button" data-recorder="play" aria-label="${playing ? 'Pause playback' : 'Play back'}">${raw(playing ? PAUSE : PLAY)}</button><button class="aj-s-recorder__ctl aj-s-recorder__skip" type="button" data-recorder="skip" data-skip="-10" aria-label="Back 10 seconds">${raw(BACK_10)}</button><button class="aj-s-recorder__ctl aj-s-recorder__skip" type="button" data-recorder="skip" data-skip="10" aria-label="Forward 10 seconds">${raw(FORWARD_10)}</button><span class="aj-s-recorder__pos"><span dir="ltr"><span data-position>${fmt(position)}</span> / <span data-length>${length}</span></span></span></div>`;
  // Discard asks first: the question takes the transport's place (the entry rows' confirm, by look). First in the
  // markup, so the row-reverse transport sets it at the far end.
  const discard = html`${use('button', { grade: 'quiet', place: 'discard', data: { recorder: 'discard' }, label: 'Discard' })}<div class="aj-s-recorder__confirm" data-hook="confirm" role="alertdialog" aria-label="Discard memo"${attrs({ hidden: confirm ? false : true })}><p class="aj-s-recorder__question">Discard this <span data-length>${length}</span> memo? This cannot be undone.</p><div class="aj-s-recorder__buttons">${use('button', { form: 'transport', grade: 'quiet', data: { recorder: 'discard-yes' }, label: 'Discard memo' })}${use('button', { form: 'transport', grade: 'solid', data: { recorder: 'discard-no' }, label: 'Go back' })}</div></div>`;
  // The hooks and the state the runtime uses (contract behaviour).
  return html`<div class="aj-s-recorder"${attrs({ 'data-recorder-phase': started ? phase : 'ready', 'data-draft': draft && paused ? '' : false, 'data-playback': playback, style: paused && at ? `--aj-s-recorder-at:${+at.toFixed(4)}` : false })}><header class="aj-s-recorder__mast"><a class="aj-s-recorder__wordmark" href="${back}" data-recorder="back">Journal</a>${use('keybox', { key: 'Today', value: 'Sun 9 Aug ’26', date: 'hand' })}</header>
<main class="aj-s-recorder__main"><div class="aj-s-recorder__back"><a class="aj-s-recorder__backlink" href="${back}" data-recorder="back"><span aria-hidden="true">←</span> Today</a><p class="aj-s-recorder__printed" data-back-note>${started ? 'Leaving keeps your memo as a draft.' : 'No recording has started.'}</p></div>
<div class="aj-s-recorder__intro"><h1>Voice memo</h1><p class="aj-s-recorder__printed">Start when you are ready. Stop and keep adds it to today.</p></div>
<div class="aj-s-recorder__sheet"><div class="aj-s-recorder__session"><span class="aj-s-recorder__state" role="status" data-session-state>${draft && paused ? `${state} · draft` : state}</span><span class="aj-s-recorder__printed aj-s-recorder__date" data-session-date>${date}</span><div class="aj-s-recorder__clock"><span class="aj-s-recorder__time" data-clock role="timer" aria-label="Elapsed recording time">${clock}</span><span class="aj-s-recorder__printed">Time recorded</span></div></div>
<div class="aj-s-recorder__field"><div class="aj-s-recorder__wave"><div class="aj-s-recorder__track" data-hook="track"${attrs(track)}><svg class="aj-s-recorder__trace" data-live-wave viewBox="0 0 1024 180" preserveAspectRatio="none" aria-hidden="true" focusable="false">${bars}</svg><i class="aj-s-recorder__veil" aria-hidden="true"></i><i class="aj-s-recorder__head" aria-hidden="true"></i></div><div class="aj-s-recorder__axis" aria-hidden="true"><span>Start</span><span data-axis-end>${paused && length ? length : started ? 'Now' : 'Not started'}</span></div></div>${player}</div>
<div class="aj-s-recorder__start" data-hook="start"${attrs({ hidden: started ? true : false })}><p class="aj-s-recorder__printed">Nothing is being recorded yet.</p><div class="aj-s-recorder__group"><div class="aj-s-recorder__buttons">${use('button', { form: 'transport', grade: 'solid', place: 'grow', data: { recorder: 'start' }, disabled: blocked, label: raw(`${MIC}<span>Start recording</span>`), attrs: { 'aria-describedby': 'microphone-status' } })}${use('button', { form: 'transport', grade: 'keyline', href: back, data: { recorder: 'back' }, label: 'Cancel' })}</div><div class="aj-s-recorder__feedback"><p class="aj-s-recorder__printed" id="microphone-status" data-microphone-status role="status"${attrs({ hidden: message ? false : true })}>${message}</p>${use('button', { form: 'transport', grade: 'quiet', data: { recorder: 'retry' }, label: 'Try again', attrs: { hidden: !!retry ? false : true } })}</div></div></div>
<div class="aj-s-recorder__transport" data-hook="transport"${attrs({ hidden: started ? false : true })}>${discard}<p class="aj-s-recorder__printed" data-recording-hint>${paused ? 'Your memo is paused. Play it back, record more, or keep it.' : 'Take your time. Pauses belong here too.'}</p><div class="aj-s-recorder__buttons">${use('button', { form: 'transport', grade: 'solid', place: 'grow', data: { recorder: 'keep' }, label: raw(`${STOP}<span>Stop and keep</span>`) })}${use('button', { form: 'transport', grade: 'keyline', data: { recorder: 'pause' }, label: pauseLabel })}</div></div>
<div class="aj-s-recorder__memory">${use('opt', { label: 'Keep this out of memory', data: { hook: 'memory' } })}</div></div></main></div>`;
}
