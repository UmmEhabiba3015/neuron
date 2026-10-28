import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  TICK_MILLISECONDS,
  createRecorder,
  microphoneRefusal,
  type Capture,
  type Clock,
  type Kept,
  type Started,
} from './recorder.ts';

const LIMIT = 10_000;

/* A clock that moves only when the test says, and runs what is due. */
function fakeClock() {
  let now = 0;
  let timers: { at: number; every?: number; run: () => void; id: number }[] =
    [];
  let next = 0;

  const add = (at: number, run: () => void, every?: number) => {
    const id = (next += 1);
    timers.push({ at, run, every, id });

    return () => {
      timers = timers.filter((timer) => timer.id !== id);
    };
  };

  const clock: Clock = {
    now: () => now,
    every: (ms, run) => add(now + ms, run, ms),
    after: (ms, run) => add(now + ms, run),
  };

  function advance(ms: number) {
    const until = now + ms;

    for (;;) {
      const due = timers
        .filter((timer) => timer.at <= until)
        .sort((a, b) => a.at - b.at)[0];

      if (!due) {
        break;
      }

      now = due.at;

      if (due.every) {
        due.at += due.every;
      } else {
        timers = timers.filter((timer) => timer.id !== due.id);
      }

      due.run();
    }

    now = until;
  }

  return { clock, advance, pending: () => timers.length };
}

/* A microphone whose answer the test gives, and a capture that records calls. */
function fakeMicrophone() {
  const calls: string[] = [];
  let answer: (started: Started) => void = () => {};
  const audio = new Blob([new Uint8Array([1, 2, 3])], {
    type: 'audio/webm;codecs=opus',
  });

  const capture: Capture = {
    type: 'audio/webm',
    pause: () => calls.push('pause'),
    resume: () => calls.push('resume'),
    stop: async () => {
      calls.push('stop');
      return audio;
    },
    discard: () => calls.push('discard'),
  };

  return {
    calls,
    audio,
    capture,
    microphone: {
      start: () => {
        calls.push('ask');
        return new Promise<Started>((resolve) => {
          answer = resolve;
        });
      },
    },
    give: () => answer({ kind: 'started', capture }),
    refuse: (why: 'denied' | 'missing') => answer({ kind: 'refused', why }),
  };
}

function setUp() {
  const time = fakeClock();
  const mic = fakeMicrophone();
  const kept: Kept[] = [];
  const recorder = createRecorder({
    microphone: mic.microphone,
    clock: time.clock,
    keep: (memo) => kept.push(memo),
    maxMilliseconds: LIMIT,
  });

  async function recording() {
    const started = recorder.start();
    mic.give();
    await started;
  }

  return { time, mic, kept, recorder, recording };
}

test('it opens ready, and asks for the microphone only when Start is pressed', () => {
  const { recorder, mic } = setUp();

  assert.deepEqual(recorder.getState(), { phase: 'ready', microphone: 'idle' });
  assert.deepEqual(mic.calls, []);
});

test('while the browser asks it says so, and a second press asks nothing more', async () => {
  const { recorder, mic } = setUp();

  const started = recorder.start();
  void recorder.start();

  assert.deepEqual(recorder.getState(), {
    phase: 'ready',
    microphone: 'asking',
  });
  assert.deepEqual(mic.calls, ['ask']);

  mic.give();
  await started;

  assert.deepEqual(recorder.getState(), {
    phase: 'recording',
    elapsedMs: 0,
    confirmingCancel: false,
  });
});

test('a refused or missing microphone is said, and Start asks again', async () => {
  const { recorder, mic } = setUp();

  let started = recorder.start();
  mic.refuse('denied');
  await started;
  assert.deepEqual(recorder.getState(), {
    phase: 'ready',
    microphone: 'denied',
  });

  started = recorder.start();
  mic.refuse('missing');
  await started;
  assert.deepEqual(recorder.getState(), {
    phase: 'ready',
    microphone: 'missing',
  });
  assert.deepEqual(mic.calls, ['ask', 'ask']);
});

test('the running time counts recorded time, and is drawn again as it runs', async () => {
  const { recorder, recording, time } = setUp();
  await recording();

  let drawn = 0;
  recorder.subscribe(() => (drawn += 1));

  time.advance(2_600);

  assert.equal(drawn, Math.floor(2_600 / TICK_MILLISECONDS));
  assert.deepEqual(recorder.getState(), {
    phase: 'recording',
    elapsedMs: 2_500,
    confirmingCancel: false,
  });
});

test('pause stops the clock, and resume carries on from where it was', async () => {
  const { recorder, recording, time, mic } = setUp();
  await recording();

  time.advance(3_000);
  recorder.pause();
  time.advance(5_000);

  assert.deepEqual(recorder.getState(), {
    phase: 'paused',
    elapsedMs: 3_000,
    confirmingCancel: false,
  });

  recorder.resume();
  time.advance(1_000);

  assert.deepEqual(recorder.getState(), {
    phase: 'recording',
    elapsedMs: 4_000,
    confirmingCancel: false,
  });
  assert.deepEqual(mic.calls, ['ask', 'pause', 'resume']);
});

