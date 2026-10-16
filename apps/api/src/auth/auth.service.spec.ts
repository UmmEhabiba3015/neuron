import { JwtService } from '@nestjs/jwt';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../test/support/test-database';
import { UserEntity } from '../users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService, REFRESH_TOKEN_LIFETIME_MS } from './auth.service';
import { SessionEntity } from './entities/session.entity';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionsRepository } from './sessions.repository';
import { TokenService } from './token.service';

const SECRET = 'test-only-signing-secret-never-use-this-anywhere-real';
const PASSWORD = 'a-long-enough-password';

describe('AuthService', () => {
  let dataSource: DataSource;
  let service: AuthService;
  let usersService: UsersService;
  let passwordService: PasswordService;

  const sessionRows = () => dataSource.getRepository(SessionEntity).find();

  const register = async (email: string) =>
    (await usersService.register({
      email,
      password: PASSWORD,
      name: 'Somebody',
      timezone: 'UTC',
    }))!;

  const signIn = async (email = 'umer@example.com') =>
    (await service.login(email, PASSWORD))!;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    passwordService = new PasswordService();
    usersService = new UsersService(
      new UsersRepository(dataSource.getRepository(UserEntity)),
      passwordService,
    );
    service = new AuthService(
      usersService,
      passwordService,
      new TokenService(
        new JwtService({ secret: SECRET, signOptions: { expiresIn: '15m' } }),
      ),
      new RefreshTokenService(),
      new SessionsRepository(dataSource.getRepository(SessionEntity)),
    );

    await register('umer@example.com');
  });

  afterEach(async () => {
    await closeTestDataSource(dataSource);
  });

  describe('login', () => {
    it('starts a session for the right credentials, and stores only a hash of its refresh token', async () => {
      const before = Date.now();
      const session = await signIn();

      expect(session.user.email).toBe('umer@example.com');
      expect(session.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

      const [row] = await sessionRows();

      expect(row.id).toBe(session.sessionId);
      expect(row.revokedAt).toBeNull();
      expect(row.refreshTokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.refreshTokenHash).not.toContain(session.refreshToken);

      const lifetime = Date.parse(row.expiresAt) - Date.parse(row.createdAt);
      expect(lifetime).toBe(REFRESH_TOKEN_LIFETIME_MS);
      expect(Date.parse(row.createdAt)).toBeGreaterThanOrEqual(before - 1000);
    });

    it('keeps the user agent of the sign-in, and counts the sign-in as its last use', async () => {
      await service.login('umer@example.com', PASSWORD, 'Firefox/157.0');
      await service.login('umer@example.com', PASSWORD);

      const rows = await sessionRows();

      expect(rows.map((row) => row.userAgent).sort()).toEqual([
        'Firefox/157.0',
        null,
      ]);
      for (const row of rows) {
        expect(row.lastUsedAt).toBe(row.createdAt);
      }
    });

    it('starts one session for each sign-in', async () => {
      await signIn();
      await signIn();

      expect(await sessionRows()).toHaveLength(2);
    });

    it('puts the user, the session and nothing secret in the access token', async () => {
      const session = await signIn();
      const payload = JSON.parse(
        Buffer.from(session.accessToken.split('.')[1], 'base64url').toString(),
      ) as Record<string, unknown>;

      expect(Object.keys(payload).sort()).toEqual([
        'email',
        'exp',
        'iat',
        'sid',
        'sub',
      ]);
      expect(payload.sub).toBe(session.user.id);
      expect(payload.sid).toBe(session.sessionId);
      expect(JSON.stringify(payload)).not.toContain(PASSWORD);
      expect(JSON.stringify(payload)).not.toContain('$argon2');
    });

    it('signs in with the address in different capitals', async () => {
      expect(await service.login('UMER@EXAMPLE.COM', PASSWORD)).toBeDefined();
    });

    it('refuses a wrong password, an unknown address, and an account whose stored hash cannot be read', async () => {
      await dataSource.getRepository(UserEntity).insert({
        id: 'legacy-user',
        email: 'legacy@example.com',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: 'not-an-argon2-hash',
        name: 'Somebody',
        timezone: 'UTC',
      });

      expect(
        await service.login('umer@example.com', 'the-wrong-password'),
      ).toBeUndefined();
      expect(
        await service.login('nobody@example.com', PASSWORD),
      ).toBeUndefined();
      expect(
        await service.login('legacy@example.com', 'any-password-at-all'),
      ).toBeUndefined();
      expect(await sessionRows()).toEqual([]);
    });

    /*
     * Without a hash to check, an unknown address would be answered at once
     * and a wrong password only after argon2 had run: the time alone would
     * tell an attacker which addresses have accounts.
     */
    it('checks a password against a hash for an unknown address too, so both take as long', async () => {
      const verify = jest.spyOn(passwordService, 'verify');

      await service.login('umer@example.com', 'the-wrong-password');
      await service.login('nobody@example.com', 'the-wrong-password');

      expect(verify).toHaveBeenCalledTimes(2);
      expect(verify.mock.calls[1][0]).toMatch(/^\$argon2id\$/);
      expect(verify.mock.calls[1][1]).toBe('the-wrong-password');
    });
  });

  describe('refresh', () => {
    it('gives the same session a new access token and a new refresh token', async () => {
      const first = await signIn();
      const [before] = await sessionRows();

      const next = (await service.refresh(
        first.sessionId,
        first.refreshToken,
      ))!;

      expect(next.sessionId).toBe(first.sessionId);
      expect(next.refreshToken).not.toBe(first.refreshToken);
      expect(next.accessToken).toEqual(expect.any(String));

      const [after] = await sessionRows();
      expect(after.refreshTokenHash).not.toBe(before.refreshTokenHash);

      expect(
        await service.refresh(next.sessionId, next.refreshToken),
      ).toBeDefined();
    });

    it('sets last_used_at to the moment of the refresh, and changes nothing else about when', async () => {
      const first = await signIn();
      await dataSource.getRepository(SessionEntity).update(
        { id: first.sessionId },
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          lastUsedAt: '2026-01-01T00:00:00.000Z',
        },
      );
      const before = Date.now();

      await service.refresh(first.sessionId, first.refreshToken);

      const [row] = await sessionRows();
      expect(row.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(Date.parse(row.lastUsedAt)).toBeGreaterThanOrEqual(before - 1000);
    });

    it('ends every session of the person, and no one else, when a replaced token is used again', async () => {
      const laptop = await signIn();
      const phone = await signIn();
      await register('someone-else@example.com');
      const someoneElse = await signIn('someone-else@example.com');

      await service.refresh(laptop.sessionId, laptop.refreshToken);

      expect(
        await service.refresh(laptop.sessionId, laptop.refreshToken),
      ).toBeUndefined();

      const rows = await sessionRows();
      const revoked = (id: string) =>
        rows.find((row) => row.id === id)!.revokedAt !== null;

      expect(revoked(laptop.sessionId)).toBe(true);
      expect(revoked(phone.sessionId)).toBe(true);
      expect(revoked(someoneElse.sessionId)).toBe(false);
      expect(
        await service.refresh(phone.sessionId, phone.refreshToken),
      ).toBeUndefined();
    });

    it('refuses a session that does not exist, and ends nothing', async () => {
      const session = await signIn();

      expect(
        await service.refresh(
          '00000000-0000-0000-0000-000000000000',
          session.refreshToken,
        ),
      ).toBeUndefined();
      expect((await sessionRows())[0].revokedAt).toBeNull();
    });

    it('refuses a session that was signed out', async () => {
      const session = await signIn();
      await service.logout(session.user.id, session.sessionId);

      expect(
        await service.refresh(session.sessionId, session.refreshToken),
      ).toBeUndefined();
    });

    it('refuses a session that has expired, without calling it revoked', async () => {
      const session = await signIn();
      await dataSource
        .getRepository(SessionEntity)
        .update(
          { id: session.sessionId },
          { expiresAt: '2020-01-01T00:00:00.000Z' },
        );

      expect(
        await service.refresh(session.sessionId, session.refreshToken),
      ).toBeUndefined();
      expect((await sessionRows())[0].revokedAt).toBeNull();
    });
  });

  describe('signing out', () => {
    it('ends one session with logout, and says nothing was ended the second time', async () => {
      const laptop = await signIn();
      const phone = await signIn();

      expect(await service.logout(laptop.user.id, laptop.sessionId)).toBe(true);
      expect(await service.logout(laptop.user.id, laptop.sessionId)).toBe(
        false,
      );

      expect(
        (await service.listSessions(laptop.user.id)).map((each) => each.id),
      ).toEqual([phone.sessionId]);
    });

    it("does not end another person's session, and says nothing was ended", async () => {
      const mine = await signIn();
      await register('someone-else@example.com');
      const theirs = await signIn('someone-else@example.com');

      expect(await service.logout(mine.user.id, theirs.sessionId)).toBe(false);

      expect(
        (await service.listSessions(theirs.user.id)).map((each) => each.id),
      ).toEqual([theirs.sessionId]);
    });

    it('says nothing was ended for a session that has expired', async () => {
      const session = await signIn();
      await dataSource
        .getRepository(SessionEntity)
        .update(
          { id: session.sessionId },
          { expiresAt: '2020-01-01T00:00:00.000Z' },
        );

      expect(await service.logout(session.user.id, session.sessionId)).toBe(
        false,
      );
    });

    it('ends every session of the person with logoutEverywhere, and no one else', async () => {
      const laptop = await signIn();
      await signIn();
      await register('someone-else@example.com');
      const someoneElse = await signIn('someone-else@example.com');

      expect(await service.logoutEverywhere(laptop.user.id)).toBe(2);
      expect(await service.listSessions(laptop.user.id)).toEqual([]);
      expect(await service.listSessions(someoneElse.user.id)).toHaveLength(1);
    });
  });

  describe('listSessions', () => {
    it('lists the session used most recently first, whenever it began', async () => {
      const older = await signIn();
      const newer = await signIn();
      const sessions = dataSource.getRepository(SessionEntity);
      await sessions.update(
        { id: older.sessionId },
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          lastUsedAt: '2026-03-01T00:00:00.000Z',
        },
      );
      await sessions.update(
        { id: newer.sessionId },
        {
          createdAt: '2026-02-01T00:00:00.000Z',
          lastUsedAt: '2026-02-01T00:00:00.000Z',
        },
      );

      expect(
        (await service.listSessions(older.user.id)).map((each) => each.id),
      ).toEqual([older.sessionId, newer.sessionId]);
    });

    it('lists only the sessions still signed in, newest first', async () => {
      const revoked = await signIn();
      const expired = await signIn();
      const live = await signIn();
      await service.logout(revoked.user.id, revoked.sessionId);
      await dataSource
        .getRepository(SessionEntity)
        .update(
          { id: expired.sessionId },
          { expiresAt: '2020-01-01T00:00:00.000Z' },
        );
      await dataSource.getRepository(SessionEntity).update(
        { id: live.sessionId },
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          lastUsedAt: '2026-01-01T00:00:00.000Z',
        },
      );
      const newest = await signIn();

      expect(
        (await service.listSessions(live.user.id)).map((each) => each.id),
      ).toEqual([newest.sessionId, live.sessionId]);
    });
  });
});
