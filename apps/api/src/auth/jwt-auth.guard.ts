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

    const user = await this.usersService.findById(payload.sub);

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

function extractBearerToken(header: string | undefined): string | undefined {
  const [scheme, token, ...rest] = (header ?? '').split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    return undefined;
  }

  return token;
}

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
