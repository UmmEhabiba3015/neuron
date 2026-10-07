'use client';

import { AuthScreen } from '@/app/components/AuthScreen';
import { session } from '@/lib/api';

/*
 * The app does not know whether this person is signed in, so it shows neither
 * Today nor a form.
 *
 * A press of "Try again" is always seen (ADR-021): the line says the question
 * is being asked, and the count changes when the answer is the same.
 */
export function CouldNotConnect({
  asking,
  asked,
}: {
  asking: boolean;
  asked: number;
}) {
  return (
    <AuthScreen>
      <main className="sheet auth-sheet">
        <div className="auth-content">
          <h2 className="auth-heading">Could not connect</h2>
          <p className="auth-copy" role="alert">
            We could not finish that request.
            {asked > 1 ? ` Asked ${asked} times.` : null}
          </p>
          {asking ? (
            <p className="auth-help" role="status">
              Asking again.
            </p>
          ) : null}
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
