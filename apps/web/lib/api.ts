import { API_URL } from './config';
import { createSession } from './session';

/*
 * The one session of this page. Everything that talks to the API imports it
 * from here, so there is one access token and one place a refresh can start.
 */
export const session = createSession({
  apiUrl: API_URL,
  fetch: (url, init) => fetch(url, init),
});
