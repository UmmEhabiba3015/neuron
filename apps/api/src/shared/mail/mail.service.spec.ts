import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

describe('MailService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes the whole email, link included, to the log', async () => {
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    await new MailService().send({
      to: 'umer@example.com',
      subject: 'A subject',
      text: 'Open http://localhost:3001/reset?token=abc to go on.',
    });

    expect(log).toHaveBeenCalledTimes(1);

    const [written] = log.mock.calls[0] as [string];

    expect(written).toContain('umer@example.com');
    expect(written).toContain('Subject: A subject');
    expect(written).toContain(
      'Open http://localhost:3001/reset?token=abc to go on.',
    );
  });
});
