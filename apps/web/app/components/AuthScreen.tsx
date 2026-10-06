import type { ReactNode } from 'react';
import { Wordmark } from './Chrome';

/*
 * The shell of the screens a signed-out visitor sees. It is LiveScreen
 * without the destinations and without a second object in the masthead,
 * because there is nowhere to go until the person is signed in.
 *
 * The wordmark is rendered twice for the reason LiveScreen gives: the
 * desktop layout moves it into .title, and live.css hides whichever one the
 * width does not want.
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
 * What is shown while the first refresh is in flight: the paper and the
 * rail, and nothing on them. Neither Today nor a form may be shown before
 * the answer is known, and both outcomes keep the paper and the rail, so
 * nothing that is drawn here has to be taken away again.
 */
export function BlankScreen() {
  return (
    <div className="app">
      <div className="rail" aria-hidden="true" />
      <div className="page" />
    </div>
  );
}
