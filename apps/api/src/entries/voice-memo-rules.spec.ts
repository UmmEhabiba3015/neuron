import { BadRequestException } from '@nestjs/common';
import { VOICE_MEMO_MAX_MINUTES } from '@neuron/contracts';
import {
  MAX_AUDIO_BYTES,
  MAX_BODY_BYTES,
  MAX_DURATION_MS,
  TYPE_REFUSED,
  VOICE_MEMO_UPLOAD,
  isAcceptedAudioType,
} from './voice-memo-rules';

describe('the rules of a voice memo upload', () => {
  describe('the type', () => {
    it.each([
      'audio/webm',
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm; codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'AUDIO/WEBM',
    ])('accepts %p', (type) => {
      expect(isAcceptedAudioType(type)).toBe(true);
    });

    it.each([
      'audio/ogg',
      'audio/mpeg',
      'audio/wav',
      'video/webm',
      'video/mp4',
      'text/plain',
      'application/octet-stream',
      '',
      'audio/webm-but-not',
      'audio/webm;',
      'audio/webm;codecs',
    ])('refuses %p', (type) => {
      expect(isAcceptedAudioType(type)).toBe(false);
    });

    it('is checked by multer from the part header, refusing with a 400 that names the types', () => {
      const answers: [Error | null, boolean][] = [];
      const answer = (error: Error | null, accept: boolean) =>
        answers.push([error, accept]);

      VOICE_MEMO_UPLOAD.fileFilter({}, { mimetype: 'audio/mp4' }, answer);
      VOICE_MEMO_UPLOAD.fileFilter({}, { mimetype: 'audio/ogg' }, answer);

      expect(answers[0]).toEqual([null, true]);
      expect(answers[1][1]).toBe(false);
      expect(answers[1][0]).toBeInstanceOf(BadRequestException);
      expect(answers[1][0]?.message).toBe(TYPE_REFUSED);
      expect(TYPE_REFUSED).toBe(
        'The recording must be audio/webm or audio/mp4',
      );
    });
  });

  describe('the length and the size', () => {
    it('allows at most the contract minutes', () => {
      expect(MAX_DURATION_MS).toBe(VOICE_MEMO_MAX_MINUTES * 60_000);
    });

    it('lets a file be as large as the longest memo at 320 kbit/s, and no larger', () => {
      expect(MAX_AUDIO_BYTES).toBe((MAX_DURATION_MS / 1000) * 40_000);
      expect(VOICE_MEMO_UPLOAD.limits.fileSize).toBe(MAX_AUDIO_BYTES);
    });

    it('lets the whole body be the file and a little more for the form around it', () => {
      expect(MAX_BODY_BYTES - MAX_AUDIO_BYTES).toBe(64 * 1024);
    });

    it('takes one file and a handful of short fields', () => {
      expect(VOICE_MEMO_UPLOAD.limits).toMatchObject({
        files: 1,
        fields: 4,
        fieldSize: 1024,
      });
    });
  });
});
