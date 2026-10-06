/*
 * Only Date is replaced. Everything that waits -- setTimeout, setImmediate,
 * nextTick -- is left real, because the HTTP server, the database driver and
 * the password hash all depend on them, and a suite that fakes them hangs.
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
