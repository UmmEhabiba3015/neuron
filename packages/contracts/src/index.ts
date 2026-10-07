/*
 * Facts about data crossing the boundary between apps/api and apps/web, and
 * nothing else (ADR-019). No behaviour of either application lives here.
 *
 * This file imports nothing and holds no function. Both rules are checked by
 * test/contract.test.mjs.
 */

/* The five words a day's mood may be. null, not a sixth word, clears it. */
export const MOODS = ['Light', 'Good', 'Even', 'Low', 'Hard'] as const;

export type Mood = (typeof MOODS)[number];

/* What GET /entries serves when no limit is asked for, and the most it serves. */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export const PASSWORD_MIN_LENGTH = 8;

/* The most characters a display name may have, counted after it is trimmed. */
export const NAME_MAX_LENGTH = 60;

/*
 * The shapes below are what travels over HTTP, which is why each name starts
 * with Wire. They are not the API's entities: an entity also holds columns
 * that never leave the server.
 */

export interface WireEntry {
  id: string;
  content: string;
  /* An instant, as an ISO 8601 string. */
  createdAt: string;
}

export interface WireDay {
  /* A calendar date, YYYY-MM-DD. Which date is "today" is the API's to say. */
  date: string;
  mood: Mood | null;
}

export interface WireUser {
  id: string;
  email: string;
  /* What the person is called on screen. Never used for signing in. */
  name: string;
  createdAt: string;
}

/* The answer to POST /auth/login and POST /auth/refresh. */
export interface WireAuthenticated {
  accessToken: string;
  user: WireUser;
}

/*
 * The shapes below are what the web app sends. Each one is the body of one
 * request, and the API's DTO class for that request declares that it
 * implements it. The rules about what a valid value is stay in the API.
 */

/* The body of POST /entries. */
export interface WireNewEntry {
  content: string;
}

/* The body of POST /auth/login. */
export interface WireLogin {
  email: string;
  password: string;
}

/* The body of POST /auth/register. */
export interface WireRegistration {
  email: string;
  password: string;
  name: string;
  /*
   * An IANA name such as Asia/Karachi, read from the browser and never typed
   * by a person. Not a country, and not an offset such as +05:00.
   */
  timezone: string;
}
