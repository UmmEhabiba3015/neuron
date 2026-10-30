// booklet: behaviour. Query only inside root; talk outward with bubbling events on root.
// Turns the leaves: one at a time below the container's 1200, a spread of two from it (the CSS says which through
// --aj-s-booklet-span). Arrows, the Left and Right keys, a touch swipe, and a tap on a leaf's outer thirds in a
// phone's column (--aj-s-booklet-tap). The leaves out of view are inert. Under reduced motion the CSS drops the turn.
register('booklet', root => {
  const leaves = [...root.querySelectorAll('.aj-s-booklet__stack > [data-place~="leaf"]')], n = leaves.length;
  const prev = root.querySelector('[data-hook~="prev"]'), next = root.querySelector('[data-hook~="next"]'), count = root.querySelector('[data-hook~="count"]');
  const one = count && count.querySelector('.aj-s-booklet__one'), two = count && count.querySelector('.aj-s-booklet__two');
  if (n < 2) return () => {};
  const css = name => getComputedStyle(root).getPropertyValue(name).trim();
  const span = () => (css('--aj-s-booklet-span') === '2' ? 2 : 1);
  const words = (key, a, b) => (root.getAttribute(key) || '').replace('{a}', a).replace('{b}', b).replace('{n}', n);
  let at = Number(root.dataset.at) || 0, s = span();

  const set = (i, announce = true) => {
    s = span();
    at = Math.max(0, Math.min(n - 1, i)); at -= at % s;
    leaves.forEach((leaf, k) => {
      const pos = k >= at && k < at + s ? 'now' : k < at ? 'past' : 'next';
      if (leaf.dataset.pos !== pos) leaf.dataset.pos = pos;
      leaf.style.setProperty('--aj-s-booklet-k', k - at);
      leaf.inert = pos !== 'now';
    });
    root.dataset.at = at;
    // the words for one leaf and for the spread (the CSS shows the one in force): at is the spread's first leaf when s is 2
    const pair = at - (at % 2);
    if (one) one.textContent = words('data-page', at + 1);
    if (two) two.textContent = pair + 1 < n ? words('data-pages', pair + 1, pair + 2) : words('data-page', pair + 1);
    // a spent arrow gives its focus to the other one, so the keyboard never drops out of the booklet
    const spent = document.activeElement;
    if (prev) prev.disabled = at === 0;
    if (next) next.disabled = at + s >= n;
    if (spent && spent.disabled && (spent === prev || spent === next)) (spent === prev ? next : prev).focus();
    if (announce) root.dispatchEvent(new CustomEvent('booklet:turn', { bubbles: true, detail: { at, span: s } }));
  };
  const go = step => { const before = at; set(at + step * s); return at !== before; };

  const press = event => {
    if (event.target.closest('[data-hook~="prev"]')) return go(-1);
    if (event.target.closest('[data-hook~="next"]')) return go(1);
    // a tap on the leaf's outer thirds, in a phone's column, not on its links and buttons
    const leaf = event.target.closest('[data-place~="leaf"][data-pos="now"]');
    if (!leaf || event.target.closest('a,button') || css('--aj-s-booklet-tap') !== '1') return;
    const r = leaf.getBoundingClientRect(), x = (event.clientX - r.left) / r.width;
    if (x > 2 / 3) go(1); else if (x < 1 / 3) go(-1);
  };
  const key = event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (event.key === 'ArrowRight' && go(1)) event.preventDefault();
    if (event.key === 'ArrowLeft' && go(-1)) event.preventDefault();
  };
  let x0 = null;
  const down = event => { x0 = event.pointerType === 'mouse' ? null : event.clientX; };
  const up = event => { if (x0 === null) return; const dx = event.clientX - x0; x0 = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); };
  // Timeline's way back names the leaf in the hash (#leaf-sleep): open there
  const hash = () => { const k = leaves.findIndex(leaf => leaf.id && `#${leaf.id}` === location.hash); if (k >= 0) set(k); };
  // the column crossing 1200 changes the span: keep the leaf in view
  const resized = new ResizeObserver(() => { if (span() !== s) set(at); });

  root.addEventListener('click', press);
  root.addEventListener('keydown', key);
  root.addEventListener('pointerdown', down);
  root.addEventListener('pointerup', up);
  addEventListener('hashchange', hash);
  resized.observe(root);
  set(at, false);
  hash();
  return () => {
    root.removeEventListener('click', press);
    root.removeEventListener('keydown', key);
    root.removeEventListener('pointerdown', down);
    root.removeEventListener('pointerup', up);
    removeEventListener('hashchange', hash);
    resized.disconnect();
  };
});
