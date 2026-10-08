import type { ReactNode } from 'react';
import {
  Back,
  Destinations,
  KeyBox,
  Wordmark,
  type Destination,
} from './Chrome';

/*
 * Both headers are rendered because the desktop comp puts the header in
 * .title, outside .page, and the other two widths put it in .journal-header,
 * inside .page. A container query cannot move an element. live.css hides
 * whichever one the width does not want.
 *
 * `title` is the wordmark: "Journal" on Today, and the destination's own
 * name on the others, as each comp draws it.
 * `surface` is the designer's .auth-surface, for a page that is one plain
 * sheet: Account, and the two screens that say a day is not there.
 * `split` is Timeline's page, which keeps a second column for the calendar.
 */
export function LiveScreen({
  current,
  title,
  aside,
  surface,
  split,
  children,
}: {
  current: Destination | null;
  title?: string;
  aside: ReactNode;
  surface?: boolean;
  split?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={surface ? 'app auth-surface' : 'app'}>
      <div className="rail" aria-hidden="true" />

      <div className="title">
        <Wordmark>{title}</Wordmark>
        {aside}
        <Destinations current={current} />
      </div>

      <div className={split ? 'page split' : 'page'}>
        <div className="journal-header">
          <header className="mast">
            <Wordmark>{title}</Wordmark>
            {aside}
          </header>
          <Destinations current={current} />
        </div>
        {children}
      </div>
    </div>
  );
}

/*
 * A pushed page: one that is reached from a destination and is not one. It
 * has a way back where a destination has its wordmark, and no destinations
 * (06-conversation.html). Both headers are rendered, for the reason above.
 */
export function PushedScreen({
  back,
  aside,
  children,
}: {
  back: { href: string; label: string };
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />

      <div className="title">
        <Back href={back.href}>{back.label}</Back>
        {aside}
      </div>

      <div className="page pushed untitled">
        <header className="mast">
          <Back href={back.href}>{back.label}</Back>
          {aside}
        </header>
        {children}
      </div>
    </div>
  );
}

/* The designer's box for a page that has no date of its own. */
export function JournalBox() {
  return <KeyBox label="Journal" value="Your journal" printed />;
}

export { KeyBox };
