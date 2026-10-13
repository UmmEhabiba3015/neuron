/*
 * The NEXT_PUBLIC_ reference below is replaced with the value itself when the
 * app is built, so it has to be written out in full. `process.env[name]`
 * would not be replaced.
 */
const value = process.env.NEXT_PUBLIC_API_URL;

if (!value) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to ' +
      'apps/web/.env.local and restart.',
  );
}

export const API_URL: string = value;
