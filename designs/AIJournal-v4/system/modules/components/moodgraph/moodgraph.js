register('moodgraph', root => {
  // A point is a way to its day: the graph only says which day; the page scrolls to it and draws the arrival.
  const press = event => {
    const point = event.target.closest('.aj-c-moodgraph__point');
    if (!point || !root.contains(point)) return;
    root.dispatchEvent(new CustomEvent('moodgraph:pick', { bubbles: true, detail: { date: point.dataset.date } }));
  };
  // The day in view is the parent's (data-current): the ring follows it, and leaves the week when it does.
  const ring = () => {
    for (const dot of root.querySelectorAll('.aj-c-moodgraph__dot')) dot.toggleAttribute('data-current', dot.dataset.date === root.dataset.current);
  };
  const follow = new MutationObserver(ring);
  follow.observe(root, { attributes: true, attributeFilter: ['data-current'] });
  root.addEventListener('click', press);
  return () => { follow.disconnect(); root.removeEventListener('click', press); };
});
