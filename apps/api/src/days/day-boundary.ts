/*
 * Shifting the instant back by the boundary and taking its date is the whole
 * calculation: 01:30 lands on the previous day, 04:01 on the current one.
 *
 * The offset is applied in UTC (ADR-015). The answer is stored on the row at
 * write time rather than recomputed on read, so adding a timezone later
 * changes what new entries resolve to and moves nothing already written.
 */
export const DAY_BOUNDARY_HOURS = 4;

export function dayFor(instant: string | Date): string {
  const at = typeof instant === 'string' ? new Date(instant) : instant;

  if (Number.isNaN(at.getTime())) {
    throw new TypeError(`Not a valid instant: ${String(instant)}`);
  }

  const shifted = new Date(at.getTime() - DAY_BOUNDARY_HOURS * 60 * 60 * 1000);

  return shifted.toISOString().slice(0, 10);
}
