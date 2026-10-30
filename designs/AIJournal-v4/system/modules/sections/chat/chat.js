// chat: behaviour. Query only inside root; talk outward with bubbling events on root.
// The composer's height keeps the bubbles' thumbs-down form clear of it (data-floor) and a jump clear of it
// (--aj-s-chat-foot); Enter sends (Shift+Enter is a new line); the head's New and Today, the lead's questions and the
// send are announced for the app. The app sets data-jump to land on a message, which arrives as the Timeline's day
// does (C1's wash and frame, in the bubble's shape); while an answer is written in the thread follows it, if the
// reader was at the end.
register('chat', root => {
  const foot = root.querySelector('[data-place~="foot"]');
  const thread = root.querySelector('[data-hook~="thread"]');
  // the app replaces the thread's and the composer's contents when a day opens: the field is found when it is needed
  const field = () => foot && foot.querySelector('[data-hook~="input"]');
  const reduced = () => !root.closest('[data-motion-review="play"]') && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let height = 0;
  const floor = () => { for (const b of root.querySelectorAll('[data-module="bubble"]')) b.dataset.floor = String(height); };
  const sized = new ResizeObserver(() => { height = Math.round(foot.getBoundingClientRect().height); root.style.setProperty('--aj-s-chat-foot', `${height + 16}px`); floor(); });
  if (foot) sized.observe(foot);

  // while an answer is written in, keep its end in view, unless the reader has scrolled away
  const last = () => [...root.querySelectorAll('[data-module="bubble"]')].pop();
  let pinned = true;
  const measure = () => { const b = last(); pinned = !b || b.getBoundingClientRect().bottom <= innerHeight - height + 140; };
  const follow = new MutationObserver(records => {
    if (records.some(r => r.type === 'childList' && [...r.addedNodes].some(n => n.nodeType === 1 && n.matches('[data-module="bubble"]')))) floor();
    if (pinned && root.querySelector('[data-module="bubble"][data-status]')) last()?.scrollIntoView({ block: 'end' });
  });
  if (thread) follow.observe(thread, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-status'] });
  addEventListener('scroll', measure, { passive: true });

  // a jump: the app names the message; the chat brings it into view and focuses it, waits for the scroll to end,
  // then it arrives as the Timeline's day does (f-wash-and-frame): a wash in --rule passes through it once, in from
  // the left and out to the right, and a frame is drawn round it as with a pen, in the bubble's own shape, and held
  // until the next jump or the message leaves the thread (a day opening, New). A newer jump wins.
  const doc = root.ownerDocument, SVG = 'http://www.w3.org/2000/svg';
  const ms = name => parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  const layer = doc.createElement('div');
  layer.className = 'aj-s-chat__marks'; layer.setAttribute('aria-hidden', 'true');
  let framed = null, frame = null, timer = 0, ticket = 0;
  const shape = m => m.querySelector('.aj-c-bubble__in') || m;
  const leave = () => { clearTimeout(timer); framed = null; frame = null; layer.replaceChildren(); };
  // the frame: the bubble's outline 3px out, its corners (and the tail's) followed
  const place = () => {
    if (!frame) return;
    if (!framed.isConnected) return leave();
    const s = shape(framed), cs = getComputedStyle(s), box = thread.getBoundingClientRect(), b = s.getBoundingClientRect(), o = 3, p = 1.25;
    const w = b.width + 2 * o, h = b.height + 2 * o;
    const [tl, tr, br, bl] = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(k => (parseFloat(cs[`border${k}Radius`]) || 0) + o - p);
    Object.assign(frame.style, { left: `${b.left - box.left - o}px`, top: `${b.top - box.top - o}px`, width: `${w}px`, height: `${h}px` });
    frame.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const x = p, y = p, W = w - 2 * p, H = h - 2 * p, a = r => `A${r} ${r} 0 0 1`;
    frame.firstChild.setAttribute('d', `M${x + tl} ${y}H${x + W - tr}${a(tr)} ${x + W} ${y + tr}V${y + H - br}${a(br)} ${x + W - br} ${y + H}H${x + bl}${a(bl)} ${x} ${y + H - bl}V${y + tl}${a(tl)} ${x + tl} ${y}Z`);
  };
  const arrive = m => {
    leave();
    framed = m;
    // the layer lives in the thread (its positioned box): a day opening may have carried it away with the thread's contents
    if (layer.parentNode !== thread) thread.append(layer);
    const s = shape(m), cs = getComputedStyle(s), box = thread.getBoundingClientRect(), b = s.getBoundingClientRect();
    const wash = doc.createElement('div');
    wash.className = 'aj-s-chat__wash';
    Object.assign(wash.style, { left: `${b.left - box.left}px`, top: `${b.top - box.top}px`, width: `${b.width}px`, height: `${b.height}px`, borderRadius: cs.borderRadius });
    frame = doc.createElementNS(SVG, 'svg');
    frame.setAttribute('class', 'aj-s-chat__frame');
    const path = doc.createElementNS(SVG, 'path');
    path.setAttribute('pathLength', '1');
    frame.append(path);
    layer.append(wash, frame);
    place();
    timer = setTimeout(() => wash.remove(), ms('--g-wash') + 50);
  };
  const jump = () => {
    const id = root.dataset.jump; if (!id) return;
    root.removeAttribute('data-jump');
    const m = [...root.querySelectorAll('[data-module="bubble"]')].find(b => b.id === id); if (!m || !thread) return;
    const mine = ++ticket;
    leave();
    let moved = false, landed = false;
    const scrolled = () => { moved = true; };
    const land = () => {
      if (landed || mine !== ticket) return; landed = true;
      doc.removeEventListener('scroll', scrolled, true); doc.removeEventListener('scrollend', land, true);
      arrive(m);
    };
    doc.addEventListener('scroll', scrolled, { capture: true, passive: true });
    m.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    m.focus({ preventScroll: true });
    if (reduced()) { requestAnimationFrame(land); return; }
    // already in place: nothing scrolls, so it arrives at once; otherwise when the scroll ends (or 1.4s)
    doc.addEventListener('scrollend', land, { capture: true });
    setTimeout(() => { if (!moved) land(); }, 120);
    setTimeout(land, 1400);
  };
  // the layout moves (a resize, a message written in above it, a form opening): the frame follows; it goes with
  // its message
  const moves = new ResizeObserver(place);
  moves.observe(root);
  const gone = new MutationObserver(() => { if (framed && !framed.isConnected) leave(); else place(); });
  if (thread) gone.observe(thread, { childList: true, subtree: true });
  const asked = new MutationObserver(jump);
  asked.observe(root, { attributes: true, attributeFilter: ['data-jump'] });

  const click = event => {
    const t = event.target.closest('[data-hook]'); if (!t || !root.contains(t)) return;
    const hook = t.dataset.hook.split(' ');
    if (hook.includes('new')) root.dispatchEvent(new CustomEvent('chat:new', { bubbles: true }));
    else if (hook.includes('today') && t.tagName === 'BUTTON') root.dispatchEvent(new CustomEvent('chat:today', { bubbles: true }));
    else if (hook.includes('ask')) root.dispatchEvent(new CustomEvent('chat:ask', { bubbles: true, detail: { text: t.textContent.trim(), suggested: true } }));
  };
  const submit = event => {
    if (!foot || event.target !== foot) return;
    event.preventDefault();
    const f = field(), text = f ? f.value.trim() : '';
    if (!text) { f?.focus(); return; }
    f.value = '';
    root.dispatchEvent(new CustomEvent('chat:ask', { bubbles: true, detail: { text } }));
  };
  const key = event => { if (event.target === field() && event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); foot.requestSubmit(); } };
  root.addEventListener('click', click);
  root.addEventListener('submit', submit);
  root.addEventListener('keydown', key);
  jump();
  return () => {
    sized.disconnect(); follow.disconnect(); asked.disconnect(); moves.disconnect(); gone.disconnect();
    ticket++; leave(); layer.remove();
    removeEventListener('scroll', measure);
    root.removeEventListener('click', click); root.removeEventListener('submit', submit); root.removeEventListener('keydown', key);
  };
});
