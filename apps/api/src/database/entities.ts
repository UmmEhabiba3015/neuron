import { Session } from '../auth/session.entity';
import { Day } from '../days/day.entity';
import { JournalEntry } from '../entries/entry.entity';
import { User } from '../users/user.entity';

/*
 * The one entity list.
 *
 * This was three lists — the application's, the e2e harness's, and one spec's
 * — and nothing kept them in sync. Adding Day registered it for the running
 * application and left every test building a schema the code no longer
 * matched, which surfaced as 61 failures with an error about metadata rather
 * than about the real cause.
 *
 * A registration that has to be repeated is a registration that will be
 * forgotten, so there is now one array and everything imports it.
 */
export const entities = [JournalEntry, Day, User, Session];
