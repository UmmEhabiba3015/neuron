/*
 * Facts about data crossing the boundary between apps/api and apps/web, and
 * nothing else (ADR-019). No behaviour of either application lives here.
 *
 * This file imports nothing and holds no function or class: interfaces,
 * enums and constants only. Both rules are checked by test/contract.test.mjs.
 *
 * It is compiled to dist/ by `pnpm build` in this package, and both
 * applications import the compiled output, never this file.
 */

/*
 * The five words a day's mood may be, in the order they are drawn. null, not
 * a sixth word, clears it. Each value is the word itself, so what travels
 * over HTTP and what is stored is the word. Object.values(Mood) lists them.
 */
export enum Mood {
  Light = 'Light',
  Good = 'Good',
  Even = 'Even',
  Low = 'Low',
  Hard = 'Hard',
}

/* What GET /entries serves when no limit is asked for, and the most it serves. */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export const PASSWORD_MIN_LENGTH = 8;

/* The most characters a display name may have, counted after it is trimmed. */
export const NAME_MAX_LENGTH = 60;

/*
 * How long the link in a password reset email works, by the API's clock. The
 * API decides it; the web app says it.
 */
export const PASSWORD_RESET_LIFETIME_MINUTES = 30;

/*
 * The shapes below are what travels over HTTP. They are not the API's
 * entities: an entity also holds columns that never leave the server. The
 * API's response DTOs implement them.
 */

export interface Entry {
  id: string;
  content: string;
  /* An instant, as an ISO 8601 string. */
  createdAt: string;
  /*
   * The calendar date, YYYY-MM-DD, of the day the entry was filed on. The
   * API decided it once, when the entry was written. It is not worked out
   * from createdAt, and the two can disagree.
   */
  date: string;
}

export interface Day {
  /* A calendar date, YYYY-MM-DD. Which date is "today" is the API's to say. */
  date: string;
  mood: Mood | null;
}

export interface User {
  id: string;
  email: string;
  /* What the person is called on screen. Never used for signing in. */
  name: string;
  createdAt: string;
}

/* The answer to POST /auth/login and POST /auth/refresh. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/*
 * The shapes below are what the web app sends. Each one is the body of one
 * request, and the API's DTO class for that request declares that it
 * implements it. The rules about what a valid value is stay in the API.
 */

/* The body of POST /entries. */
export interface CreateEntry {
  content: string;
}

/* The body of PATCH /entries/:id. The entry keeps its time and its day. */
export interface UpdateEntry {
  content: string;
}

/* The body of PUT /days/:date/mood. null clears the mood. */
export interface SetMood {
  mood: Mood | null;
}

/* The body of POST /auth/login. */
export interface Login {
  email: string;
  password: string;
}

/* The body of POST /auth/register. */
export interface Register {
  email: string;
  password: string;
  name: string;
  /*
   * An IANA name such as Asia/Karachi, read from the browser and never typed
   * by a person. Not a country, and not an offset such as +05:00.
   */
  timezone: string;
}

/*
 * The body of POST /auth/forgot-password. The answer is the same whether or
 * not an account uses the address.
 */
export interface ForgotPassword {
  email: string;
}

/*
 * The body of POST /auth/reset-password. The token is the one in the link of
 * the email. The password follows the rules of Register's.
 */
export interface ResetPassword {
  token: string;
  password: string;
}
