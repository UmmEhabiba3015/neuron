import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_DURATION_MS } from '../voice-memo-rules';
import { CreateVoiceMemoDto } from './create-voice-memo.dto';

/* A multipart form sends every field as text, so these are strings. */
const check = (body: Record<string, unknown>) => {
  const dto = plainToInstance(CreateVoiceMemoDto, body);

  return { dto, failed: validateSync(dto).map((error) => error.property) };
};

describe('CreateVoiceMemoDto', () => {
  it.each([
    ['one millisecond', '1', 1],
    ['a minute and twelve seconds', '72000', 72_000],
    [
      'exactly the longest a memo may be',
      String(MAX_DURATION_MS),
      MAX_DURATION_MS,
    ],
  ])('accepts %s, and reads it as a number', (_label, raw, expected) => {
    const { dto, failed } = check({ durationMs: raw });

    expect(failed).toEqual([]);
    expect(dto.durationMs).toBe(expected);
  });

  it.each([
    ['no length at all', {}],
    ['an empty field', { durationMs: '' }],
    ['zero', { durationMs: '0' }],
    ['a negative length', { durationMs: '-5' }],
    ['a fraction of a millisecond', { durationMs: '1.5' }],
    ['text', { durationMs: 'a minute' }],
    [
      'one millisecond more than the longest',
      { durationMs: String(MAX_DURATION_MS + 1) },
    ],
  ])('refuses %s', (_label, body) => {
    expect(check(body).failed).toEqual(['durationMs']);
  });
});
