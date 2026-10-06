import type { ReactNode } from 'react';
import { Destinations, Glance, KeyBox, Wordmark } from './Chrome';

type Destination = 'Today' | 'Timeline' | 'Ask' | 'You';

/*
 * Both headers are rendered because the desktop comp hoists the header out of
 * .page into .title and a container query cannot restructure the DOM.
 * live.css hides whichever one the width does not want.
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
