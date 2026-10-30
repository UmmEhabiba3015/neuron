// moodgraph: <MoodGraph week label days before after current /> in the developers' code.
// One week's mood (v4 C1, explore timeline-jump-arrival f-wash-and-frame): a monotone curve through the days
// written, carried in from the last day written before the week and out to the first after (level to the edge
// where there is none); one day is a straight line; nothing written is the empty graph. The ground under the
// curve takes the colour of the week's average mood (README, the area colour). Each point is a button to its day.
// days: { date, mood?, has?, future?, name, short } per day, Monday first. before, after: { date, mood } or none.
const MOODS = ['light', 'good', 'even', 'low', 'hard'];
const WORD = { light: 'Light', good: 'Good', even: 'Even', low: 'Low', hard: 'Hard' };
const HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// The drawing's own units (the approved design's 300 by 150): the scale fits the five words, the days' two lines.
const W = 300, H = 150, PAD = { l: 44, r: 14, t: 14, b: 34 };
const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b, BASE = PAD.t + IH, L = PAD.l, R = W - PAD.r;
const x = i => L + IW * (i + 0.5) / 7;
const y = m => PAD.t + IH * MOODS.indexOf(m) / 4;
const f = n => n.toFixed(1);
const DAY = 864e5;

// The week's mood: Hard 1 to Light 5 over the days written, rounded to the nearest. Exactly between two moods,
// the side with more days wins (days above the average against days below it); still level, the latest day's side.
export function weekMood(moods) {
  const s = moods.map(m => 5 - MOODS.indexOf(m)), avg = s.reduce((a, b) => a + b, 0) / s.length;
  let r = Math.round(avg);
  if (Math.abs(avg % 1 - 0.5) < 1e-9) {
    const up = s.filter(v => v > avg).length, down = s.filter(v => v < avg).length;
    r = up !== down ? (up > down ? Math.ceil(avg) : Math.floor(avg)) : (s[s.length - 1] > avg ? Math.ceil(avg) : Math.floor(avg));
  }
  return MOODS[5 - r];
}

// A monotone cubic (Fritsch-Carlson) through the points: it never swings past a point, so it never shows a
// mood between two days that neither day had.
function curve(P) {
  const n = P.length, d = [], m = [];
  for (let k = 0; k < n - 1; k++) d[k] = (P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]);
  for (let k = 0; k < n; k++) m[k] = k === 0 ? d[0] : k === n - 1 ? d[n - 2] : d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
    const a = m[k] / d[k], b = m[k + 1] / d[k], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[k] = t * a * d[k]; m[k + 1] = t * b * d[k]; }
  }
  return P.slice(1).map((b, k) => {
    const a = P[k], dx = (b[0] - a[0]) / 3;
    return `C${f(a[0] + dx)} ${f(a[1] + m[k] * dx)} ${f(b[0] - dx)} ${f(b[1] - m[k + 1] * dx)} ${f(b[0])} ${f(b[1])}`;
  }).join('');
}

export default function render({ week = '', label = '', days = [], before, after, current } = {}, slots, { html, raw, attrs }) {
  const written = days.filter(d => d.mood);
  const slot = date => Math.round((Date.parse(date) - Date.parse(week)) / DAY);
  let s = MOODS.map(m => `<line class="aj-c-moodgraph__rule" x1="${L}" x2="${R}" y1="${f(y(m))}" y2="${f(y(m))}"/><text class="aj-c-moodgraph__scale" x="${L - 8}" y="${f(y(m) + 3.5)}" text-anchor="end">${WORD[m]}</text>`).join('');
  s += days.map((d, i) => `<text class="aj-c-moodgraph__head" x="${f(x(i))}" y="${H - PAD.b + 16}" text-anchor="middle"${d.has || d.mood ? ' data-has=""' : ''}>${HEADS[i]}</text><text class="aj-c-moodgraph__date" x="${f(x(i))}" y="${H - PAD.b + 28}" text-anchor="middle">${d.future ? '' : Number(d.date.slice(8))}</text>`).join('');
  let mood = '';
  if (written.length) {
    let P;
    if (written.length === 1) P = [[L, y(written[0].mood)], [R, y(written[0].mood)]];
    else {
      P = days.map((d, i) => d.mood && [x(i), y(d.mood)]).filter(Boolean);
      P.unshift(before ? [x(slot(before.date)), y(before.mood)] : [L, P[0][1]]);
      P.push(after ? [x(slot(after.date)), y(after.mood)] : [R, P[P.length - 1][1]]);
    }
    const line = `M${f(P[0][0])} ${f(P[0][1])}${curve(P)}`;
    mood = weekMood(written.map(d => d.mood));
    // the nested drawing clips the carried-in and carried-out ends at the week's edges, with no id to collide
    s += `<svg x="${L}" y="0" width="${IW}" height="${H}" viewBox="${L} 0 ${IW} ${H}"><path class="aj-c-moodgraph__ground" data-mood="${mood}" d="${line}L${f(P[P.length - 1][0])} ${BASE}L${f(P[0][0])} ${BASE}Z"/><path class="aj-c-moodgraph__curve" d="${line}"/></svg>`;
    s += written.map(d => `<circle class="aj-c-moodgraph__dot" data-mood="${d.mood}" cx="${f(x(days.indexOf(d)))}" cy="${f(y(d.mood))}" r="5.5" data-date="${d.date}"${d.date === current ? ' data-current=""' : ''}/>`).join('');
  }
  const said = written.map(d => `${d.name}, ${WORD[d.mood]}`).join('; ') || 'nothing written yet';
  const name = `Mood, ${label}: ${said}${mood ? `. On average ${WORD[mood]}` : ''}`;
  const points = written.map(d => {
    const i = days.indexOf(d);
    return html`<button class="aj-c-moodgraph__point" type="button"${attrs({ style: `--aj-c-moodgraph-x:${f(x(i) / W * 100)}%;--aj-c-moodgraph-y:${f(y(d.mood) / H * 100)}%`, 'data-date': d.date, 'data-tip': `${d.short} · ${WORD[d.mood]}`, 'aria-label': `${d.name}, ${WORD[d.mood]}. Go to this day` })}></button>`;
  });
  return html`<div class="aj-c-moodgraph" data-module="moodgraph"${attrs({ 'data-week': week || false, 'data-current': current || false })}><svg class="aj-c-moodgraph__drawing" viewBox="0 0 ${W} ${H}" role="img"${attrs({ 'aria-label': name })}>${raw(s)}</svg>${points}</div>`;
}
