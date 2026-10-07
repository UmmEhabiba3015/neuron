import type { ReactNode } from 'react';
import { KeyBox, Wordmark } from './Chrome';

/*
 * The plain-paper open spread of 13-login.html and 14-register.html: what
 * the journal is for on the facing page, and the form on its own sheet. The
 * markup is the same at every width, and lock.css rearranges it.
 */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="app auth-surface auth-paper">
      <div className="rail" aria-hidden="true" />

      <div className="page">
        <header className="mast">
          <Wordmark />
          <KeyBox label="Account" value="Your journal" printed />
        </header>

        <main className="auth-canvas">
          <div className="sheet auth-sheet">
            <section className="auth-context" aria-labelledby="context-title">
              <div>
                <h2 className="context-title" id="context-title">
                  Some days are a sentence.
                  <br />
                  Some days need a page.
                </h2>
                <p className="context-copy">
                  Keep the small moments, the longer thoughts, and the things
                  you would rather say aloud.
                </p>
              </div>
              <div className="auth-ways">
                <div className="auth-way">
                  <p className="way-label">Write</p>
                  <p>A few words, or as many as you need.</p>
                </div>
                <div className="auth-way">
                  <p className="way-label">Record</p>
                  <p>Leave a voice memo in your journal.</p>
                </div>
              </div>
            </section>

            <section className="auth-region" aria-labelledby="auth-heading">
              <div className="auth-content">{children}</div>
            </section>
          </div>
        </main>
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
