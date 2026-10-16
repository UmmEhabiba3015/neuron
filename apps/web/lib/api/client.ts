import { API_URL } from '../utils/config';
import { createUploads } from '../uploads';
import { createSession } from './session';

/*
 * The one session of this page. Everything that talks to the API imports it
 * from here, so there is one access token and one place a refresh can start.
 */
export const session = createSession({
  apiUrl: API_URL,
  fetch: (url, init) => fetch(url, init),
});

/*
 * The voice memos being sent, for the whole page: one is kept on Talk and
 * shown on Today. Signing out clears them, so that what one person recorded
 * is not on the page for the next.
 */
export const uploads = createUploads({ request: session.request });

session.subscribe(() => {
  if (session.getState().status === 'signedOut') {
    uploads.clear();
  }
});
