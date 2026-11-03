register('cal', root => {
  const list = root.querySelector('.aj-c-cal__months');
  const options = [...root.querySelectorAll('.aj-c-cal__month')];
  const pages = [...root.querySelectorAll('.aj-c-cal__page')];
  if (!list || !options.length) return;
  const page = root.closest('html');
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches && page.dataset.motionReview !== 'play';
  let settle = 0;
  let current = options.find(o => o.getAttribute('aria-selected') === 'true') || options[0];

  const centre = (option, smooth) => list.scrollTo({
    top: option.offsetTop - list.clientHeight / 2 + option.offsetHeight / 2,
    behavior: smooth && !reduced() ? 'smooth' : 'auto',
  });

  // Pad the list so the first and last months can reach the centre, then centre the selected one.
  // Runs again whenever the root becomes visible (its parent opens it later).
  const fit = () => {
    if (!list.clientHeight) return;
    list.style.paddingBlock = (list.clientHeight - 40) / 2 + 'px';
    centre(current, false);
  };

  function select(option, { smooth = true, focus = false, scroll = true } = {}) {
    if (option === current) { if (scroll) centre(option, smooth); if (focus) option.focus({ preventScroll: true }); return; }
    current = option;
    for (const o of options) o.setAttribute('aria-selected', String(o === option));
    for (const p of pages) p.hidden = p.dataset.value !== option.dataset.value;
    if (scroll) centre(option, smooth);
    if (focus) option.focus({ preventScroll: true });
    root.dispatchEvent(new CustomEvent('cal:month', { bubbles: true, detail: { value: option.dataset.value } }));
  }

  const onClick = e => {
    const option = e.target.closest('.aj-c-cal__month');
    if (option && list.contains(option)) { select(option); return; }
    const day = e.target.closest('a.aj-c-cal__day');
    if (day && root.contains(day)) {
      e.preventDefault();
      const date = day.dataset.date || (day.getAttribute('href') || '').replace('#d-', '');
      root.dispatchEvent(new CustomEvent('cal:pick', { bubbles: true, detail: { date } }));
    }
  };
  const onKey = e => {
    const step = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = options[options.indexOf(current) + step];
    if (next) select(next, { focus: true });
  };
  const onScroll = () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const mid = list.scrollTop + list.clientHeight / 2;
      const near = options.reduce((a, o) => Math.abs(o.offsetTop + o.offsetHeight / 2 - mid) < Math.abs(a.offsetTop + a.offsetHeight / 2 - mid) ? o : a);
      select(near, { scroll: false });
    }, 120);
  };

  // The day in view is the parent's (data-current): the ring moves to it, and the wheel shows its month.
  const follow = new MutationObserver(() => {
    const date = root.dataset.current || '';
    for (const day of root.querySelectorAll('a.aj-c-cal__day')) day.toggleAttribute('data-current', day.dataset.date === date);
    const option = options.find(o => o.dataset.value === date.slice(0, 7));
    if (option) select(option, { smooth: false });
  });
  follow.observe(root, { attributes: true, attributeFilter: ['data-current'] });
  root.addEventListener('click', onClick);
  list.addEventListener('keydown', onKey);
  list.addEventListener('scroll', onScroll, { passive: true });
  const observer = new ResizeObserver(fit);
  observer.observe(list);
  fit();

  return () => {
    clearTimeout(settle);
    follow.disconnect();
    root.removeEventListener('click', onClick);
    list.removeEventListener('keydown', onKey);
    list.removeEventListener('scroll', onScroll);
    observer.disconnect();
  };
});
