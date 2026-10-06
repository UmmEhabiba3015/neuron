/*
 * Where the API is.
 *
 * The browser needs this value, and the mechanism Next.js provides for that
 * is the NEXT_PUBLIC_ prefix: the reference below is replaced with the value
 * itself when the app is built (or when `next dev` compiles the page), so it
 * has to be written out in full. `process.env[name]` would not be replaced.
 *
 * next.config.ts makes the same check before a build or a dev server starts,
 * which is where a missing value is normally caught. The check here is for
 * anything that reaches this file another way.
 */
const value = process.env.NEXT_PUBLIC_API_URL;

if (!value) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to ' +
      'apps/web/.env.local and restart.',
  );
}

export const API_URL: string = value;
