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
 */
export function LiveScreen({
  current,
  keyLabel,
  keyValue,
  glance,
  children,
}: {
  current: Destination;
  keyLabel: string;
  keyValue: string;
  glance?: ReactNode;
  children: ReactNode;
}) {
  const header = (
    <>
      <Wordmark />
      <KeyBox label={keyLabel} value={keyValue} />
    </>
  );

  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />

      <div className="title">
        {header}
        <Destinations current={current} />
        {glance ? <Glance>{glance}</Glance> : null}
      </div>

      <div className="page">
        <header className="mast">{header}</header>
        <Destinations current={current} />
        {glance ? <Glance>{glance}</Glance> : null}
        {children}
      </div>
    </div>
  );
}
