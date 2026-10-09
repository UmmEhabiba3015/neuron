'use client';

import type { WireDay } from '@neuron/contracts';
import { useEffect, useState } from 'react';
import { session } from '@/lib/api';
import { formatDay } from '@/lib/format';

/*
 * Today's date, as the API says it is, for the date box of a screen that
 * shows nothing else of today: Ask and Talk. The browser's clock never makes
 * a date (docs/requirements.md 3.2.2).
 *
 * Until the answer arrives the box is empty, as on Today, so that nothing
 * below it moves. If the question fails, the box stays empty: the failed
 * state of these screens is drawn on the day their feature is wired.
 */
export function useTodayDate(): string {
  const [date, setDate] = useState('');

  useEffect(() => {
    let current = true;

    void session.request<WireDay>('/days/today').then((today) => {
      if (current && today.kind === 'ok') {
        setDate(formatDay(today.data.date));
      }
    });

    return () => {
      current = false;
    };
  }, []);

  return date;
}
