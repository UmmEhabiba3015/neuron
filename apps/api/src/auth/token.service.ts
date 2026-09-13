import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../users/user.entity';

// What a signed token carries. `sub` — subject — is the registered JWT claim
// for "who this token is about", and using the standard name rather than
// `userId` is what lets any JWT library, logger or debugger read it.
//
// **Nothing sensitive goes in here, and that is a property of the format rather
// than a convention.** A JWT is signed, not encrypted: the payload is
// base64url, which anyone holding the token can decode without the secret. The
// signature stops it being *changed*, not *read*. So `sub` is an opaque id, and
// the credential is not in it.
export interface AccessTokenPayload {
  sub: string;
  name: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  // The `name` is here for the same reason the login response carries the user:
  // a client rendering a shell should not need a second request to learn who it
  // is signed in as. It is a convenience and never a fact to trust for
  // authorisation — `sub` is the identity, and Day 10 resolves it against the
  // database rather than believing a string in a token.
  sign(user: User): Promise<string> {
    const payload: AccessTokenPayload = { sub: user.id, name: user.name };

    return this.jwtService.signAsync(payload);
  }

  // Returns `undefined` rather than throwing for an invalid token, which is the
  // same vocabulary the repositories use for "nothing there". A token that is
  // expired, forged, truncated or simply absent is an ordinary outcome of an
  // unauthenticated request, and whether it deserves a 401 is a question about
  // HTTP that this file may not answer (ADR-005).
  async verify(token: string): Promise<AccessTokenPayload | undefined> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      return undefined;
    }
  }
}
