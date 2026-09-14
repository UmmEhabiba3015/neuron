import type { MigrationInterface } from 'typeorm';
import { InitialSchema1788262448946 } from './1788262448946-InitialSchema';
import { AddUsersAndEntryOwnership1788341821514 } from './1788341821514-AddUsersAndEntryOwnership';
import { AddUserPasswordHash1789294233406 } from './1789294233406-AddUserPasswordHash';
import { AddUniqueUserName1789295560638 } from './1789295560638-AddUniqueUserName';
import { RequireEntryOwner1789374205681 } from './1789374205681-RequireEntryOwner';

type Migration = new () => MigrationInterface;

export const migrations: Migration[] = [
  InitialSchema1788262448946,
  AddUsersAndEntryOwnership1788341821514,
  AddUserPasswordHash1789294233406,
  AddUniqueUserName1789295560638,
  RequireEntryOwner1789374205681,
];
