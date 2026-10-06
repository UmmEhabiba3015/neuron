/*
 * A clock the test controls.
 *
 * Only Date is replaced. Everything that waits -- setTimeout, setImmediate,
 * nextTick -- is left real, because the HTTP server, the database driver and
 * the password hash all depend on them, and a suite that fakes them hangs.
 *
 * The application reads the current instant with new Date(), so this is the
 * whole of what "now" means to it: the day an entry is filed under, the day
 * GET /days/today names, and the lifetime of a token.
 */
export function freezeClockAt(instant: string): void {
  jest.useFakeTimers({
    now: new Date(instant),
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
}

export function moveClockTo(instant: string): void {
  jest.setSystemTime(new Date(instant));
}

export function releaseClock(): void {
  jest.useRealTimers();
}
