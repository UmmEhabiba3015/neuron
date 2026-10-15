import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ForgotPasswordDto } from './forgot-password.dto';

const messagesFor = (body: Record<string, unknown>): string[] =>
  validateSync(plainToInstance(ForgotPasswordDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('ForgotPasswordDto', () => {
  it('accepts an address', () => {
    expect(messagesFor({ email: 'umer@example.com' })).toEqual([]);
  });

  it.each([
    ['nothing', undefined],
    ['a bare name', 'umer'],
    ['a number', 42],
  ])('refuses %s', (_label, email) => {
    expect(messagesFor({ email })).toContain('email must be an email address');
  });

  it('refuses an address longer than any address can be', () => {
    expect(
      messagesFor({ email: `${'a'.repeat(250)}@example.com` }),
    ).toContainEqual(expect.stringContaining('shorter than or equal to 254'));
  });
});
