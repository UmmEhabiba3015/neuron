import type { MigrationInterface } from 'typeorm';
import { InitialSchema1788262448946 } from './1788262448946-InitialSchema';
import { AddUsersAndEntryOwnership1788341821514 } from './1788341821514-AddUsersAndEntryOwnership';
import { AddUserPasswordHash1789294233406 } from './1789294233406-AddUserPasswordHash';
import { AddUniqueUserName1789295560638 } from './1789295560638-AddUniqueUserName';

type Migration = new () => MigrationInterface;

// Listed by hand rather than by glob: a glob resolves differently under ts-node
// and compiled `dist/`, picks up emitted `.d.ts` files, and when wrong reports
// a database with no migrations to run instead of failing.
//
// Order is this array's order, not the filename's. TypeORM only runs names it
// has not recorded, so a migration inserted above an already-applied one is
// skipped in silence.
export const migrations: Migration[] = [
  InitialSchema1788262448946,
  AddUsersAndEntryOwnership1788341821514,
  AddUserPasswordHash1789294233406,
  AddUniqueUserName1789295560638,
];
