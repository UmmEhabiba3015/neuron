import { PasswordResetEntity } from '../auth/entities/password-reset.entity';
import { SessionEntity } from '../auth/entities/session.entity';
import { DayEntity } from '../days/entities/day.entity';
import { EntryEntity } from '../entries/entities/entry.entity';
import { UserEntity } from '../users/entities/user.entity';

/*
 * The one entity list. Register an entity here and nowhere else: the
 * application, the e2e harness and the specs all import it.
 */
export const entities = [
  EntryEntity,
  DayEntity,
  UserEntity,
  SessionEntity,
  PasswordResetEntity,
];
