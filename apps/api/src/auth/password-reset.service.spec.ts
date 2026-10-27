import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { DataSource } from 'typeorm';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../../test/support/test-database';
import type { EnvironmentVariables } from '../config/env.validation';
import { MailService } from '../shared/mail/mail.service';
import type { Email } from '../shared/types/email.interface';
import { UserEntity } from '../users/entities/user.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { SessionEntity } from './entities/session.entity';
import {
  PASSWORD_RESET_LIFETIME_MS,
  PasswordResetService,
  RESET_EMAIL_SUBJECT,
} from './password-reset.service';
import { PasswordResetsRepository } from './password-resets.repository';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionsRepository } from './sessions.repository';
import { TokenService } from './token.service';

const WEB_ORIGIN = 'http://localhost:3101';
const OLD_PASSWORD = 'the-old-password';
const NEW_PASSWORD = 'a-brand-new-password';

describe('PasswordResetService', () => {
  let dataSource: DataSource;
  let service: PasswordResetService;
  let authService: AuthService;
  let usersService: UsersService;
  let mailService: MailService;
  let sent: Email[];

  const resetRows = () =>
    dataSource
      .getRepository(PasswordResetEntity)
      .find({ order: { createdAt: 'ASC' } });

  const register = async (email: string) =>
    (await usersService.register({
      email,
      password: OLD_PASSWORD,
      name: 'Somebody',
      timezone: 'UTC',
    }))!;

  /* The token, read out of the link in the last email, as she would. */
  const tokenFromLastEmail = (): string => {
    const match = /\/reset\?token=([A-Za-z0-9_-]+)/.exec(sent.at(-1)!.text);

    return match![1];
  };

  const ask = async (email = 'umer@example.com'): Promise<string> => {
    await service.request(email);

    return tokenFromLastEmail();
  };

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const passwordService = new PasswordService();
    const sessionsRepository = new SessionsRepository(
      dataSource.getRepository(SessionEntity),
    );

    usersService = new UsersService(
      new UsersRepository(dataSource.getRepository(UserEntity)),
      passwordService,
    );
    authService = new AuthService(
      usersService,
      passwordService,
      new TokenService(
        new JwtService({
          secret: 'test-only-signing-secret-never-use-this-anywhere-real',
          signOptions: { expiresIn: '15m' },
        }),
      ),
      new RefreshTokenService(),
      sessionsRepository,
    );

    sent = [];
    mailService = new MailService();
    jest.spyOn(mailService, 'send').mockImplementation((email) => {
      sent.push(email);

      return Promise.resolve();
    });

    service = new PasswordResetService(
      usersService,
      passwordService,
      new PasswordResetsRepository(
        dataSource.getRepository(PasswordResetEntity),
      ),
      sessionsRepository,
      mailService,
      new ConfigService<EnvironmentVariables, true>({ WEB_ORIGIN }),
      dataSource,
    );

    await register('umer@example.com');
  });

  afterEach(async () => {
    jest.useRealTimers();
    await closeTestDataSource(dataSource);
  });

  describe('request', () => {
    it('stores only the SHA-256 hash of the token, never the token', async () => {
      const token = await ask();
      const [row] = await resetRows();

      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.tokenHash).not.toContain(token);
      expect(JSON.stringify(await resetRows())).not.toContain(token);
      expect(row.usedAt).toBeNull();
    });

    it('lets the link work for 30 minutes from when it was asked for', async () => {
      await ask();
      const [row] = await resetRows();

      expect(Date.parse(row.expiresAt) - Date.parse(row.createdAt)).toBe(
        PASSWORD_RESET_LIFETIME_MS,
      );
      expect(PASSWORD_RESET_LIFETIME_MS).toBe(30 * 60 * 1000);
    });

    it('sends her email to the address of the account, with the link to the web app', async () => {
      await service.request('UMER@example.com');
      const token = tokenFromLastEmail();

      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe('umer@example.com');
      expect(sent[0].subject).toBe(RESET_EMAIL_SUBJECT);
      expect(RESET_EMAIL_SUBJECT).toBe('Reset your Neuron password');
      expect(sent[0].text).toBe(
        'Someone asked to reset the password of the Neuron account for this ' +
          'email. If it was you, open this link to choose a new password. It ' +
          `works once, for 30 minutes: ${WEB_ORIGIN}/reset?token=${token}. ` +
          'If it was not you, ignore this email; your password has not changed.',
      );
    });

    it('does nothing at all for an address no account uses', async () => {
      await service.request('nobody@example.com');

      expect(sent).toEqual([]);
      expect(await resetRows()).toEqual([]);
    });

    it('gives each request its own link', async () => {
      const first = await ask();
      const second = await ask();

      expect(first).not.toBe(second);
      expect(await resetRows()).toHaveLength(2);
    });
  });

  describe('requestInBackground', () => {
    it('returns before the email is sent', async () => {
      let release!: () => void;
      const send = jest.spyOn(mailService, 'send').mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );

      const returned = service.requestInBackground('umer@example.com');

      expect(returned).toBeUndefined();
      expect(send).not.toHaveBeenCalled();

      await waitFor(() => send.mock.calls.length);
      release();
    });

    it('writes a failure to the log rather than throwing it at anyone', async () => {
      jest
        .spyOn(mailService, 'send')
        .mockRejectedValue(new Error('the mail server is down'));
      const logged = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => undefined);

      service.requestInBackground('umer@example.com');

      await waitFor(() => logged.mock.calls.length);
      expect(String(logged.mock.calls[0][1])).toContain(
        'the mail server is down',
      );
    });
  });

  describe('reset', () => {
    it('stores the new password with argon2id, so it signs in and the old one does not', async () => {
      const token = await ask();

      expect(await service.reset(token, NEW_PASSWORD)).toBe(true);

      const stored = (await usersService.findByEmail('umer@example.com'))!;
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
      expect(
        await authService.login('umer@example.com', NEW_PASSWORD),
      ).toBeDefined();
      expect(
        await authService.login('umer@example.com', OLD_PASSWORD),
      ).toBeUndefined();
    });

    it('marks the reset used, so the same link works once', async () => {
      const token = await ask();

      expect(await service.reset(token, NEW_PASSWORD)).toBe(true);
      expect((await resetRows())[0].usedAt).not.toBeNull();

      expect(await service.reset(token, 'yet-another-password')).toBe(false);
      expect(
        await authService.login('umer@example.com', NEW_PASSWORD),
      ).toBeDefined();
    });

    it('ends every other unused reset of the person, and no one else', async () => {
      await register('someone-else@example.com');
      const older = await ask();
      const theirs = await ask('someone-else@example.com');
      const newer = await ask();

      expect(await service.reset(newer, NEW_PASSWORD)).toBe(true);

      expect(await service.reset(older, 'yet-another-password')).toBe(false);
      expect(await service.reset(theirs, 'their-new-password')).toBe(true);
    });

    it('ends every session of the person, and no one else', async () => {
      await register('someone-else@example.com');
      const laptop = (await authService.login(
        'umer@example.com',
        OLD_PASSWORD,
      ))!;
      const phone = (await authService.login(
        'umer@example.com',
        OLD_PASSWORD,
      ))!;
      const someoneElse = (await authService.login(
        'someone-else@example.com',
        OLD_PASSWORD,
      ))!;

      expect(await service.reset(await ask(), NEW_PASSWORD)).toBe(true);

      expect(await authService.listSessions(laptop.user.id)).toEqual([]);
      expect(
        await authService.refresh(phone.sessionId, phone.refreshToken),
      ).toBeUndefined();
      expect(await authService.listSessions(someoneElse.user.id)).toHaveLength(
        1,
      );
    });

    it('signs nobody in', async () => {
      expect(await service.reset(await ask(), NEW_PASSWORD)).toBe(true);

      expect(await dataSource.getRepository(SessionEntity).find()).toEqual([]);
    });

    it('refuses a token that was never sent, and changes nothing', async () => {
      await ask();

      expect(await service.reset('not-a-real-token', NEW_PASSWORD)).toBe(false);
      expect((await resetRows())[0].usedAt).toBeNull();
      expect(
        await authService.login('umer@example.com', OLD_PASSWORD),
      ).toBeDefined();
    });

    describe('by the clock', () => {
      const askAtTen = async (): Promise<string> => {
        jest.useFakeTimers({
          now: new Date('2026-10-15T10:00:00.000Z'),
          doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval'],
        });

        return ask();
      };

      it('works at the last moment of its 30 minutes', async () => {
        const token = await askAtTen();

        jest.setSystemTime(new Date('2026-10-15T10:29:59.999Z'));
        expect(await service.reset(token, NEW_PASSWORD)).toBe(true);
      });

      it('is refused once its 30 minutes are over, and changes nothing', async () => {
        const token = await askAtTen();

        jest.setSystemTime(new Date('2026-10-15T10:30:00.000Z'));
        expect(await service.reset(token, NEW_PASSWORD)).toBe(false);
        expect((await resetRows())[0].usedAt).toBeNull();
        expect(
          await authService.login('umer@example.com', OLD_PASSWORD),
        ).toBeDefined();
      });
    });

    /*
     * Each step is in the one transaction, so a step that fails takes the
     * ones before it back with it. On Postgres that holds only because every
     * step is handed the transaction's manager: a step sent another way runs
     * on another connection and stays done.
     */
    it('changes nothing when its last step fails: the old password and the link still work', async () => {
      const token = await ask();
      jest
        .spyOn(SessionsRepository.prototype, 'revokeAllForUser')
        .mockRejectedValueOnce(new Error('the database went away'));

      await expect(service.reset(token, NEW_PASSWORD)).rejects.toThrow(
        'the database went away',
      );

      expect((await resetRows())[0].usedAt).toBeNull();
      expect(
        await authService.login('umer@example.com', OLD_PASSWORD),
      ).toBeDefined();
      expect(await service.reset(token, NEW_PASSWORD)).toBe(true);
    });

    it('lets only one of two requests with the same link through', async () => {
      const token = await ask();

      const answers = await Promise.all([
        service.reset(token, 'the-first-password'),
        service.reset(token, 'the-second-password'),
      ]);

      expect(answers.filter(Boolean)).toHaveLength(1);
    });
  });
});

/*
 * Waits until `count` is not zero, for five seconds at most. The work it
 * waits for goes to Postgres over a socket, so it is measured in time and
 * not in turns of the event loop.
 */
async function waitFor(count: () => number): Promise<void> {
  const deadline = Date.now() + 5_000;

  while (count() === 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  expect(count()).toBeGreaterThan(0);
}
