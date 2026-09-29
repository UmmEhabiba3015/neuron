/*
 * Which day-document does an instant belong to?
 *
 * 00-flow.md section 0: "A day is a document, and the day ends at 4am." The
 * boundary is 4am rather than midnight because the product's stated hour is
 * 1am, and cutting a person's Tuesday night in half at 00:00 is a database
 * decision leaking into a life.
 *
 * Shifting the instant back by the boundary and taking its date is the whole
 * calculation: 01:30 lands on the previous day, 04:01 on the current one.
 *
 * The offset is applied in UTC. ADR-015 records why there is no timezone yet
 * and when that gets revisited. Because the answer is stored on the row at
 * write time rather than recomputed on read, adding a timezone later changes
 * what new entries resolve to and moves nothing already written.
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
