// rateform: behaviour. Query only inside root; talk outward with bubbling events on root.
// Send (Enter) and cancel (Escape) are announced; showing, placing and clearing the form are the parent's (the thumbs).
register('rateform', root => {
  const field = root.querySelector('[data-hook~="input"]');
  const submit = event => { event.preventDefault(); root.dispatchEvent(new CustomEvent('rateform:send', { bubbles: true, detail: { why: field ? field.value.trim() : '' } })); };
  const cancel = () => root.dispatchEvent(new CustomEvent('rateform:cancel', { bubbles: true }));
  const key = event => {
    if (event.key === 'Escape') { event.stopPropagation(); cancel(); }
  };
  root.addEventListener('submit', submit);
  root.addEventListener('keydown', key);
  return () => { root.removeEventListener('submit', submit); root.removeEventListener('keydown', key); };
});
