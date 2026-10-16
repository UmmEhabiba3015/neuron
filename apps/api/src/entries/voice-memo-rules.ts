import { BadRequestException } from '@nestjs/common';
import { VOICE_MEMO_MAX_MINUTES, VOICE_MEMO_TYPES } from '@neuron/contracts';

/*
 * What POST /entries/voice accepts. Each rule refuses with a 400.
 *
 * The API cannot hear a recording: it has no audio library, and does not
 * open the file. So the length it is told is checked as a number, and the
 * size of the file is what bounds what a person can send. The size is the
 * longest memo at 320 kbit/s, the highest bitrate any browser records audio
 * at, which is more than twice what the web app asks for.
 */
export const MAX_DURATION_MS = VOICE_MEMO_MAX_MINUTES * 60 * 1000;

const HIGHEST_BITRATE_BITS_PER_SECOND = 320_000;

export const MAX_AUDIO_BYTES =
  (MAX_DURATION_MS / 1000) * (HIGHEST_BITRATE_BITS_PER_SECOND / 8);

/*
 * The whole body, which is the file and the parts of the form around it: its
 * boundaries, its headers and the durationMs field. 64 KiB is far more than
 * they take.
 */
export const MAX_BODY_BYTES = MAX_AUDIO_BYTES + 64 * 1024;

export const AUDIO_FIELD = 'audio';

export const TYPE_REFUSED = `The recording must be ${VOICE_MEMO_TYPES.join(' or ')}`;
export const TOO_LARGE = `The recording must be at most ${MAX_AUDIO_BYTES} bytes`;
export const RECORDING_MISSING = `A voice memo needs its recording, as the one file "${AUDIO_FIELD}"`;

/*
 * The type as the browser recorded it, with or without its parameters, as in
 * audio/webm;codecs=opus. Upper case is the same type (RFC 9110).
 */
export function isAcceptedAudioType(mimetype: string): boolean {
  const [type, ...parameters] = mimetype.split(';');
  const accepted = (VOICE_MEMO_TYPES as readonly string[]).includes(
    type.trim().toLowerCase(),
  );

  return accepted && parameters.every((each) => /^\s*[\w-]+=.+$/.test(each));
}

/*
 * Handed to multer. The type is checked from the part's header, before a
 * byte of the file is read, and the size while it is read: multer stops at
 * the limit and the rest of the body is thrown away, not kept. One file and
 * a handful of fields; anything more is refused.
 */
export const VOICE_MEMO_UPLOAD = {
  limits: {
    fileSize: MAX_AUDIO_BYTES,
    files: 1,
    fields: 4,
    fieldSize: 1024,
  },
  fileFilter(
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, accept: boolean) => void,
  ): void {
    if (isAcceptedAudioType(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new BadRequestException(TYPE_REFUSED), false);
  },
};
