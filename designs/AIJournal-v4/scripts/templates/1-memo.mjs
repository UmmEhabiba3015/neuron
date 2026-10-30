// Area 1 (memo and recorder): recrow-live.
// name -> render => markup (tools/modules/templates.mjs; files load in name order).
// recrow-live: a kept voice memo, dated, as the runtime clones it. The runtime fills the time, the
// clock (hooks elapsed, total) and the label; the entry controls are area 2's.
// memo-download: the kept recording's download link (a quiet button); the runtime adds its own class
// (prototype-download, the app's) and sets href and download.
export default {
  'recrow-live': render => render('recrow', { head: 'dated', live: true }, { player: render('play', { label: 'Play voice memo' }) }),
  'memo-download': render => render('button', { grade: 'quiet', label: 'Download recording', href: '#' }, {}, { href: false }),
};
