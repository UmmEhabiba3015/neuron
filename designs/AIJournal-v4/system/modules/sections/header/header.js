register('header', root => {
  const mast = root.querySelector('[data-place~="head"]');
  const nav = root.querySelector('[data-place~="nav"]');
  const brand = root.querySelector('.aj-s-header__brand');
  const date = root.querySelector('.aj-s-header__date');
  const core = date?.querySelector('.aj-s-header__core');
  if (!mast || !nav || !brand) return;
  const brandMarker = mast.querySelector('h1[data-held]');
  const dateMarker = date ? mast.querySelector('[data-held]:not(h1)') : null;
  const slot = nav.querySelector('.aj-c-dest__slot');
  const page = root.closest('html');
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches && page.dataset.motionReview !== 'play';
  const visible = () => root.getClientRects().length > 0;
  let geometry = null, measured = false, lastWidth = 0, gone = false;

  // The quiet navbar's layout, from the values it has always had: measure the masthead in its
  // expanded state once, then place the compact wordmark and date and set the header's own height.
  function layout(animate) {
    const compact = root.dataset.reading === 'away';
    const links = [...nav.querySelectorAll('a')];
    if (root.clientWidth < 600 && links.some(link => parseFloat(getComputedStyle(link).fontSize) > 16)) root.dataset.type = 'large';
    else delete root.dataset.type;
    if (!animate || reduced()) root.dataset.tween = 'off';
    else delete root.dataset.tween;
    if (!animate || !geometry) {
      root.dataset.state = 'expanded';
      const h = root.getBoundingClientRect(), b = brandMarker.getBoundingClientRect(), d = dateMarker?.getBoundingClientRect(), ds = dateMarker && getComputedStyle(dateMarker);
      geometry = { mastHeight: mast.getBoundingClientRect().height, navHeight: nav.getBoundingClientRect().height, brandX: b.left - h.left, brandY: b.top - h.top, dateX: d ? d.left - h.left + parseFloat(ds.paddingLeft) : 0, dateY: d ? d.top - h.top + parseFloat(ds.paddingTop) : 0 };
      measured = true;
      lastWidth = root.offsetWidth;
    }
    const h = root.getBoundingClientRect(), g = geometry;
    root.dataset.state = compact ? 'compact' : 'expanded';
    mast.style.opacity = compact ? '0' : '1';
    mast.inert = compact;
    const navY = compact ? 8 : g.mastHeight;
    if (date) {
      let x = g.dateX, y = g.dateY, scale = Math.min(1, Math.max(1, h.width - g.dateX - 14) / date.scrollWidth);
      if (compact) {
        // Full, short or none (v4 B7): the full date where it fits at its compact size (18px: tablets), else its
        // core (9 Aug) alone while its edges fade, if that reaches the destinations' size (at most 12px, the
        // readable floor), else no date in this row.
        const s = slot.getBoundingClientRect(), size = parseFloat(getComputedStyle(date).fontSize);
        const floor = Math.min(12, parseFloat(getComputedStyle(links[0]).fontSize));
        const fit = width => Math.min(18 / size, Math.max(1, s.width - 4) / width);
        let width = date.scrollWidth, offset = 0, form = 'full';
        if (fit(width) < 18 / size && core) { width = core.offsetWidth; offset = core.offsetLeft; form = 'short'; }
        scale = fit(width);
        if (scale * size < floor) form = 'none';
        root.dataset.date = form;
        x = s.left - h.left + (s.width - width * scale) / 2 - offset * scale;
        y = navY + s.top - nav.getBoundingClientRect().top + (44 - date.offsetHeight * scale) / 2;
      } else delete root.dataset.date;
      date.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    }
    const height = navY + nav.getBoundingClientRect().height;
    root.style.height = height + 'px';
    nav.style.transform = `translateY(${navY}px)`;
    brand.style.transform = `translate(${g.brandX}px,${g.brandY}px) scale(${Math.min(1, Math.max(1, h.width - g.brandX - 14) / brand.scrollWidth)})`;
    brand.style.opacity = compact ? '0' : '1';
    requestAnimationFrame(() => { if (!gone && !reduced()) delete root.dataset.tween; });
    root.dispatchEvent(new CustomEvent('header:resize', { bubbles: true, detail: { height } }));
  }

  function relayout(animate) {
    if (!visible()) { measured = false; return; }
    layout(animate && measured);
  }

  // data-reading is the app's: home or away. A change tweens once the header has been measured on screen.
  const reading = new MutationObserver(() => relayout(true));
  reading.observe(root, { attributes: true, attributeFilter: ['data-reading'] });
  // Its own resize: a new width, or the first time it is on screen, measures again without a tween.
  const size = new ResizeObserver(() => {
    if (!visible()) { measured = false; return; }
    if (!measured || root.offsetWidth !== lastWidth) layout(false);
  });
  size.observe(root);
  // The date box is the app's: when it writes another date into the masthead's placeholder (Ask opening a past
  // day), the compact date follows, split as the render splits it, and the header measures again.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function follow() {
    const full = dateMarker.textContent.replace(/\s+/g, ' ').trim();
    if (full === date.textContent.replace(/\s+/g, ' ').trim()) return;
    const [, before, middle, after] = full.match(/^(.*?)(\d{1,2}\s+[A-Za-z]{3})(.*)$/) || [, '', full, ''];
    const edges = date.querySelectorAll('.aj-s-header__edge');
    if (edges[0]) edges[0].textContent = before;
    core.textContent = middle;
    if (edges[1]) edges[1].textContent = after;
    const d = full.match(/(\d{1,2})\s*([A-Za-z]{3})\s*['’]?(\d{2,4})/);
    if (d && MONTHS.includes(d[2])) date.setAttribute('datetime', `${d[3].length === 2 ? '20' : ''}${d[3]}-${String(MONTHS.indexOf(d[2]) + 1).padStart(2, '0')}-${d[1].padStart(2, '0')}`);
    relayout(false);
  }
  const written = new MutationObserver(follow);
  if (dateMarker && core) written.observe(dateMarker, { characterData: true, childList: true, subtree: true });
  root.ownerDocument.fonts?.ready.then(() => { if (!gone) relayout(false); });
  relayout(false);

  return () => { gone = true; reading.disconnect(); size.disconnect(); written.disconnect(); };
});
