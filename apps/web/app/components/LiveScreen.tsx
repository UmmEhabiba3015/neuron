import type { ReactNode } from 'react';
import { Destinations, Glance, KeyBox, Wordmark } from './Chrome';

type Destination = 'Today' | 'Timeline' | 'Ask' | 'You';

/*
 * The running product, as opposed to a comp of it.
 *
 * There is no .device, no .chrome and no platform modifier class. .app is
 * the viewport, which is what direction-lock.md 12.6 says it is in
 * production, so the container queries in lock.css sections 4 and 5 drive
 * the whole reflow on their own.
 *
 * Both headers are rendered because the desktop comp hoists the header out
 * of .page into .title and a container query cannot restructure the DOM.
 * live.css hides whichever one the width does not want.
 *
 * `aside` is the masthead's second object. Today carries a date box there
 * and Timeline carries the zoom control, and rule 7.6 says nothing above
 * the destination row may vary beyond that.
 */
export function LiveScreen({
  current,
  aside,
  lede,
  children,
  foot,
}: {
  current: Destination;
  aside: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
}) {
  const header = (
    <>
      <Wordmark />
      {aside}
    </>
  );

  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />

      <div className="title">
        {header}
        <Destinations current={current} />
        {lede}
      </div>

      <div className="page">
        <header className="mast">{header}</header>
        <Destinations current={current} />
        {lede}
        {children}
        {foot}
      </div>
    </div>
  );
}

export { Glance, KeyBox };
