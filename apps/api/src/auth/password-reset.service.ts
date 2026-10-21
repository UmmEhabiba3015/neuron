import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PASSWORD_RESET_LIFETIME_MINUTES } from '@neuron/contracts';
import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { MailService } from '../shared/mail/mail.service';
import { UsersService } from '../users/users.service';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { hashToken } from './hash-token';
import { PasswordResetsRepository } from './password-resets.repository';
import { PasswordService } from './password.service';
import { SessionsRepository } from './sessions.repository';

/* As many random bytes as a refresh token has. */
export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_LIFETIME_MS =
  PASSWORD_RESET_LIFETIME_MINUTES * 60_000;

export const RESET_EMAIL_SUBJECT = 'Reset your Neuron password';

/* Her words (docs/features.md, Ref 4; decided 2026-10-15). */
export const resetEmailText = (link: string): string =>
  'Someone asked to reset the password of the Neuron account for this ' +
  'email. If it was you, open this link to choose a new password. It works ' +
  `once, for ${PASSWORD_RESET_LIFETIME_MINUTES} minutes: ${link}. If it was ` +
  'not you, ignore this email; your password has not changed.';

/*
 * A forgotten password (docs/features.md, Ref 4). A person asks for a link
 * by email, and whoever opens the link may choose a new password once,
 * within PASSWORD_RESET_LIFETIME_MINUTES.
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly resetsRepository: PasswordResetsRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly mailService: MailService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly dataSource: DataSource,
  ) {}

  /*
   * Starts request() and returns before any of it is done, so the answer to
   * the person does not wait for the lookup, the insert or the email. Its
   * timing is then the same whether or not an account uses the address.
   * A failure cannot reach the person, whose answer has already gone, so it
   * is written to the log.
   */
  requestInBackground(email: string): void {
    this.request(email).catch((error: unknown) => {
      this.logger.error(
        'A password reset could not be requested.',
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  /* For an address no account uses, this does nothing at all. */
  async request(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return;
    }

    const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
    const now = new Date();

    const reset = new PasswordResetEntity();
    reset.id = randomUUID();
    reset.userId = user.id;
    reset.tokenHash = hashToken(token);
    reset.createdAt = now.toISOString();
    reset.expiresAt = new Date(
      now.getTime() + PASSWORD_RESET_LIFETIME_MS,
    ).toISOString();
    reset.usedAt = null;

    await this.resetsRepository.save(reset);

    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    const link = `${webOrigin}/reset?token=${token}`;

    await this.mailService.send({
      to: user.email,
      subject: RESET_EMAIL_SUBJECT,
      text: resetEmailText(link),
    });
  }

  /*
   * Answers false, and changes nothing, for a token that is unknown, expired
   * or already used. The three are one answer, so the caller cannot tell
   * them apart and neither can anyone it tells.
   *
   * The password is hashed before the transaction opens. Hashing is slow on
   * purpose, and the database has one connection, so anything another
   * request asked of it meanwhile would land inside this transaction.
   *
   * Inside it, the reset is marked used first and only if it is still
   * unused, so of two requests with the same link only one gets past it.
   * Then the new hash, then every other unused reset of the person ends, so
   * an older link in the inbox cannot undo this one, then every session
   * ends. Nothing signs the person in.
   *
   * The repositories are not handed the transaction's manager. They do not
   * need it: SQLite here has the one connection, so every query on it while
   * the transaction is open is inside it, as in EntriesService.create.
   */
  async reset(token: string, password: string): Promise<boolean> {
    const found = await this.resetsRepository.findByTokenHash(hashToken(token));
    const now = new Date().toISOString();

    if (!found || found.usedAt !== null || found.expiresAt <= now) {
      return false;
    }

    const passwordHash = await this.passwordService.hash(password);

    return this.dataSource.transaction(async () => {
      if (!(await this.resetsRepository.markUsed(found.id, now))) {
        return false;
      }

      await this.usersService.setPasswordHash(found.userId, passwordHash);
      await this.resetsRepository.markAllUsedForUser(found.userId, now);
      await this.sessionsRepository.revokeAllForUser(found.userId, now);

      return true;
    });
  }
}
