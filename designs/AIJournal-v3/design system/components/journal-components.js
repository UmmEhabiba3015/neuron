/**
 * Framework-neutral behaviour for semantic markup styled by lock.css.
 * The application owns data, persistence and routing; this module owns
 * interaction state, accessibility state and lifecycle cleanup.
 */

const mounted = new WeakMap();

function required(root, selector, name) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Journal ${name} requires ${selector}.`);
  return element;
}

function emit(root, type, detail = {}, options = {}) {
  return root.dispatchEvent(new CustomEvent(type, {
    bubbles: true,
    cancelable: Boolean(options.cancelable),
    detail,
  }));
}

function setPressed(button, pressed) {
  button.setAttribute("aria-pressed", String(pressed));
}

function register(root, name, controller) {
  const existing = mounted.get(root);
  if (existing) return existing;
  root.dataset.journalEnhanced = name;
  mounted.set(root, controller);
  return controller;
}

function teardown(root, abortController) {
  abortController.abort();
  delete root.dataset.journalEnhanced;
  mounted.delete(root);
}

/** Enhance the Today composer without taking persistence away from the app. */
export function createComposer(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);

  const field = required(root, ".field", "composer");
  const mic = required(root, '[data-action="record"]', "composer");
  const send = required(root, '[data-action="save"]', "composer");
  const memory = root.querySelector('[data-action="memory"]');
  const status = root.querySelector("[data-journal-status]");
  const listeners = new AbortController();
  let busy = false;

  if (!(field instanceof HTMLInputElement)) {
    throw new Error("Journal composer .field must be an input in a working application.");
  }
  if (!field.labels?.length && !field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby")) {
    throw new Error("Journal composer .field needs a label; a placeholder is not an accessible name.");
  }

  const setStatus = (message = "") => {
    if (status) status.textContent = message;
  };

  const sync = () => {
    const hasValue = field.value.length > 0;
    mic.hidden = hasValue;
    send.hidden = !hasValue;
    root.dataset.state = hasValue ? "draft" : "empty";
  };

  const setBusy = (next) => {
    busy = next;
    root.setAttribute("aria-busy", String(next));
    send.setAttribute("aria-disabled", String(next));
  };

  field.addEventListener("input", () => {
    setStatus();
    sync();
    emit(root, "journal:draft", { value: field.value });
  }, { signal: listeners.signal });

  mic.addEventListener("click", () => {
    if (options.onRecord) options.onRecord();
    emit(root, "journal:record");
  }, { signal: listeners.signal });

  if (memory) {
    memory.addEventListener("click", () => {
      const pressed = memory.getAttribute("aria-pressed") !== "true";
      setPressed(memory, pressed);
      if (options.onMemoryChange) options.onMemoryChange(pressed);
      emit(root, "journal:memorychange", { excluded: pressed });
    }, { signal: listeners.signal });
  }

  const save = async () => {
    if (busy || field.value.length === 0) return;
    const value = field.value;
    const excluded = memory?.getAttribute("aria-pressed") === "true";
    setBusy(true);
    setStatus(options.savingMessage || "Saving…");

    try {
      let shouldClear = true;
      if (options.onSave) {
        shouldClear = await options.onSave({ value, excluded }) !== false;
      } else {
        shouldClear = emit(root, "journal:save", { value, excluded }, { cancelable: true });
      }
      if (shouldClear) {
        field.value = "";
        setStatus(options.savedMessage || "Saved.");
        sync();
      }
    } catch (error) {
      setStatus(options.errorMessage || "Couldn’t save this entry. Your words are still here; try again.");
      emit(root, "journal:error", { source: "composer", error });
    } finally {
      setBusy(false);
    }
  };

  send.addEventListener("click", save, { signal: listeners.signal });
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      save();
    }
  }, { signal: listeners.signal });

  sync();
  return register(root, "composer", {
    destroy: () => teardown(root, listeners),
    focus: () => field.focus(),
    reset: () => { field.value = ""; setStatus(); sync(); },
    setBusy,
    sync,
  });
}

/** Enhance the five-word mood choice as a single-select pressed-button group. */
export function createMoodChoice(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const buttons = [...root.querySelectorAll(".chips button")];
  if (buttons.length !== 5) throw new Error("Journal mood choice requires exactly five options.");
  const listeners = new AbortController();

  const select = (button, notify = true) => {
    buttons.forEach((candidate) => setPressed(candidate, candidate === button));
    const value = button.dataset.value || button.textContent.trim();
    if (notify) {
      if (options.onChange) options.onChange(value);
      emit(root, "journal:moodchange", { value });
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(button), { signal: listeners.signal });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home" ? 0
        : event.key === "End" ? buttons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      select(buttons[nextIndex]);
    }, { signal: listeners.signal });
  });

  return register(root, "mood", {
    destroy: () => teardown(root, listeners),
    select: (value) => {
      const button = buttons.find((item) => (item.dataset.value || item.textContent.trim()) === value);
      if (button) select(button, false);
    },
  });
}

/** Switch Timeline's two views in-place; this never writes a history entry. */
export function createTimelineView(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const buttons = [...root.querySelectorAll("[data-view]")];
  if (buttons.length !== 2) throw new Error("Journal Timeline view requires exactly two controls.");
  const panels = new Map(
    [...root.querySelectorAll("[data-view-panel]")].map((panel) => [panel.dataset.viewPanel, panel]),
  );
  const listeners = new AbortController();

  const select = (value, notify = true) => {
    buttons.forEach((button) => setPressed(button, button.dataset.view === value));
    panels.forEach((panel, key) => { panel.hidden = key !== value; });
    root.dataset.activeView = value;
    if (notify) {
      if (options.onChange) options.onChange(value);
      emit(root, "journal:viewchange", { value });
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(button.dataset.view), { signal: listeners.signal });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const next = buttons[(index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length];
      next.focus();
      select(next.dataset.view);
    }, { signal: listeners.signal });
  });

  const initial = options.initialView
    || buttons.find((button) => button.getAttribute("aria-pressed") === "true")?.dataset.view
    || buttons[0].dataset.view;
  select(initial, false);

  return register(root, "timeline-view", {
    destroy: () => teardown(root, listeners),
    select: (value) => select(value, false),
  });
}

/** Make the desktop calendar an in-screen index, not a navigation event. */
export function createCalendarIndex(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const days = [...root.querySelectorAll("[data-date]")];
  const listeners = new AbortController();

  const select = (control) => {
    const date = control.dataset.date;
    days.forEach((day) => {
      if (day instanceof HTMLButtonElement) setPressed(day, day === control);
      else if (day === control) day.setAttribute("aria-current", "date");
      else day.removeAttribute("aria-current");
    });

    const target = control.dataset.target
      ? root.ownerDocument.getElementById(control.dataset.target)
      : root.ownerDocument.querySelector(`[data-entry-date="${CSS.escape(date)}"]`);
    target?.scrollIntoView({ block: "start", behavior: "auto" });
    if (options.onSelect) options.onSelect(date, target || null);
    emit(root, "journal:dateselect", { date, target: target || null });
  };

  days.forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      select(control);
    }, { signal: listeners.signal });
  });

  return register(root, "calendar", {
    destroy: () => teardown(root, listeners),
    select: (date) => {
      const control = days.find((day) => day.dataset.date === date);
      if (control) select(control);
    },
  });
}

/** Bind Journal's play control to a real HTMLAudioElement. */
export function createAudioControl(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const button = root.matches(".play") ? root : required(root, ".play", "audio control");
  const audio = options.audio || (options.src ? new Audio(options.src) : null);
  if (!audio) throw new Error("Journal audio control requires an audio element or src.");
  const listeners = new AbortController();
  const baseLabel = button.getAttribute("aria-label") || "Play recording";

  const sync = () => {
    const playing = !audio.paused && !audio.ended;
    setPressed(button, playing);
    button.setAttribute("aria-label", playing ? baseLabel.replace(/^Play/, "Pause") : baseLabel.replace(/^Pause/, "Play"));
  };

  button.addEventListener("click", async () => {
    try {
      if (audio.paused || audio.ended) await audio.play();
      else audio.pause();
    } catch (error) {
      emit(root, "journal:error", { source: "audio", error });
    }
  }, { signal: listeners.signal });
  audio.addEventListener("play", sync, { signal: listeners.signal });
  audio.addEventListener("pause", sync, { signal: listeners.signal });
  audio.addEventListener("ended", sync, { signal: listeners.signal });
  audio.addEventListener("error", () => emit(root, "journal:error", { source: "audio", error: audio.error }), {
    signal: listeners.signal,
  });
  sync();

  return register(root, "audio", {
    audio,
    destroy: () => { audio.pause(); teardown(root, listeners); },
  });
}

/** Wire destination links to an application router without owning that router. */
export function createNavigation(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const listeners = new AbortController();
  const links = [...root.querySelectorAll("a[href]")];

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!options.navigate || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      options.navigate(link.getAttribute("href"), { replace: false });
    }, { signal: listeners.signal });
  });

  return register(root, "navigation", {
    destroy: () => teardown(root, listeners),
    setCurrent: (href) => links.forEach((link) => {
      if (link.getAttribute("href") === href) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }),
  });
}

/** Close a pushed page through the app router, preserving the existing screen. */
export function createBackControl(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const listeners = new AbortController();
  root.addEventListener("click", (event) => {
    if (!options.onBack) return;
    event.preventDefault();
    options.onBack();
  }, { signal: listeners.signal });
  return register(root, "back", { destroy: () => teardown(root, listeners) });
}

/** Add focus management and Escape handling to the single approved dialog. */
export function createDialog(root, options = {}) {
  if (mounted.has(root)) return mounted.get(root);
  const listeners = new AbortController();
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let returnFocus = null;

  const close = (reason = "cancel") => {
    if (root instanceof HTMLDialogElement && root.open) root.close(reason);
    else root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    returnFocus?.focus?.();
    if (options.onClose) options.onClose(reason);
    emit(root, "journal:dialogclose", { reason });
  };

  const open = (trigger = root.ownerDocument.activeElement) => {
    returnFocus = trigger;
    root.removeAttribute("aria-hidden");
    if (root instanceof HTMLDialogElement && root.showModal) root.showModal();
    else root.hidden = false;
    queueMicrotask(() => root.querySelector("[autofocus]")?.focus()
      || root.querySelector(focusableSelector)?.focus());
    emit(root, "journal:dialogopen");
  };

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-dialog-action]")?.dataset.dialogAction;
    if (action === "cancel") close("cancel");
    if (action === "confirm") {
      if (options.onConfirm) options.onConfirm();
      emit(root, "journal:confirm");
      close("confirm");
    }
  }, { signal: listeners.signal });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close("escape");
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...root.querySelectorAll(focusableSelector)].filter((item) => !item.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && root.ownerDocument.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && root.ownerDocument.activeElement === last) { event.preventDefault(); first.focus(); }
  }, { signal: listeners.signal });

  return register(root, "dialog", { close, destroy: () => teardown(root, listeners), open });
}

/** Enhance every declarative Journal runtime component under a root node. */
export function mountJournalComponents(root = document, options = {}) {
  const controllers = [];
  const definitions = [
    ["composer", createComposer],
    ["mood", createMoodChoice],
    ["timeline-view", createTimelineView],
    ["calendar", createCalendarIndex],
  ];

  definitions.forEach(([name, factory]) => {
    root.querySelectorAll(`[data-journal-component="${name}"]`).forEach((element) => {
      controllers.push(factory(element, options[name] || {}));
    });
  });

  return {
    controllers,
    destroy: () => controllers.forEach((controller) => controller.destroy()),
  };
}
