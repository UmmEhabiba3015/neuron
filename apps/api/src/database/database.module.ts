import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Module } from '@nestjs/common';

// Nest normally identifies a provider by its class: a constructor asking for
// `EntriesService` is enough, because the class itself is the lookup key.
// `DatabaseSync` can't work that way — it comes from Node, not from us, and we
// don't want a second, differently-configured instance to be constructible by
// accident. So we invent our own key. A Symbol is unique by construction: no
// other token can ever collide with this one, even if some future module also
// wants to be called "DATABASE". Anything asking for this exact symbol gets
// this exact connection.
export const DATABASE = Symbol('DATABASE');

// Where the file lives. `process.env` is read directly here, not through
// @nestjs/config — configuration is a Day 6 problem, and one environment
// variable does not yet justify a whole configuration module.
//
// The default is anchored to this file's location rather than to
// `process.cwd()`, so the database is always `apps/api/data/neuron.db` whether
// you run `pnpm dev` (cwd = apps/api) or `node apps/api/dist/main.js` from the
// repo root. `__dirname` is `apps/api/{src,dist}/database` in either case,
// hence two levels up. An explicit DATABASE_PATH is resolved from the cwd
// instead, because that's where a person typing one expects it to land.
const databasePath = process.env.DATABASE_PATH
  ? resolve(process.cwd(), process.env.DATABASE_PATH)
  : resolve(__dirname, '../..', 'data/neuron.db');

// A "factory provider": instead of Nest calling `new SomeClass()`, it calls
// this function once and hands the result to everyone who asks for DATABASE.
// That indirection is the entire point of task-1 — because nothing constructs
// its own connection, a test can supply an in-memory database under the same
// token and the code under test never notices the difference.
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): DatabaseSync => {
        // SQLite will not create missing directories for us; it just fails to
        // open the file.
        mkdirSync(dirname(databasePath), { recursive: true });

        const db = new DatabaseSync(databasePath);

        // Schema-on-boot is deliberately primitive. It works precisely because
        // the schema has only ever grown one way; the moment a column needs to
        // change type or be dropped, this stops being enough and real migration
        // tooling gets evaluated. That is a later decision, not an oversight.
        //
        // Columns are snake_case because that is SQL convention, while the
        // TypeScript interface is camelCase because that is JS convention. The
        // mismatch is real and is mapped explicitly in EntriesService rather
        // than resolved by making one side speak the other's dialect.
        db.exec(`
          CREATE TABLE IF NOT EXISTS entries (
            id         TEXT PRIMARY KEY,
            content    TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `);

        return db;
      },
    },
  ],
  // A provider is private to its module unless exported. Without this line,
  // EntriesModule could import DatabaseModule and still not resolve DATABASE.
  exports: [DATABASE],
})
export class DatabaseModule {}
