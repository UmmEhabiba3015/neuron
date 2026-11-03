/* Module runtime: calls each module's init(root) for every [data-module] element, on load and
   when elements are added later, and its cleanup when they are removed. The registry is the
   only global a module may touch. A module script registers itself:
     register('notice', root => { ...; return () => { ...cleanup } });
   It queries only inside its root, and talks outward only by dispatching bubbling events on it. */
(function (global, name) {
  'use strict';
  var inits = Object.create(null);
  var live = new WeakMap(); // element -> { moduleName: cleanup }

  function start(el) {
    var names = (el.getAttribute('data-module') || '').split(/\s+/).filter(Boolean);
    var running = live.get(el) || {};
    names.forEach(function (n) {
      if (!inits[n] || running[n]) return;
      var cleanup = inits[n](el);
      running[n] = typeof cleanup === 'function' ? cleanup : function () {};
    });
    live.set(el, running);
  }
  function stop(el) {
    var running = live.get(el);
    if (!running) return;
    Object.keys(running).forEach(function (n) { try { running[n](); } catch (e) { console.error(e); } });
    live.delete(el);
  }
  function each(node, fn) {
    if (node.nodeType !== 1) return;
    if (node.hasAttribute('data-module')) fn(node);
    var found = node.querySelectorAll('[data-module]');
    for (var i = 0; i < found.length; i++) fn(found[i]);
  }
  function init(root) { each(root || document.documentElement, start); }
  function destroy(root) { each(root || document.documentElement, stop); }

  var api = {
    register: function (moduleName, fn) { inits[moduleName] = fn; },
    init: init,
    destroy: destroy
  };
  global[name] = api;

  function boot() {
    init(document.documentElement);
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        r.removedNodes.forEach(function (n) { each(n, stop); });
        r.addedNodes.forEach(function (n) { each(n, start); });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  // Module scripts register after this file runs, so boot once everything has loaded.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})(window, '__GLOBAL__');
