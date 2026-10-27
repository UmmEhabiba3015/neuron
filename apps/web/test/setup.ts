import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/*
 * The setup of every component test (ADR-026).
 *
 * jsdom has no `window.matchMedia`, and the Enter handler asks it whether
 * the screen is touch only. Here every screen has a keyboard and a mouse:
 * the answer is no. A test that needs the other answer replaces it with
 * `vi.mocked(window.matchMedia).mockImplementation(...)`.
 */
function answer(matches: boolean) {
  return (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

window.matchMedia = vi.fn(answer(false));

/* jsdom does not draw, so it cannot scroll; Today asks it to. */
window.scrollTo = () => {};

/* What a test changed is put back, and what it drew is taken off the page. */
afterEach(() => {
  cleanup();
  vi.mocked(window.matchMedia).mockImplementation(answer(false));
  vi.unstubAllGlobals();
});
