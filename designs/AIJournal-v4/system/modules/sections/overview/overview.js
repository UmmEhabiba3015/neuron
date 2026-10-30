// overview: behaviour. Query only inside root; talk outward with bubbling events on root.
// The fade: a line that runs over its row is marked data-over (the CSS fades it into the chevron in place of the
// ellipsis). It watches the line itself, whose box follows its text and its row, and checks again once the fonts have
// loaded, since a late font changes the line's width without resizing anything.
// The nudge: the first time a reflection's line is shown the chevron nudges once (data-new). The seen record keeps the
// last reflection whose nudge was shown: the account keeps it in the product; here the browser does (guarded, as
// storage can be missing). The motion-review switch ignores it, so the nudge can be watched on every load.
register('overview', root => {
  const line = root.querySelector('.aj-s-overview__line');
  if (!line) return () => {};
  const mark = () => root.toggleAttribute('data-over', line.scrollWidth > line.clientWidth + 1);
  mark();
  const watch = typeof ResizeObserver === 'function' ? new ResizeObserver(mark) : null;
  if (watch) watch.observe(line);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mark);

  const KEY = 'aj-overview-seen', id = root.dataset.reflection;
  const review = !!root.closest('html[data-motion-review="play"]');
  let seen = '';
  try { seen = localStorage.getItem(KEY) || ''; } catch (e) {}
  if (id && (review || seen !== id)) {
    root.setAttribute('data-new', '');
    try { localStorage.setItem(KEY, id); } catch (e) {}
  }
  return () => { if (watch) watch.disconnect(); };
});
