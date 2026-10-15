import { PASSWORD_MIN_LENGTH } from '@neuron/contracts';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

const messagesFor = (body: Record<string, unknown>): string[] =>
  validateSync(plainToInstance(ResetPasswordDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

const valid = { token: 'a-token-from-a-link', password: 'a-long-password' };

describe('ResetPasswordDto', () => {
  it('accepts a token and a password', () => {
    expect(messagesFor(valid)).toEqual([]);
  });

  it('takes the password minimum from the contract, as registration does', () => {
    expect(
      messagesFor({ ...valid, password: 'x'.repeat(PASSWORD_MIN_LENGTH) }),
    ).toEqual([]);
    expect(
      messagesFor({ ...valid, password: 'x'.repeat(PASSWORD_MIN_LENGTH - 1) }),
    ).toEqual([
      `password must be longer than or equal to ${PASSWORD_MIN_LENGTH} characters`,
    ]);
  });

  it('refuses a password longer than registration allows', () => {
    expect(messagesFor({ ...valid, password: 'x'.repeat(129) })).toEqual([
      'password must be shorter than or equal to 128 characters',
    ]);
  });

  it.each([
    ['no token', undefined],
    ['an empty token', ''],
    ['a token that is not text', 42],
    ['a token far longer than any link carries', 'x'.repeat(257)],
  ])('refuses %s', (_label, token) => {
    expect(
      messagesFor({ ...valid, token }).some((message) =>
        message.startsWith('token '),
      ),
    ).toBe(true);
  });
});
