/*
 * The browser's microphone and MediaRecorder, behind the small Microphone of
 * recorder.ts. This is the whole of the recorder that needs a browser, kept
 * thin so that everything with a rule in it is in recorder.ts, where Node
 * can test it. Nothing here runs until Start is pressed.
 *
 * The type is the first of the contract's that the browser can record:
 * WebM in Chrome, Edge and Firefox, MP4 in Safari. The bitrate asked for,
 * 128 kbit/s, is well under what the API's size limit allows for the longest
 * memo.
 */
import { VOICE_MEMO_TYPES } from '@neuron/contracts';
import {
  microphoneRefusal,
  type Capture,
  type Microphone,
  type Started,
} from './recorder.ts';

const BITS_PER_SECOND = 128_000;

/* How often the browser hands over what it has recorded so far. */
const SLICE_MILLISECONDS = 1_000;

export function browserMicrophone(): Microphone {
  return { start };
}

async function start(): Promise<Started> {
  const type =
    typeof MediaRecorder === 'undefined'
      ? undefined
      : VOICE_MEMO_TYPES.find((each) => MediaRecorder.isTypeSupported(each));

  /* A browser that cannot record, or has no way to reach a microphone. */
  if (!navigator.mediaDevices?.getUserMedia || type === undefined) {
    return { kind: 'refused', why: 'missing' };
  }

  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    return {
      kind: 'refused',
      why: microphoneRefusal(error instanceof Error ? error.name : ''),
    };
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: type,
    audioBitsPerSecond: BITS_PER_SECOND,
  });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  /* The browser's sign that the microphone is in use goes when this runs. */
  const letGo = () => stream.getTracks().forEach((track) => track.stop());

  recorder.start(SLICE_MILLISECONDS);

  const capture: Capture = {
    type: recorder.mimeType || type,
    pause: () => recorder.pause(),
    resume: () => recorder.resume(),
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          letGo();
          resolve(new Blob(chunks, { type: recorder.mimeType || type }));
        };
        recorder.stop();
      }),
    discard: () => {
      recorder.onstop = () => {
        letGo();
        chunks.length = 0;
      };
      recorder.stop();
    },
  };

  return { kind: 'started', capture };
}
