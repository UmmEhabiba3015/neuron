import type { ReactNode } from 'react';
import { Destinations, KeyBox, Wordmark, type Destination } from './Chrome';

/*
 * Both headers are rendered because the desktop comp puts the header in
 * .title, outside .page, and the other two widths put it in .journal-header,
 * inside .page. A container query cannot move an element. live.css hides
 * whichever one the width does not want.
 */
export function LiveScreen({
  current,
  aside,
  children,
}: {
  current: Destination;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />

      <div className="title">
        <Wordmark />
        {aside}
        <Destinations current={current} />
      </div>

      <div className="page">
        <div className="journal-header">
          <header className="mast">
            <Wordmark />
            {aside}
          </header>
          <Destinations current={current} />
        </div>
        {children}
      </div>
    </div>
  );
}

export { KeyBox };
