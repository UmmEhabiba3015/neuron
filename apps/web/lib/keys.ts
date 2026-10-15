/*
 * What a key pressed in a text box that saves does: the composer on Today,
 * and the editor of an entry. Her decision of 2026-10-15 (docs/features.md,
 * Ref 13).
 *
 *   On a computer   Enter saves, and Shift with Enter starts a new line.
 *   On a phone      Enter starts a new line, and only the button saves.
 *
 * Enter pressed while an input method is still composing a word (Japanese,
 * Chinese, Korean, and some phone keyboards) chooses the word, and never
 * saves.
 *
 * Escape closes the editor of an entry, as Cancel does, unless it is ending
 * the composition of a word.
 *
 * The component reads the key event and the screen, and hands them here as
 * plain values, so that this file needs no browser to be tested.
 */

/*
 * A screen that can only be touched: no pointer hovers over it, and the
 * pointer is a finger. A laptop with a touch screen is not one.
 */
export const TOUCH_ONLY = '(hover: none) and (pointer: coarse)';

export interface KeyPress {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  /* The screen matches TOUCH_ONLY. */
  touchOnly: boolean;
}

export function enterSaves(press: KeyPress): boolean {
  return (
    press.key === 'Enter' &&
    !press.shiftKey &&
    !press.isComposing &&
    !press.touchOnly
  );
}

export function escapeCloses(press: Omit<KeyPress, 'touchOnly'>): boolean {
  return press.key === 'Escape' && !press.isComposing;
}
