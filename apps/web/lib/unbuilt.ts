/*
 * Every control that is drawn and does not work yet, with the day it is
 * wired (docs/workers/screens-day-web-screens.md).
 *
 * Each one, when pressed, says the one sentence below and does nothing else.
 * No request is sent. A screen draws an unbuilt control only by naming it
 * here, so this list is the whole of what is still to be wired. Every entry
 * must work, or be gone, before Day 36, when a real person tests the product.
 *
 * `label` is what the control is called on screen. `where` is the screen it
 * is on, so the list can be read without opening the components.
 *
 * `day` is the day of docs/roadmap.md that wires it. Some features are in
 * scope and have no day yet (docs/requirements.md 8): voice memos, "keep this
 * out of memory", and the support resource. Those are NOT_SCHEDULED, which
 * says so rather than inventing a day, and the owner gives each one a day.
 */
export const NOT_BUILT_YET = 'This is not built yet.';

export const NOT_SCHEDULED = 'not scheduled';

export interface Unbuilt {
  label: string;
  day: number | typeof NOT_SCHEDULED;
  where: string;
}

export const UNBUILT = {
  editEntry: {
    label: 'Edit entry',
    day: 18,
    where: 'Today, and the page of a past day',
  },
  sendResetLink: {
    label: 'Send reset link',
    day: 20,
    where: 'Forgot password',
  },
  saveNewPassword: {
    label: 'Save new password',
    day: 20,
    where: 'Choose a new password',
  },
  signedInDevices: {
    label: 'Signed-in devices',
    day: 34,
    where: 'Account',
  },
  signOutEverywhere: {
    label: 'Sign out everywhere',
    day: 34,
    where: 'Account',
  },
  chooseTimezone: {
    label: 'Timezone',
    day: 34,
    where: 'Timezone',
  },
  exportEverything: {
    label: 'Export everything',
    day: 34,
    where: 'Your data',
  },
  deleteAccount: {
    label: 'Delete account',
    day: 34,
    where: 'Your data',
  },
  keepingSince: {
    label: 'Keeping',
    day: 34,
    where: 'You',
  },
  whatLeaves: {
    label: 'What leaves this device',
    day: 22,
    where: 'Privacy',
  },
  whoProcesses: {
    label: 'Who processes it',
    day: 22,
    where: 'Privacy',
  },
  training: {
    label: 'Training',
    day: NOT_SCHEDULED,
    where: 'Privacy',
  },
  modelCanRead: {
    label: 'It can read',
    day: 22,
    where: 'What it sees',
  },
  modelCannotRead: {
    label: 'It cannot read',
    day: 22,
    where: 'What it sees',
  },
  ask: {
    label: 'Ask',
    day: 25,
    where: 'Ask',
  },
  startRecording: {
    label: 'Start recording',
    day: NOT_SCHEDULED,
    where: 'Talk',
  },
  entryMemory: {
    label: 'Use in memory',
    day: NOT_SCHEDULED,
    where: 'Today, and the page of a past day',
  },
  composerMemory: {
    label: 'Keep this out of memory',
    day: NOT_SCHEDULED,
    where: 'Today, under the composer',
  },
  supportResource: {
    label: 'If you want to talk to someone',
    day: NOT_SCHEDULED,
    where: 'Support resource',
  },
} as const satisfies Record<string, Unbuilt>;

export type UnbuiltName = keyof typeof UNBUILT;

/* The names of the controls that have no day yet, in the list's order. */
export function unscheduled(): UnbuiltName[] {
  return (Object.keys(UNBUILT) as UnbuiltName[]).filter(
    (name) => UNBUILT[name].day === NOT_SCHEDULED,
  );
}

/* The day a real person first tests the product. */
export const FIRST_REAL_TEST_DAY = 36;
