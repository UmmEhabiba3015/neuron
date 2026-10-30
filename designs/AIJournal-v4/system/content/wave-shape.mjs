// The voice memo's waveform: one fixed decorative shape (RecommendedChanges-v4 B6, decision 2026-10-20).
// It never follows the sound, live or saved, and every memo draws the same one, so it cannot be read as
// a record of what was said; the duration beside it carries the information. The phrase is the approved
// drawing of Today's 14:05 recording (01-today, desktop): 120 bar heights out of a 44-unit row, repeated
// as far as a row is wide.
export const PHRASE = [
  8, 14, 18, 28, 36, 24, 14, 10, 6, 16, 30, 22, 12, 26, 40, 30, 20, 12, 6, 18, 28, 20, 12, 22, 34, 20, 8, 14,
  20, 30, 38, 22, 6, 12, 16, 22, 28, 18, 8, 16, 22, 32, 40, 26, 12, 8, 6, 14, 20, 26, 32, 20, 8, 12, 16, 26,
  36, 20, 6, 12, 18, 12, 6, 20, 36, 26, 16, 12, 8, 20, 32, 26, 20, 14, 6, 8, 12, 26, 40, 32, 22, 16, 8, 18,
  28, 22, 16, 12, 6, 22, 38, 30, 20, 14, 8, 20, 34, 22, 12, 20, 28, 18, 6, 12, 20, 30, 40, 26, 12, 22, 30,
  16, 6, 10, 14, 24, 36, 28, 18, 14,
];
const height = i => PHRASE[i % PHRASE.length];

// The capture geometry (the recorder's trace and a memo kept in the preview): 128 bars every 8 units in a
// 1024 x 180 viewBox, each a level from 0 to 1 of a 160-unit bar.
export const LEVELS = Array.from({ length: 128 }, (_, i) => Number((height(i) / 44).toFixed(4)));

// The recorder's trace: each bar a full-height rect in a group the runtime scales. Before a recording
// starts the trace is flat (scale .015); while recording or paused it shows the shape. data-level is the
// bar's place in the shape, which the runtime scales to when Start is pressed.
export function traceBars(shown) {
  return LEVELS.map((level, i) => `<g data-level="${level}" style="transform:scaleY(${shown ? level : '.015'})"><rect x="${i * 8 + 2}" y="10" width="4" height="160" fill="currentColor"/></g>`).join('');
}

// The row waveform at a fixed pitch (v4 round 10, decision 2026-10-29): one tile of the phrase as Today's 14:05 row
// draws it at 1440 on opening (bars 1.77px every 6.19px, out of a 44px row), repeated along the row by wave.css as a
// mask. A wider row shows more of the phrase; the bars never widen. wave.css carries TILE literally (a stylesheet
// can't import), and verify-portability checks the two are equal.
export const PITCH = 6.19;
export const TILE_WIDTH = Number((PHRASE.length * PITCH).toFixed(2));
export const TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${PHRASE.length * 7} 44' preserveAspectRatio='none'%3E%3Cpath d='${PHRASE.map((h, i) => `M${i * 7} ${22 - h / 2}h2v${h}h-2z`).join('')}'/%3E%3C/svg%3E")`;
