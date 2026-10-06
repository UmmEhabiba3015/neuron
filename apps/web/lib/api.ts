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

/*
 * An entry and a day as the API sends them. The API states these shapes in
 * apps/api (JournalEntry, DayResponse); this is a second statement of them,
 * and nothing checks that the two agree.
 */
export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
}

export interface Day {
  date: string;
  mood: string | null;
}
