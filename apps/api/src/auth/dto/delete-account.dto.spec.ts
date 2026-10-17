import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DeleteAccountDto } from './delete-account.dto';

const messagesFor = (body: Record<string, unknown>): string[] =>
  validateSync(plainToInstance(DeleteAccountDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('DeleteAccountDto', () => {
  it('accepts a password, whatever it is', () => {
    expect(messagesFor({ password: 'x' })).toEqual([]);
  });

  it.each([
    ['nothing', undefined],
    ['an empty password', ''],
    ['a number', 42],
  ])('refuses %s', (_label, password) => {
    expect(messagesFor({ password }).length).toBeGreaterThan(0);
  });
});
