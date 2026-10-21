import { createHash } from 'node:crypto';

/*
 * The hash under which a refresh token and a reset token are stored.
 * SHA-256 with no salt: a token of 32 random bytes cannot be guessed, so a
 * salt would add nothing, and the same token always gives the same hash,
 * so a token that comes back can be compared with, or found by, its stored
 * hash.
 */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
