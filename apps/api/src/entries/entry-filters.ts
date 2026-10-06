/*
 * What narrows a set of entries. The listing and the count take the same
 * object and build the same where clause from it, so adding a filter here
 * reaches both and cannot reach only one.
 */
export interface EntryFilters {
  word?: string;

  /*
   * A calendar date, YYYY-MM-DD: the entries that belong to the day with that
   * date. Not a range on created_at -- an entry is given its day once, when
   * it is written, and this reads that answer back.
   */
  date?: string;
}
