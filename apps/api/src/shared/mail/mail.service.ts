import { Injectable, Logger } from '@nestjs/common';
import type { Email } from '../types/email.interface';

/*
 * How the API sends an email. The rest of the API asks this to send one and
 * does not know how it is sent (ADR-022).
 *
 * Until feature 8, Going live, there is no real sending. The whole email,
 * any link in it included, is written to the API's log, and she copies the
 * link from the terminal where `pnpm dev` runs. A link in a log is a working
 * key to an account, which is safe only while she is the one reader of the
 * log.
 *
 * It lives in shared/ because sending mail belongs to no one domain: a reset
 * link is the first email, and it will not be the last.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  send(email: Email): Promise<void> {
    this.logger.log(
      [
        `Email to ${email.to}`,
        `Subject: ${email.subject}`,
        '',
        email.text,
      ].join('\n'),
    );

    return Promise.resolve();
  }
}
