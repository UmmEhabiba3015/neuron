import type { CookieOptions } from 'express';
import { REFRESH_TOKEN_LIFETIME_MS } from './auth.service';

export const REFRESH_COOKIE_NAME = 'neuron_refresh';

/*
 * No `secure` here, and not conditionally either: ADR-018 adds it on Day 31,
 * when HTTPS exists.
 *
 * A browser only clears a cookie when the clearing header carries the same
 * `Path` it was set with, so setting and clearing share these attributes.
 */
const REFRESH_COOKIE_ATTRIBUTES = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/auth/refresh',
} satisfies CookieOptions;

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  ...REFRESH_COOKIE_ATTRIBUTES,
  maxAge: REFRESH_TOKEN_LIFETIME_MS,
};

export const REFRESH_COOKIE_CLEAR_OPTIONS: CookieOptions =
  REFRESH_COOKIE_ATTRIBUTES;

export interface RefreshCredential {
  sessionId: string;
  refreshToken: string;
}

/*
 * One cookie carries both halves as `<sessionId>.<refreshToken>`. A session
 * id is a UUID and a refresh token is base64url, and neither alphabet
 * contains a dot, so the first dot is always the separator.
 */
const SEPARATOR = '.';

export const packRefreshCookie = (credential: RefreshCredential): string =>
  `${credential.sessionId}${SEPARATOR}${credential.refreshToken}`;

export const unpackRefreshCookie = (
  value: unknown,
): RefreshCredential | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const at = value.indexOf(SEPARATOR);
  const sessionId = value.slice(0, at);
  const refreshToken = value.slice(at + 1);

  if (at === -1 || sessionId === '' || refreshToken === '') {
    return undefined;
  }

  return { sessionId, refreshToken };
};
