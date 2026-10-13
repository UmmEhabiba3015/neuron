import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateEntryDto } from './update-entry.dto';

const messagesFor = (body: unknown): string[] =>
  validateSync(plainToInstance(UpdateEntryDto, body)).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

const EMPTY_BODY_MESSAGE =
  'the request body must contain at least one field to update';
const WHITESPACE_MESSAGE =
  'content must contain at least one character that is not whitespace';

describe('UpdateEntryDto', () => {
  it('should accept a body carrying content', () => {
    expect(messagesFor({ content: 'the second draft' })).toEqual([]);
  });

  it('should accept content padded with whitespace', () => {
    expect(messagesFor({ content: '  the spacing I chose  ' })).toEqual([]);
  });

  it('should reject an empty body', () => {
    expect(messagesFor({})).toEqual([EMPTY_BODY_MESSAGE]);
  });

  it('should tell an empty-body sender what the body needs', () => {
    expect(messagesFor({})[0]).toContain('at least one field');
  });

  it('should treat a content field of undefined as no field at all', () => {
    expect(messagesFor({ content: undefined })).toEqual([EMPTY_BODY_MESSAGE]);
  });

  it('should reject a field named literally undefined', () => {
    expect(messagesFor({ undefined: 'x' })).toEqual([EMPTY_BODY_MESSAGE]);
    expect(messagesFor({ undefined: 'x', content: 'real text' })).toEqual([
      EMPTY_BODY_MESSAGE,
    ]);
  });

  it('should reject a content field of null', () => {
    expect(messagesFor({ content: null })).toEqual([
      'content must be a string',
    ]);
  });

  it('should reject content that is not a string', () => {
    expect(messagesFor({ content: 42 })).toEqual(['content must be a string']);
  });

  it('should reject empty content', () => {
    expect(messagesFor({ content: '' })).toEqual([WHITESPACE_MESSAGE]);
  });

  it('should reject content that is only whitespace', () => {
    expect(messagesFor({ content: '   ' })).toEqual([WHITESPACE_MESSAGE]);
  });

  it('should answer empty content with the content rule alone', () => {
    expect(messagesFor({ content: '' })).not.toContain(EMPTY_BODY_MESSAGE);
  });
});
