'use client';

import { useState } from 'react';
import { UNBUILT, type UnbuiltName } from '@/lib/unbuilt';

/*
 * A control that is drawn and does not work yet takes its name from
 * lib/unbuilt.ts, and so does this hook. A press shows the one sentence and
 * does nothing else: no request is sent.
 *
 * Each such control on screen carries `data-unbuilt` with its name in the
 * list, so all of them can be found in a browser with one selector.
 */
export function useNotBuilt(name: UnbuiltName) {
  const [said, setSaid] = useState(false);

  return {
    label: UNBUILT[name].label,
    said,
    press: () => setSaid(true),
    marker: { 'data-unbuilt': name },
  };
}
