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

/*
 * What an entry is: words typed, or a voice memo recorded. Each value is the
 * word itself, as it is stored and as it travels.
 */
export enum EntryKind {
  Text = 'Text',
  Voice = 'Voice',
}

/*
 * The longest a voice memo may be. The web app stops a recording here and
 * keeps it; the API refuses anything longer.
 */
export const VOICE_MEMO_MAX_MINUTES = 10;

/*
 * The audio types a voice memo may be recorded in, without the codec that
 * may follow them after a semicolon, as in "audio/webm;codecs=opus".
 * Browsers that record WebM send the first, Safari the second.
 */
export const VOICE_MEMO_TYPES = ['audio/webm', 'audio/mp4'] as const;

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
  kind: EntryKind;
  /*
   * The words of a typed entry. A voice memo has none, and is null, until it
   * has a transcript (feature 11).
   */
  content: string | null;
  /* How long a voice memo is, in milliseconds. null for a typed entry. */
  durationMs: number | null;
  /* An instant, as an ISO 8601 string. */
  createdAt: string;
  /*
   * The calendar date, YYYY-MM-DD, of the day the entry was filed on. The
   * API decided it once, when the entry was written. It is not worked out
   * from createdAt, and the two can disagree.
   */
  date: string;
  /*
   * True when the entry is kept out of memory: it is never sent to an AI
   * model (features.md, Ref 25). It is chosen when the entry is saved, and
   * goes one way: PUT /entries/:id/memory puts the entry in memory, and
   * nothing keeps an entry out once it is in, because a model may already
   * have read it. Search finds it either way.
   */
  keptOutOfMemory: boolean;
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
  /*
   * An IANA name such as Asia/Karachi. It decides which date an entry is
   * filed on. Changed with PATCH /auth/me; nothing already written moves.
   */
  timezone: string;
}

/*
 * One device where the person is signed in, as GET /auth/sessions answers
 * it, newest use first.
 */
export interface Session {
  id: string;
  /*
   * The browser and the system, such as "Chrome on Windows", named by the
   * API from the User-Agent header when the list is asked for. "A browser
   * on Linux", or "A browser", when a part is not known.
   */
  device: string;
  /* When the person signed in there. An instant, as an ISO 8601 string. */
  createdAt: string;
  /* The sign-in, or the latest refresh of it. An instant. */
  lastUsedAt: string;
  /* True for the session that asked. */
  current: boolean;
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
  /* Missing means false: the entry is in memory. */
  keptOutOfMemory?: boolean;
}

/*
 * The fields of POST /entries/voice, besides the recording itself, which is
 * the one file of the multipart form, under the name "audio". A form sends
 * every field as text, and the API reads this one as a whole number.
 */
export interface CreateVoiceMemo {
  durationMs: number;
  /*
   * Sent as the text "true" or "false"; anything else is refused. Missing
   * means false: the memo is in memory.
   */
  keptOutOfMemory?: boolean;
}

/*
 * The body of PATCH /entries/:id. The entry keeps its time and its day. A
 * voice memo cannot be edited, and is refused.
 */
export interface UpdateEntry {
  content: string;
}

/*
 * PUT /entries/:id/memory has no body. It puts a kept-out entry in memory
 * and answers with the entry; an entry already in memory answers the same.
 */

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
 * The body of PATCH /auth/me. The timezone follows the rules of Register's.
 */
export interface UpdateTimezone {
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

/*
 * The body of DELETE /auth/me. The person's password, so that someone at an
 * unlocked device cannot delete another person's journal (ADR-024). A wrong
 * one is a 400, not a 401: a 401 means the session has ended.
 */
export interface DeleteAccount {
  password: string;
}

/*
 * The shapes below are journal.json, inside the ZIP that GET /export answers
 * with (ADR-025). They are the shapes above, put together. A voice memo's
 * recording is the file audio/<entry id>.webm or .mp4 beside it.
 */

/* One day of the export: its date and mood, and its entries, oldest first. */
export interface ExportedDay extends Day {
  entries: Entry[];
}

export interface JournalExport {
  /* When the export was made. An instant, as an ISO 8601 string. */
  exportedAt: string;
  user: User;
  /*
   * Every day with at least one entry that is not deleted, oldest first.
   * Deleted entries are never exported (ADR-020).
   */
  days: ExportedDay[];
}
