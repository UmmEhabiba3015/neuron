import type { Response } from 'supertest';
import { REFRESH_COOKIE_NAME } from '../src/auth/refresh-cookie';

export interface RefreshCookie {
  pair: string;
  value: string;
  attributes: string[];
}

export function refreshCookieFrom(response: Response): RefreshCookie {
  const header = response.headers['set-cookie'] as unknown;
  const lines = Array.isArray(header) ? (header as string[]) : [];
  const line = lines.find((each) => each.startsWith(`${REFRESH_COOKIE_NAME}=`));

  if (line === undefined) {
    throw new Error(
      `expected a Set-Cookie header for ${REFRESH_COOKIE_NAME}, received ${JSON.stringify(header)}`,
    );
  }

  const [pair, ...attributes] = line.split('; ');

  return {
    pair,
    value: pair.slice(REFRESH_COOKIE_NAME.length + 1),
    attributes,
  };
}

export const refreshTokenIn = (cookie: RefreshCookie): string =>
  cookie.value.slice(cookie.value.indexOf('.') + 1);
