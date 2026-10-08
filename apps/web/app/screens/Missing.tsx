'use client';

import Link from 'next/link';
import type { Ref } from 'react';
import { JournalBox, LiveScreen } from '@/app/components/LiveScreen';

/*
 * The two screens for a day that is not there, both from
 * 18-entry-system-states.html and both in the designer's words.
 *
 * No destination is marked as the current one: the person is on none of
 * them.
 */

/*
 * An address that is not a date, a day that has not happened, and a day with
 * nothing on it are all this one screen. Which of them it was is not said.
 */
export function PageNotFound() {
  return (
    <LiveScreen current={null} surface aside={<JournalBox />}>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">Page not found</h2>
          <p className="auth-copy">This entry or day could not be found.</p>
          <div className="auth-actions">
            <Link className="btn solid" href="/">
              Back to Today
            </Link>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}

/*
 * The last entry of a past day has just been deleted here. `heading` is
 * where focus goes, because the control that was pressed has left the page.
 */
export function NothingOnThisDay({
  heading,
}: {
  heading: Ref<HTMLHeadingElement>;
}) {
  return (
    <LiveScreen current={null} surface aside={<JournalBox />}>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading" tabIndex={-1} ref={heading}>
            Nothing on this day
          </h2>
          <p className="auth-copy">
            The last item on this day was deleted, so this day no longer
            appears in Timeline.
          </p>
          <div className="auth-actions">
            <Link className="btn solid" href="/timeline">
              Back to Timeline
            </Link>
          </div>
        </div>
      </main>
    </LiveScreen>
  );
}
