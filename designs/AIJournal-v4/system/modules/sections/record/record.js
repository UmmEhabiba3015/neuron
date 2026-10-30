register('record', root => {
  const sheet = root.querySelector('.aj-s-record__sheet');
  const layer = root.querySelector('.aj-s-record__marks');
  if (!sheet || !layer) return;
  const doc = root.ownerDocument;
  const page = root.closest('html');
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches && page.dataset.motionReview !== 'play';
  const SVG = 'http://www.w3.org/2000/svg';
  const style = getComputedStyle(root);
  const ms = name => parseFloat(style.getPropertyValue(name)) || 0;
  const shown = el => el.getClientRects().length > 0;
  // Where the list scrolls: the top of its scroller (a walkthrough's reader below the pinned header), or the
  // window's (0; the document's own scroller is the window's, though html may compute overflow auto). Measurements
  // of where a row sits are taken from there.
  const edge = () => {
    for (let el = root.parentElement; el && el !== doc.scrollingElement && el !== doc.body; el = el.parentElement) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return el.getBoundingClientRect().top;
    }
    return 0;
  };
  const firstRows = () => [...sheet.querySelectorAll(':scope > [data-day]')].filter((r, i, all) => all.findIndex(x => x.dataset.day === r.dataset.day) === i);

  // The arrival (f-wash-and-frame): C's wash passes through every row of the days, each in its day's mood; E's
  // frame is drawn round them, one frame round each run of neighbouring days (a frame per day would double the
  // lines between them), and stays, with each date in its day's mood colour, until the next jump or leaving the
  // page. It follows the days when the layout moves, and hides while a search hides them.
  let rows = [], frames = [], timer = 0, ticket = 0;
  const leave = () => {
    clearTimeout(timer);
    for (const r of rows) r.removeAttribute('data-framed');
    rows = []; frames = []; layer.replaceChildren();
  };
  const place = () => {
    const box = root.getBoundingClientRect(), o = 3;
    for (const { svg, run } of frames) {
      const seen = run.filter(shown);
      svg.style.display = seen.length ? '' : 'none';
      if (!seen.length) continue;
      const a = seen[0].getBoundingClientRect(), b = seen[seen.length - 1].getBoundingClientRect();
      const w = a.width + 2 * o, h = b.bottom - a.top + 2 * o;
      Object.assign(svg.style, { left: `${a.left - box.left - o}px`, top: `${a.top - box.top - o}px`, width: `${w}px`, height: `${h}px` });
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.firstChild.setAttribute('width', w - 2.5);
      svg.firstChild.setAttribute('height', h - 2.5);
    }
  };
  const arrive = days => {
    leave();
    const all = [...sheet.querySelectorAll(':scope > [data-day]')];
    rows = all.filter(r => days.includes(r.dataset.day));
    if (!rows.length) return;
    const mood = day => all.find(r => r.dataset.day === day && r.dataset.mood)?.dataset.mood || 'even';
    const box = root.getBoundingClientRect();
    rows.forEach((r, i) => {
      r.setAttribute('data-framed', mood(r.dataset.day));
      const b = r.getBoundingClientRect(), wash = doc.createElement('div');
      wash.className = 'aj-s-record__wash';
      wash.dataset.mood = mood(r.dataset.day);
      wash.style.cssText = `left:${b.left - box.left}px;top:${b.top - box.top}px;width:${b.width}px;height:${b.height}px;--aj-s-record-i:${i}`;
      layer.append(wash);
    });
    // a run: framed rows with nothing between them in the sheet but hidden ones
    const runs = [];
    let run = null;
    for (const child of sheet.children) {
      if (child.hasAttribute('data-framed')) { if (!run) runs.push(run = []); run.push(child); }
      else if (!child.hidden) run = null;
    }
    frames = runs.map(r => {
      const svg = doc.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'aj-s-record__frame');
      const rect = doc.createElementNS(SVG, 'rect');
      for (const [k, v] of Object.entries({ x: 1.25, y: 1.25, rx: 2, pathLength: 1 })) rect.setAttribute(k, v);
      svg.append(rect);
      layer.append(svg);
      return { svg, run: r };
    });
    place();
    // The wash is gone once the last row's has passed; the frame and the date stay.
    const done = [...layer.querySelectorAll('.aj-s-record__wash')];
    timer = setTimeout(() => done.forEach(n => n.remove()), ms('--g-wash') + rows.length * ms('--g-wash-step') + 50);
  };

  // The jump (the app sets data-jump: the card's day, or a reflection's days, space-separated): scroll to the first
  // of their rows, wait for the scroll to end, then arrive. Already in place, or under reduced motion: at once. A
  // newer jump wins.
  const jump = () => {
    const days = (root.dataset.jump || '').split(/\s+/).filter(Boolean);
    if (!days.length) return;
    delete root.dataset.jump;
    const target = firstRows().find(r => days.includes(r.dataset.day));
    if (!target) return;
    const mine = ++ticket;
    leave();
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const still = Math.abs(target.getBoundingClientRect().top - edge() - margin) < 4;
    target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    if (target.id) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    let landed = false;
    const land = () => { if (landed || mine !== ticket) return; landed = true; doc.removeEventListener('scrollend', land, true); arrive(days); };
    if (still || reduced()) requestAnimationFrame(land);
    else { doc.addEventListener('scrollend', land, { capture: true }); setTimeout(land, 1400); }
  };
  const asked = new MutationObserver(jump);
  asked.observe(root, { attributes: true, attributeFilter: ['data-jump'] });

  // The day in view: the first day whose rows reach below the floating search. The app passes it to the card.
  let last = null, queued = 0;
  const check = () => {
    queued = 0;
    const firsts = firstRows().filter(shown);
    if (!firsts.length) return;
    const band = edge() + (parseFloat(getComputedStyle(firsts[0]).scrollMarginTop) || 0) + 44;
    const days = firsts.map(r => r.dataset.day);
    const all = [...sheet.querySelectorAll(':scope > [data-day]')].filter(shown);
    const inView = days.find(d => { const mine = all.filter(r => r.dataset.day === d); return mine[mine.length - 1].getBoundingClientRect().bottom > band; }) || days[days.length - 1];
    if (inView !== last) { last = inView; root.dispatchEvent(new CustomEvent('record:day', { bubbles: true, detail: { date: inView } })); }
  };
  const onScroll = () => { if (!queued) queued = requestAnimationFrame(check); };

  // The layout moves (a resize, a search hiding rows): the frame follows, the day in view is read again.
  const moved = () => { place(); onScroll(); };
  const resized = new ResizeObserver(moved);
  resized.observe(sheet);
  const hidden = new MutationObserver(moved);
  hidden.observe(sheet, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  doc.addEventListener('scroll', onScroll, { capture: true, passive: true });

  onScroll();
  if (root.dataset.jump) requestAnimationFrame(jump);

  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(queued);
    asked.disconnect(); resized.disconnect(); hidden.disconnect();
    doc.removeEventListener('scroll', onScroll, { capture: true });
    ticket++;
    leave();
  };
});
