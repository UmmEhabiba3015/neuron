import type { ReactNode } from 'react';
import { Wordmark } from './Chrome';

/*
 * The wordmark is rendered twice on purpose: the desktop layout moves it into
 * .title, and live.css hides whichever one the width does not want.
 */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />

      <div className="title">
        <Wordmark />
      </div>

      <div className="page">
        <header className="mast">
          <Wordmark />
        </header>
        {children}
      </div>
    </div>
  );
}

/*
 * Shown while the first refresh is in flight. Neither Today nor a form may be
 * shown before the answer is known.
 */
export function BlankScreen() {
  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />
      <div className="page" />
    </div>
  );
}
