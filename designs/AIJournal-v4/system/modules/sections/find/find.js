register('find', root => {
  // The pill only (v4 C1): Ask's row has no behaviour of its own.
  if (root.dataset.form !== 'pill') return;
  const input = root.querySelector('.aj-s-find__bar input');
  const clear = root.querySelector('.aj-s-find__clear');
  const mode = root.querySelector('[data-place~="mode"]');
  const retry = root.querySelector('[data-place~="retry"]');
  if (!input || !clear || !mode) return;
  const doc = root.ownerDocument;
  const hints = { keyword: root.dataset.hintKeyword || input.placeholder, meaning: root.dataset.hintMeaning || input.placeholder };

  // What the person asked for: the app runs the search, fills the found line and sets data-status.
  const send = () => root.dispatchEvent(new CustomEvent('find:search', { bubbles: true, detail: { query: input.value.trim(), mode: root.dataset.mode } }));
  const onInput = () => { clear.hidden = !input.value; send(); };
  const onClear = () => { input.value = ''; clear.hidden = true; send(); input.focus(); };
  const onMode = () => {
    const meaning = mode.getAttribute('aria-checked') !== 'true';
    mode.setAttribute('aria-checked', String(meaning));
    root.dataset.mode = meaning ? 'meaning' : 'keyword';
    input.placeholder = hints[root.dataset.mode];
    send();
  };

  // Stuck: the list has scrolled past the pill's resting place, so it floats over the rows. It is stuck when it
  // sits at its sticky top and its scroller has moved (at rest, on the desktop, its place is that same line).
  let scroller = null, queued = 0;
  const find = () => {
    for (let el = root.parentElement; el; el = el.parentElement) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return el;
    }
    return doc.scrollingElement;
  };
  const check = () => {
    queued = 0;
    scroller ??= find();
    const top = parseFloat(getComputedStyle(root).top) || 0;
    const edge = scroller === doc.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
    root.toggleAttribute('data-stuck', scroller.scrollTop > 0 && root.getBoundingClientRect().top - edge <= top + 0.5);
  };
  const onScroll = () => { if (!queued) queued = requestAnimationFrame(check); };
  const onResize = () => { scroller = null; onScroll(); };

  input.addEventListener('input', onInput);
  clear.addEventListener('click', onClear);
  mode.addEventListener('click', onMode);
  retry?.addEventListener('click', send);
  // A stuck state rendered as such (a comp, a catalogue fixture) is a still: the scroll never decides it.
  const still = root.hasAttribute('data-stuck');
  if (!still) {
    doc.addEventListener('scroll', onScroll, { capture: true, passive: true });
    addEventListener('resize', onResize);
    onScroll();
  }

  return () => {
    cancelAnimationFrame(queued);
    input.removeEventListener('input', onInput);
    clear.removeEventListener('click', onClear);
    mode.removeEventListener('click', onMode);
    retry?.removeEventListener('click', send);
    doc.removeEventListener('scroll', onScroll, { capture: true });
    removeEventListener('resize', onResize);
  };
});
