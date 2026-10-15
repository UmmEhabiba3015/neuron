'use client';

import type { KeyboardEvent } from 'react';
import { enterSaves, TOUCH_ONLY } from '@/lib/keys';

/*
 * The key handler of a text box that saves: the composer, and the editor of
 * an entry. Whether Enter saves is decided in lib/keys.ts. This reads the
 * event and the screen for it, and stops the new line when it does save.
 *
 * The screen is asked at each press, not once: a tablet can gain or lose a
 * keyboard and a mouse while the page is open.
 */
export function useEnterToSave(onSave: () => void) {
  return (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const press = {
      key: event.key,
      shiftKey: event.shiftKey,
      isComposing: event.nativeEvent.isComposing,
      touchOnly: window.matchMedia(TOUCH_ONLY).matches,
    };

    if (enterSaves(press)) {
      event.preventDefault();
      onSave();
    }
  };
}
