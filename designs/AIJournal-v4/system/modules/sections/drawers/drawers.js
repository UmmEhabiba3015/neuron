// drawers: behaviour. Query only inside root; talk outward with bubbling events on root.
// One modal layer, both drawers in it, either or both open. Each opens from its edge on the next frame and leaves on
// its ease-out; the layer closes once both have gone. The pills are lit above the dim (a copy laid over each,
// clickable) wherever no open drawer covers them; an open drawer's pill is pressed. The history steps into a group
// and back; a day picked or a bookmark chosen is announced for the app.
register('drawers', root => {
  const layer = root.querySelector('.aj-s-drawers__layer'), lit = root.querySelector('.aj-s-drawers__lit');
  const real = k => root.querySelector(`.aj-s-drawers__pills > [data-hook~="${k}"]`);
  const copy = k => lit.querySelector(`[data-hook~="${k}"]`);
  const panel = k => layer.querySelector(`.aj-s-drawers__panel[data-key="${k}"]`);
  const keys = ['history', 'bookmarks'], timers = {};
  const reduced = () => !root.closest('[data-motion-review="play"]') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isOpen = k => panel(k).hasAttribute('data-open');
  let order = keys.filter(isOpen); // the open drawers, the latest last (Escape closes it)
  let after = null; // what happens once the layer has closed (focus back, or the jump)

  // the copies follow their pills (place, words, count) and hide where an open drawer would cover them
  const sync = () => {
    const vw = innerWidth;
    const spans = order.map(k => { const w = panel(k).offsetWidth; return panel(k).dataset.side === 'right' ? [vw - w, vw] : [0, w]; });
    for (const k of keys) {
      const r = real(k).getBoundingClientRect(), c = copy(k);
      if (c.innerHTML !== real(k).innerHTML) c.innerHTML = real(k).innerHTML;
      c.setAttribute('aria-expanded', String(isOpen(k))); real(k).setAttribute('aria-expanded', String(isOpen(k)));
      Object.assign(c.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      c.hidden = spans.some(([a, b]) => r.left < b && r.right > a);
    }
  };
  const open = k => {
    if (isOpen(k)) return;
    clearTimeout(timers[k]);
    if (!layer.open) { layer.showModal(); lit.hidden = false; }
    const p = panel(k);
    p.hidden = false; void p.offsetWidth;
    p.setAttribute('data-open', ''); layer.setAttribute('data-open', '');
    order = order.filter(x => x !== k).concat(k);
    sync();
    p.querySelector('[data-hook~="close"]').focus({ preventScroll: true });
  };
  const finish = () => {
    if (!layer.open || order.length || keys.some(k => !panel(k).hidden)) return;
    layer.close(); lit.hidden = true;
    const next = after; after = null;
    next ? next() : null;
  };
  const close = (k, then) => {
    if (!isOpen(k)) return;
    const p = panel(k);
    p.removeAttribute('data-open');
    order = order.filter(x => x !== k);
    if (!order.length) { layer.removeAttribute('data-open'); after = then || (() => real(k).focus({ preventScroll: true })); }
    sync();
    // the other drawer stays: focus goes to this drawer's lit pill, or into the other drawer
    if (order.length) (copy(k).hidden ? panel(order.at(-1)).querySelector('[data-hook~="close"]') : copy(k)).focus({ preventScroll: true });
    const end = e => { if (e.target === p && e.propertyName === 'transform') done(); };
    const done = () => { clearTimeout(timers[k]); p.removeEventListener('transitionend', end); if (isOpen(k)) return; p.hidden = true; finish(); };
    if (reduced()) return done();
    p.addEventListener('transitionend', end);
    timers[k] = setTimeout(done, 400);
  };
  const closeAll = then => [...order].forEach((k, i, all) => close(k, i === all.length - 1 ? then : undefined));

  // the history: a group opens its own level; back returns to the one above
  const levels = root.querySelector('[data-hook~="levels"]');
  const show = key => {
    for (const l of levels.querySelectorAll('.aj-s-drawers__level')) l.hidden = l.dataset.level !== key;
    const l = levels.querySelector(`.aj-s-drawers__level[data-level="${key}"]`);
    (l.querySelector('[data-back]') || l.querySelector('.aj-s-drawers__item'))?.focus({ preventScroll: true });
  };

  const click = event => {
    const t = event.target;
    const pill = t.closest('.aj-s-drawers__pills > [data-hook]');
    if (pill) return open(pill.matches('[data-hook~="history"]') ? 'history' : 'bookmarks');
    const c = t.closest('.aj-s-drawers__lit > [data-hook]');
    if (c) { const k = c.matches('[data-hook~="history"]') ? 'history' : 'bookmarks'; return isOpen(k) ? close(k) : open(k); }
    if (t.closest('[data-hook~="close"]')) return close(t.closest('.aj-s-drawers__panel').dataset.key);
    const node = t.closest('[data-node]');
    if (node) return show(node.dataset.node);
    const back = t.closest('[data-back]');
    if (back) return show(back.closest('.aj-s-drawers__level').dataset.parent || '');
    const day = t.closest('[data-date]');
    if (day) {
      for (const d of levels.querySelectorAll('[data-date]')) d.setAttribute('aria-current', String(d === day));
      close('history', () => real('history').focus({ preventScroll: true }));
      return root.dispatchEvent(new CustomEvent('drawers:day', { bubbles: true, detail: { date: day.dataset.date } }));
    }
    const mark = t.closest('[data-jump]');
    if (mark) { const id = mark.dataset.jump; return closeAll(() => root.dispatchEvent(new CustomEvent('drawers:jump', { bubbles: true, detail: { id } }))); }
    if (t === layer || t === lit) closeAll();
  };
  const cancel = event => { event.preventDefault(); if (order.length) close(order.at(-1)); };
  const resize = () => { if (layer.open) sync(); };
  root.addEventListener('click', click);
  layer.addEventListener('cancel', cancel);
  addEventListener('resize', resize);
  return () => {
    keys.forEach(k => clearTimeout(timers[k]));
    root.removeEventListener('click', click); layer.removeEventListener('cancel', cancel); removeEventListener('resize', resize);
  };
});
