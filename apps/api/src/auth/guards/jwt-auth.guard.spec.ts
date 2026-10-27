import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../../test/support/test-database';
import { UserEntity } from '../../users/entities/user.entity';
import { UsersRepository } from '../../users/users.repository';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { Public } from '../decorators/public.decorator';
import { SessionEntity } from '../entities/session.entity';
import { PasswordService } from '../password.service';
import { RefreshTokenService } from '../refresh-token.service';
import { SessionsRepository } from '../sessions.repository';
import { TokenService } from '../token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const SECRET = 'test-only-signing-secret-never-use-this-anywhere-real';

/*
 * The guard on its own, with a real token service and a real database, and
 * a request that is only the parts the guard reads. That it stands in front
 * of every route is shown by test/app/routes-closed.e2e-spec.ts.
 */
describe('JwtAuthGuard', () => {
  let dataSource: DataSource;
  let guard: JwtAuthGuard;
  let authorization: string;
  let userId: string;
  let sessionId: string;

  const attempt = async (header: string | undefined, isPublic = false) => {
    const handler = () => undefined;

    if (isPublic) {
      Public()(handler);
    }

    const request: Record<string, unknown> = {
      headers: header === undefined ? {} : { authorization: header },
    };
    const response = { setHeader: jest.fn() };
    const context = {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;

    try {
      return {
        allowed: await guard.canActivate(context),
        request,
        challenge: undefined,
        error: undefined,
      };
    } catch (error) {
      return {
        allowed: false,
        request,
        challenge: response.setHeader.mock.calls[0] as [string, string],
        error: error as Error,
      };
    }
  };

  const signedWith = (secret: string, expiresIn: string | number = '15m') =>
    new JwtService({ secret }).signAsync(
      { sub: userId, email: 'umer@example.com', sid: sessionId },
      { expiresIn: expiresIn as never },
    );

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const passwordService = new PasswordService();
    const usersService = new UsersService(
      new UsersRepository(dataSource.getRepository(UserEntity)),
      passwordService,
    );
    const sessions = new SessionsRepository(
      dataSource.getRepository(SessionEntity),
    );
    const tokens = new TokenService(new JwtService({ secret: SECRET }));

    guard = new JwtAuthGuard(tokens, usersService, sessions, new Reflector());

    await usersService.register({
      email: 'umer@example.com',
      password: 'a-long-enough-password',
      name: 'Umer',
      timezone: 'UTC',
    });
    const session = (await new AuthService(
      usersService,
      passwordService,
      tokens,
      new RefreshTokenService(),
      sessions,
    ).login('umer@example.com', 'a-long-enough-password'))!;

    authorization = `Bearer ${session.accessToken}`;
    userId = session.user.id;
    sessionId = session.sessionId;
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  it('lets a live token through, and puts the user and the session on the request', async () => {
    const { allowed, request } = await attempt(authorization);

    expect(allowed).toBe(true);
    expect((request.user as UserEntity).id).toBe(userId);
    expect(request.session).toEqual({ id: sessionId });
  });

  it('lets a @Public() route through with no token at all', async () => {
    expect((await attempt(undefined, true)).allowed).toBe(true);
  });

  it.each([
    ['no Authorization header', undefined],
    ['an empty Authorization header', ''],
    ['the wrong scheme', 'Basic dXNlcjpwYXNz'],
    ['Bearer with nothing after it', 'Bearer'],
    ['more than one value after Bearer', 'Bearer one two'],
  ])('refuses %s as invalid_request', async (_label, header) => {
    const { allowed, error, challenge } = await attempt(header);

    expect(allowed).toBe(false);
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(challenge).toEqual([
      'WWW-Authenticate',
      'Bearer error="invalid_request", error_description="No bearer token was provided"',
    ]);
  });

  it.each([
    ['a token that is not a JWT', 'Bearer not-a-token'],
    ['a JWT-shaped value that is not signed', 'Bearer a.b.c'],
  ])('refuses %s as invalid_token', async (_label, header) => {
    const { error, challenge } = await attempt(header);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(challenge?.[1]).toBe(
      'Bearer error="invalid_token", error_description="The access token is not valid"',
    );
  });

  it('refuses a token signed with a different secret', async () => {
    const forged = await signedWith(
      'a-completely-different-secret-of-sufficient-length',
    );
    const { error, challenge } = await attempt(`Bearer ${forged}`);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(challenge?.[1]).toContain('The access token is not valid');
  });

  it('says an expired token has expired in the header, and the body is the same as for any other', async () => {
    const expired = await signedWith(SECRET, -3600);
    const late = await attempt(`Bearer ${expired}`);
    const invalid = await attempt('Bearer not-a-token');

    expect(late.challenge?.[1]).toContain('The access token has expired');
    expect((late.error as UnauthorizedException).getResponse()).toEqual(
      (invalid.error as UnauthorizedException).getResponse(),
    );
  });

  it.each([
    ['has expired', { expiresAt: '2020-01-01T00:00:00.000Z' }],
    ['was signed out', { revokedAt: '2026-01-01T00:00:00.000Z' }],
  ])(
    'refuses the token of a session that %s',
    async (_label, change: Partial<SessionEntity>) => {
      await dataSource
        .getRepository(SessionEntity)
        .update({ id: sessionId }, change);

      const { error, challenge } = await attempt(authorization);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(challenge?.[1]).toContain('The session is no longer active');
    },
  );

  it('refuses the token of an expired session without marking the session revoked', async () => {
    await dataSource
      .getRepository(SessionEntity)
      .update({ id: sessionId }, { expiresAt: '2020-01-01T00:00:00.000Z' });

    await attempt(authorization);

    expect(
      (
        await dataSource
          .getRepository(SessionEntity)
          .findOneByOrFail({ id: sessionId })
      ).revokedAt,
    ).toBeNull();
  });

  /*
   * The session has to outlive the user, or the session check refuses first
   * and the user check is never reached. Foreign keys are switched off for
   * the one statement that makes that possible: on Postgres, by making the
   * one transaction it runs in a replica, which does not fire the triggers
   * that check them. SET LOCAL ends with the transaction.
   */
  it('refuses the token of a user who no longer exists, without saying so', async () => {
    await dataSource.transaction(async (manager) => {
      await manager.query('SET LOCAL session_replication_role = replica');
      await manager.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    const { error, challenge } = await attempt(authorization);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(challenge?.[1]).toContain('The access token is not valid');
    expect(
      JSON.stringify((error as UnauthorizedException).getResponse()),
    ).not.toMatch(/user|account|deleted/i);
  });
});
