import { Session } from '../auth/session.entity';
import { Day } from '../days/day.entity';
import { JournalEntry } from '../entries/entry.entity';
import { User } from '../users/user.entity';

/*
 * The one entity list. Register an entity here and nowhere else: the
 * application, the e2e harness and the specs all import it.
 */
export const entities = [JournalEntry, Day, User, Session];
