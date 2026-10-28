/*
 * Every control that is drawn and does not work yet, with the feature that
 * wires it.
 *
 * Each one, when pressed, says the one sentence below and does nothing else.
 * No request is sent. A screen draws an unbuilt control only by naming it
 * here, so this list is the whole of what is still to be wired. Every entry
 * must work, or be gone, before feature 16, when a real person tests the
 * product.
 *
 * `label` is what the control is called on screen. `where` is the screen it
 * is on, so the list can be read without opening the components.
 *
 * `feature` is the number of the feature in docs/roadmap.md that wires it.
 * What each feature does is in docs/features.md.
 */
export const NOT_BUILT_YET = 'This is not built yet.';

export interface Unbuilt {
  label: string;
  feature: number;
  where: string;
}

export const UNBUILT = {
  whatLeaves: {
    label: 'What leaves this device',
    feature: 15,
    where: 'Privacy',
  },
  whoProcesses: {
    label: 'Who processes it',
    feature: 15,
    where: 'Privacy',
  },
  training: {
    label: 'Training',
    feature: 15,
    where: 'Privacy',
  },
  modelCanRead: {
    label: 'It can read',
    feature: 12,
    where: 'What it sees',
  },
  modelCannotRead: {
    label: 'It cannot read',
    feature: 12,
    where: 'What it sees',
  },
  ask: {
    label: 'Ask',
    feature: 12,
    where: 'Ask',
  },
  supportResource: {
    label: 'If you want to talk to someone',
    feature: 15,
    where: 'Support resource',
  },
} as const satisfies Record<string, Unbuilt>;

export type UnbuiltName = keyof typeof UNBUILT;

/* The feature in which a real person first tests the product. */
export const FIRST_REAL_TEST_FEATURE = 16;
