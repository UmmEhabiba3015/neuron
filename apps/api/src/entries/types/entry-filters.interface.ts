import type { EntryKind } from '@neuron/contracts';

export interface EntryFilters {
  word?: string;

  date?: string;

  /* Typed entries only, or voice memos only. Absent is both. */
  kind?: EntryKind;
}
