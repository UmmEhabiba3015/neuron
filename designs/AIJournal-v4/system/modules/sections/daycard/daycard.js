register('daycard', root => {
  const dateButton = root.querySelector('.aj-s-daycard__date');
  const value = root.querySelector('[data-hook="date"]');
  const sheet = root.querySelector('.aj-s-daycard__cal');
  const toggle = root.querySelector('.aj-s-daycard__toggle');
  const weekName = root.querySelector('[data-hook="week"]');
  const panel = root.querySelector('.aj-s-daycard__panel');
  const [earlier, later] = ['-1', '1'].map(d => root.querySelector(`.aj-s-daycard__step[data-step="${d}"]`));
  const strips = [...root.querySelectorAll('.aj-s-daycard__strip')];
  const graphs = [...root.querySelectorAll('.aj-s-daycard__graph')];
  const cal = sheet?.querySelector('[data-module~="cal"]');
  if (!dateButton || !sheet || !toggle || !panel) return;
  const doc = root.ownerDocument;
  const weeks = strips.map(s => s.dataset.week);

  // The shown week: its strip and its graph; the arrows step to the next week rendered (weeks with nothing
  // written are not rendered, so they are skipped), and say when there is none that way.
  let at = Math.max(0, strips.findIndex(s => !s.hidden));
  const show = i => {
    if (i < 0 || i >= weeks.length) return;
    at = i;
    strips.forEach((s, k) => { s.hidden = k !== i; });
    graphs.forEach((g, k) => { g.hidden = k !== i; });
    if (weekName) weekName.textContent = strips[i].dataset.name || '';
    if (earlier) earlier.disabled = i === 0;
    if (later) later.disabled = i === weeks.length - 1;
  };
  const monday = date => { const t = new Date(date + 'T00:00:00Z'), w = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - w); return t.toISOString().slice(0, 10); };

  // The mood panel and the calendar: both closed by default, each inert while closed.
  const setMood = open => {
    toggle.setAttribute('aria-expanded', String(open));
    root.toggleAttribute('data-mood-open', open);
    panel.inert = !open;
  };
  let calOpen = root.hasAttribute('data-cal-open');
  const setCal = (open, { focus = true } = {}) => {
    calOpen = open;
    dateButton.setAttribute('aria-expanded', String(open));
    root.toggleAttribute('data-cal-open', open);
    sheet.inert = !open;
    if (open) sheet.focus({ preventScroll: true });
    else if (focus) dateButton.focus({ preventScroll: true });
  };

  // Every way to a day is one jump: the app scrolls the record to it (data-jump) and the record draws the arrival.
  const jump = date => {
    if (!date) return;
    const w = weeks.indexOf(monday(date));
    if (w >= 0) show(w);
    root.dispatchEvent(new CustomEvent('daycard:jump', { bubbles: true, detail: { date } }));
  };

  // The day in view is the app's (data-day, from the record as the list scrolls): the date follows it, and so do
  // the rings in the graphs and the calendar. The date is written as the masthead writes it: "Sun 9 Aug '26".
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const choose = (dateButton.getAttribute('aria-label') || '').split('. ').pop();
  const follow = () => {
    const date = root.dataset.day;
    if (!/^\d{4}-\d\d-\d\d$/.test(date || '')) return;
    const t = new Date(date + 'T00:00:00Z'), d = t.getUTCDate(), w = t.getUTCDay(), m = t.getUTCMonth();
    if (value) value.textContent = `${DOW[w]} ${d} ${MON[m]} '${String(t.getUTCFullYear()).slice(2)}`;
    dateButton.setAttribute('aria-label', `${DOW_LONG[w]} ${d} ${MON_LONG[m]}. ${choose}`);
    for (const g of root.querySelectorAll('[data-module~="moodgraph"]')) g.dataset.current = date;
    if (cal) cal.dataset.current = date;
  };
  const day = new MutationObserver(follow);
  day.observe(root, { attributes: true, attributeFilter: ['data-day'] });

  const onClick = e => {
    if (e.target.closest('.aj-s-daycard__date')) { setCal(!calOpen); return; }
    if (e.target.closest('.aj-s-daycard__toggle')) { setMood(toggle.getAttribute('aria-expanded') !== 'true'); return; }
    const stepper = e.target.closest('.aj-s-daycard__step');
    if (stepper) { show(at + Number(stepper.dataset.step)); return; }
    const dot = e.target.closest('button.aj-s-daycard__dot');
    if (dot) jump(dot.dataset.date);
  };
  const onPoint = e => jump(e.detail?.date);
  const onPick = e => { setCal(false, { focus: false }); jump(e.detail?.date); };
  const onKey = e => { if (e.key === 'Escape' && calOpen) setCal(false); };
  const onOutside = e => { if (calOpen && !sheet.contains(e.target) && !dateButton.contains(e.target)) setCal(false, { focus: false }); };

  root.addEventListener('click', onClick);
  root.addEventListener('moodgraph:pick', onPoint);
  root.addEventListener('cal:pick', onPick);
  doc.addEventListener('keydown', onKey);
  doc.addEventListener('pointerdown', onOutside);
  setMood(root.hasAttribute('data-mood-open'));
  sheet.inert = !calOpen;
  show(at);
  follow();

  return () => {
    day.disconnect();
    root.removeEventListener('click', onClick);
    root.removeEventListener('moodgraph:pick', onPoint);
    root.removeEventListener('cal:pick', onPick);
    doc.removeEventListener('keydown', onKey);
    doc.removeEventListener('pointerdown', onOutside);
  };
});
