// thumbs: behaviour. Query only inside root; talk outward with bubbling events on root.
// One at a time: up toggles and clears down; a filled down pressed returns to none; an empty down opens its form
// (the rateform) where there is room. What a rating means is the app's: the thumbs only say what changed.
register('thumbs', root => {
  const up = root.querySelector(':scope > [data-tool="up"]'), down = root.querySelector(':scope > [data-tool="down"]');
  const form = root.querySelector(':scope > [data-place~="rate"]');
  if (!up || !down) return () => {};
  const isOn = b => b.getAttribute('aria-pressed') === 'true';
  const set = (b, on) => b.setAttribute('aria-pressed', String(on));
  const rating = () => isOn(up) ? 'up' : isOn(down) ? 'down' : 'none';
  const rated = why => root.dispatchEvent(new CustomEvent('thumbs:rate', { bubbles: true, detail: { rating: rating(), ...(why === undefined ? {} : { why }) } }));
  const field = () => form && form.querySelector('[data-hook~="input"]');

  const close = focus => {
    if (!form || form.hidden) return;
    form.hidden = true;
    down.setAttribute('aria-expanded', 'false');
    if (field()) field().value = '';
    if (focus) down.focus();
  };
  // in the row after the thumbs down; scrolled clear of the floor (data-floor, px of the screen's bottom covered,
  // e.g. Ask's composer, read from the nearest message that has one) when it opens under it
  const open = () => {
    form.hidden = false;
    down.setAttribute('aria-expanded', 'true');
    const floor = innerHeight - (Number(root.closest('[data-floor]')?.dataset.floor) || 0);
    const over = form.getBoundingClientRect().bottom - (floor - 8);
    if (over > 0) scrollBy(0, over);
    if (field()) field().focus({ preventScroll: true });
  };

  const press = event => {
    const b = event.target.closest('[data-tool]');
    if (b === up) {
      set(up, !isOn(up)); if (isOn(up)) set(down, false);
      close(false); rated();
    } else if (b === down) {
      if (isOn(down)) { set(down, false); rated(); }
      else if (form && !form.hidden) close(true);
      else if (form) open();
    }
  };
  const sent = event => { set(down, true); set(up, false); close(true); rated(event.detail?.why ?? ''); };
  const cancelled = () => close(true);
  // a press anywhere outside the open form (and its thumb) closes it
  const outside = event => { if (form && !form.hidden && !form.contains(event.target) && !down.contains(event.target)) close(false); };

  root.addEventListener('click', press);
  root.addEventListener('rateform:send', sent);
  root.addEventListener('rateform:cancel', cancelled);
  document.addEventListener('pointerdown', outside);
  return () => {
    root.removeEventListener('click', press);
    root.removeEventListener('rateform:send', sent);
    root.removeEventListener('rateform:cancel', cancelled);
    document.removeEventListener('pointerdown', outside);
  };
});
