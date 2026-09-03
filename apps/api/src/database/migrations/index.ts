import type { MigrationInterface } from 'typeorm';
import { InitialSchema1788262448946 } from './1788262448946-InitialSchema';
import { AddUsersAndEntryOwnership1788341821514 } from './1788341821514-AddUsersAndEntryOwnership';

// A migration is a class TypeORM constructs itself, so what is listed below is
// the constructor rather than an instance.
type Migration = new () => MigrationInterface;

// Every migration, listed by hand and in the order they must run.
//
// TypeORM's documented alternative is a glob — `migrations: ['dist/**/*.js']`
// — and it was rejected. A glob resolves differently depending on whether the
// process is running TypeScript through ts-node or compiled JavaScript out of
// `dist/`, and it silently picks up the `.d.ts` files `declaration: true`
// emits alongside them. A list that is wrong fails at import; a glob that is
// wrong finds nothing and reports a database with no migrations to run.
//
// The cost is that adding a migration means adding a line here. That is the
// intended cost: a migration nobody listed is a migration nobody runs, and it
// should be noticed while it is being written rather than during a deploy.
//
// Order is the array's order, not the filename's. TypeORM records each name in
// the `migrations` table as it runs and only executes the ones it has not seen,
// so a migration inserted above an already-applied one on a database that has
// run it would be skipped in silence.
export const migrations: Migration[] = [
  InitialSchema1788262448946,
  AddUsersAndEntryOwnership1788341821514,
];
