import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const REFRESH_TOKEN_BYTES = 32;

@Injectable()
export class RefreshTokenService {
  generate(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  matches(token: string, storedHash: string): boolean {
    const candidate = Buffer.from(this.hash(token), 'hex');
    const stored = Buffer.from(storedHash, 'hex');

    if (candidate.length !== stored.length) {
      return false;
    }

    return timingSafeEqual(candidate, stored);
  }
}