test('stop and keep hands over the audio, its type and its length, once', async () => {
  const { recorder, recording, time, mic, kept } = setUp();
  await recording();

  time.advance(1_500);
  recorder.pause();
  time.advance(9_000);
  await recorder.stopAndKeep();
  await recorder.stopAndKeep();

  assert.deepEqual(kept, [
    { audio: mic.audio, type: 'audio/webm;codecs=opus', durationMs: 1_500 },
  ]);
  assert.deepEqual(recorder.getState(), {
    phase: 'kept',
    byLimit: false,
    durationMs: 1_500,
  });
  assert.deepEqual(mic.calls, ['ask', 'pause', 'stop']);
  assert.equal(time.pending(), 0);
});

test('a memo stopped at once is still a millisecond long, which the API accepts', async () => {
  const { recorder, recording, kept } = setUp();
  await recording();

  await recorder.stopAndKeep();

  assert.equal(kept[0].durationMs, 1);
});

test('a clock that counts in fractions still keeps a whole number of milliseconds', async () => {
  const { recorder, recording, time, kept } = setUp();
  await recording();

  time.advance(1_234.567);
  recorder.pause();
  recorder.resume();
  time.advance(0.6);
  await recorder.stopAndKeep();

  assert.equal(kept[0].durationMs, 1_235);
  assert.ok(Number.isInteger(kept[0].durationMs));
});

test('at the limit it stops and keeps by itself, at exactly the limit, and says so', async () => {
  const { recorder, recording, time, kept } = setUp();
  await recording();

  time.advance(4_000);
  recorder.pause();
  time.advance(60_000);
  recorder.resume();
  time.advance(LIMIT);
  await Promise.resolve();

  assert.equal(kept.length, 1);
  assert.equal(kept[0].durationMs, LIMIT);
  assert.deepEqual(recorder.getState(), {
    phase: 'kept',
    byLimit: true,
    durationMs: LIMIT,
  });
});

test('the limit does not run while paused', async () => {
  const { recorder, recording, time, kept } = setUp();
  await recording();

  recorder.pause();
  time.advance(LIMIT * 3);

  assert.equal(kept.length, 0);
  assert.equal(recorder.getState().phase, 'paused');
});

test('cancel asks first, and the recording goes on while it asks', async () => {
  const { recorder, recording, time, mic, kept } = setUp();
  await recording();

  time.advance(1_000);
  recorder.cancel();
  time.advance(1_000);

  assert.deepEqual(recorder.getState(), {
    phase: 'recording',
    elapsedMs: 2_000,
    confirmingCancel: true,
  });

  recorder.keepRecording();
  assert.deepEqual(recorder.getState(), {
    phase: 'recording',
    elapsedMs: 2_000,
    confirmingCancel: false,
  });
  assert.deepEqual(mic.calls, ['ask']);
  assert.deepEqual(kept, []);
});

test('discard drops the audio, keeps nothing, and works only once asked', async () => {
  const { recorder, recording, mic, kept, time } = setUp();
  await recording();

  recorder.discard();
  assert.equal(recorder.getState().phase, 'recording');

  recorder.pause();
  recorder.cancel();
  recorder.discard();

  assert.deepEqual(recorder.getState(), { phase: 'discarded' });
  assert.deepEqual(mic.calls, ['ask', 'pause', 'discard']);
  assert.deepEqual(kept, []);
  assert.equal(time.pending(), 0);
});

test('leaving while recording stops and keeps the memo', async () => {
  const { recorder, recording, time, kept } = setUp();
  await recording();

  time.advance(2_000);
  recorder.leave();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(kept.length, 1);
  assert.equal(kept[0].durationMs, 2_000);
});

test('leaving while the browser asks lets go of the microphone it is then given', async () => {
  const { recorder, mic, kept } = setUp();

  const started = recorder.start();
  recorder.leave();
  mic.give();
  await started;

  assert.deepEqual(mic.calls, ['ask', 'discard']);
  assert.deepEqual(kept, []);
  assert.deepEqual(recorder.getState(), { phase: 'ready', microphone: 'idle' });
});

test('leaving before anything is asked changes nothing, so the page can be drawn again', async () => {
  const { recorder, recording, kept } = setUp();

  recorder.leave();
  await recording();

  assert.equal(recorder.getState().phase, 'recording');
  assert.deepEqual(kept, []);
});

test('an error from the browser is a missing microphone or a refused one', () => {
  assert.equal(microphoneRefusal('NotFoundError'), 'missing');
  assert.equal(microphoneRefusal('OverconstrainedError'), 'missing');
  assert.equal(microphoneRefusal('NotAllowedError'), 'denied');
  assert.equal(microphoneRefusal('SecurityError'), 'denied');
  assert.equal(microphoneRefusal('NotReadableError'), 'denied');
});
