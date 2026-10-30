// bubble: behaviour. Query only inside root; talk outward with bubbling events on root.
// The tools: bookmark and copy; the thumbs are their own (thumbs.js), and the bubble names their rating with its id.
// What a bookmark or a rating means is the app's: the bubble only says what changed.
register('bubble', root => {
  const tools = root.querySelector('.aj-c-bubble__tools');
  if (!tools) return () => {};
  let copied;

  const press = event => {
    const b = event.target.closest('[data-tool]');
    if (!b || !tools.contains(b)) return;
    const k = b.dataset.tool;
    if (k === 'bookmark') {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      root.dispatchEvent(new CustomEvent('bubble:bookmark', { bubbles: true, detail: { id: root.id, on } }));
    } else if (k === 'copy') {
      const words = root.querySelector('[data-hook~="text"]');
      try { navigator.clipboard?.writeText(words ? words.innerText.trim() : '').catch(() => {}); } catch {}
      b.setAttribute('data-copied', tools.dataset.copiedLabel || 'Copied');
      clearTimeout(copied); copied = setTimeout(() => b.removeAttribute('data-copied'), 1400);
      root.dispatchEvent(new CustomEvent('bubble:copy', { bubbles: true, detail: { id: root.id } }));
    }
  };
  const rated = event => root.dispatchEvent(new CustomEvent('bubble:rate', { bubbles: true, detail: { id: root.id, ...event.detail } }));

  tools.addEventListener('click', press);
  tools.addEventListener('thumbs:rate', rated);
  return () => {
    clearTimeout(copied);
    tools.removeEventListener('click', press);
    tools.removeEventListener('thumbs:rate', rated);
  };
});
