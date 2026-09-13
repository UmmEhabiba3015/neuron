import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import type { AuthenticatedRequest } from './authenticated-request';

// Turns "this request carries a valid token" into "this request is from this
// user", and rejects everything else with 401.
//
// A guard rather than middleware or an interceptor because this is exactly what
// guards are for in Nest: they run before the handler and decide whether it
// runs at all. Middleware would run before routing and would not know which
// handler it was protecting; an interceptor runs too late to prevent the call.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw unauthorized(
        response,
        'invalid_request',
        'No bearer token was provided',
      );
    }

    const payload = await this.tokenService.verify(token);

    // **One outcome for every way verification can fail**, and unlike login
    // this is not about enumeration. A missing token, a malformed one, a
    // well-formed one signed with a different secret and an expired one all
    // arrive here as `undefined`, and none of them is told which it was.
    //
    // Separating "signature failed" from "not a token" would be an oracle: it
    // confirms the value was structurally valid and reached the signature
    // check, which is a fact about this server's signing setup and is useful
    // only to somebody probing it.
    //
    // Expiry is the one distinction worth making, and it is made in the
    // `WWW-Authenticate` header rather than in prose (see `expiredToken`).
    // That is safe for a reason the login rule does not share: the requester
    // already holds the token, so being told it expired reveals a fact about an
    // object in their own hand. Nobody else is exposed, no account is
    // confirmed, and a client needs it to tell "log in again" from "this one
    // just aged out".
    if (!payload) {
      throw isExpired(token)
        ? unauthorized(
            response,
            'invalid_token',
            'The access token has expired',
          )
        : unauthorized(
            response,
            'invalid_token',
            'The access token is not valid',
          );
    }

    // The database read the frozen claims cannot replace. `sub` names a user
    // that existed at login; this asks whether it exists *now*.
    const user = await this.usersService.findById(payload.sub);

    // Same answer as a bad signature, deliberately. "Valid token, no such user"
    // is a fact about who has been deleted, and it is reachable by anyone
    // holding an old token.
    if (!user) {
      throw unauthorized(
        response,
        'invalid_token',
        'The access token is not valid',
      );
    }

    (request as AuthenticatedRequest).user = user;

    return true;
  }
}

// `Bearer <token>`, per RFC 6750, and parsed strictly. A header of `Bearer` with
// nothing after it, or a token with a space in it, is not a valid credential and
// is treated as none rather than passed on to be verified.
function extractBearerToken(header: string | undefined): string | undefined {
  const [scheme, token, ...rest] = (header ?? '').split(' ');

  // The scheme is case-insensitive in the specification, so `bearer` is as
  // valid as `Bearer` and a client sending it is not wrong.
  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    return undefined;
  }

  return token;
}

// Read from the token *without verifying it*, and only ever to choose an error
// message. This is the one place an unverified claim may be looked at, because
// the decision it feeds — which of two 401s to return — grants nothing.
//
// It must never be used to identify a caller: the payload of an unverified JWT
// is base64url text that anybody can write.
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ) as { exp?: unknown };

    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
}

// RFC 6750 puts the reason in `WWW-Authenticate` rather than in the body, which
// is where a client that speaks bearer authentication looks. `invalid_token` and
// `invalid_request` are registered codes; the description is human-readable and
// says nothing a prober could use.
//
// **The body stays identical for every failure** — one 401, one word — and only
// the header differs. That split is the whole of the reasoning: a client can
// tell "refresh and retry" from "send the user to log in", while a response body
// that anything might log or display leaks nothing.
//
// Set on the response directly because Nest's exception filter writes the body,
// not the headers, and `UnauthorizedException`'s `description` option changes
// the body rather than adding a header.
function unauthorized(
  response: Response,
  code: 'invalid_token' | 'invalid_request',
  description: string,
): UnauthorizedException {
  response.setHeader(
    'WWW-Authenticate',
    `Bearer error="${code}", error_description="${description}"`,
  );

  return new UnauthorizedException();
}
