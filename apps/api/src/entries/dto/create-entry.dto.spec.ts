import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateEntryDto } from './create-entry.dto';

const messagesFor = (body: unknown): string[] =>
  validateSync(plainToInstance(CreateEntryDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('CreateEntryDto', () => {
  it('should accept a body carrying only content', () => {
    expect(messagesFor({ content: 'an ordinary entry' })).toEqual([]);
  });

  it('should accept content padded with whitespace', () => {
    expect(messagesFor({ content: '  the spacing I chose  ' })).toEqual([]);
  });

  it('should reject a missing content field', () => {
    expect(messagesFor({})).toEqual(['content must be a string']);
  });

  it('should reject content that is not a string', () => {
    expect(messagesFor({ content: 42 })).toEqual(['content must be a string']);
  });

  it('should answer a non-string with one message and not two', () => {
    expect(messagesFor({ content: 42 })).toHaveLength(1);
  });

  it('should reject content that is null', () => {
    expect(messagesFor({ content: null })).toEqual([
      'content must be a string',
    ]);
  });

  it('should reject empty content', () => {
    expect(messagesFor({ content: '' })).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
  });

  it('should reject content that is only whitespace', () => {
    expect(messagesFor({ content: '   ' })).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
  });

  it('should reject content that is only tabs and newlines', () => {
    expect(messagesFor({ content: '\t\n  \r' })).toEqual([
      'content must contain at least one character that is not whitespace',
    ]);
  });

  it('should name the field in every message it produces', () => {
    for (const body of [{}, { content: 42 }, { content: '   ' }]) {
      for (const message of messagesFor(body)) {
        expect(message).toContain('content');
      }
    }
  });
});
