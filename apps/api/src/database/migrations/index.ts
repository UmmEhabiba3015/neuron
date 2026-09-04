import type { MigrationInterface } from 'typeorm';
import { InitialSchema1788262448946 } from './1788262448946-InitialSchema';
import { AddUsersAndEntryOwnership1788341821514 } from './1788341821514-AddUsersAndEntryOwnership';

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
];
