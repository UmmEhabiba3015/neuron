import type { MigrationInterface } from 'typeorm';
import { InitialSchema1788262448946 } from './1788262448946-InitialSchema';
import { AddUsersAndEntryOwnership1788341821514 } from './1788341821514-AddUsersAndEntryOwnership';
import { AddUserPasswordHash1789294233406 } from './1789294233406-AddUserPasswordHash';
import { AddUniqueUserName1789295560638 } from './1789295560638-AddUniqueUserName';
import { RequireEntryOwner1789374205681 } from './1789374205681-RequireEntryOwner';
import { AddSessions1790015003339 } from './1790015003339-AddSessions';
import { AddDays1790354879734 } from './1790354879734-AddDays';
import { UserNameBecomesEmail1790668948320 } from './1790668948320-UserNameBecomesEmail';
import { RequireEntryDay1791314102576 } from './1791314102576-RequireEntryDay';
import { AddEntryDeletedAt1791363323870 } from './1791363323870-AddEntryDeletedAt';
import { AddUserNameAndTimezone1791383154639 } from './1791383154639-AddUserNameAndTimezone';

type Migration = new () => MigrationInterface;

export const migrations: Migration[] = [
  InitialSchema1788262448946,
  AddUsersAndEntryOwnership1788341821514,
  AddUserPasswordHash1789294233406,
  AddUniqueUserName1789295560638,
  RequireEntryOwner1789374205681,
  AddSessions1790015003339,
  AddDays1790354879734,
  UserNameBecomesEmail1790668948320,
  RequireEntryDay1791314102576,
  AddEntryDeletedAt1791363323870,
  AddUserNameAndTimezone1791383154639,
];
