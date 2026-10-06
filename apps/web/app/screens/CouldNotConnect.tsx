'use client';

import { AuthScreen } from '@/app/components/AuthScreen';
import { session } from '@/lib/api';

/*
 * The first refresh got no answer. The app does not know whether this
 * person is signed in, so it shows neither Today nor a form, and offers the
 * question again.
 */
export function CouldNotConnect() {
  return (
    <AuthScreen>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">Could not connect</h2>
          <p className="auth-copy">We could not finish that request.</p>
          <div className="auth-actions">
            <button
              className="btn solid"
              type="button"
              onClick={() => void session.restore()}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    </AuthScreen>
  );
}
