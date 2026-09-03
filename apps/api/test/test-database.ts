import { DataSource } from 'typeorm';
import { migrations } from '../src/database/migrations';
import { JournalEntry } from '../src/entries/entry.interface';
import { User } from '../src/users/user.entity';

// The replacement for `new DatabaseSync(':memory:')` plus a copy of the
// `CREATE TABLE` statement, which is what every spec used to open with.
//
// Two things changed and both are improvements. The schema is no longer
// hand-copied into six places — it comes from the migration, so a test now
// runs against the same table a fresh production database would get, and a
// migration that is wrong makes tests fail instead of leaving them agreeing
// with a schema nothing else has. And `synchronize` is not merely absent, it
// is `false` here too: a test database built by schema-on-boot would pass
// while production, which has it switched off, had no table at all.
//
// `:memory:` is a real SQLite database that never touches the filesystem, so
// no test can read or corrupt `apps/api/data/neuron.db`. That guarantee used
// to rest on `overrideProvider(DATABASE)`; it now rests on this function, and
// on the fact that nothing in the suite constructs a DataSource any other way.
export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [JournalEntry, User],
    migrations,
    synchronize: false,
  });

  await dataSource.initialize();
  await dataSource.runMigrations();

  return dataSource;
}

// `app.close()` already destroys the DataSource — `TypeOrmCoreModule`'s
// shutdown hook reaches for whatever sits at the DataSource token, which in
// the end-to-end suite is the one handed in by `overrideProvider`. So this
// checks before it acts: calling `destroy()` twice throws, and a test that
// fails during teardown reports the teardown rather than the real failure.
export async function closeTestDataSource(dataSource: DataSource) {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

// Rows written straight to the table, bypassing `EntriesService.create`,
// because `create()` timestamps with the real clock — and two calls in a row
// land in the same millisecond, leaving `ORDER BY created_at` with no
// tiebreaker and any ordering assertion flaky. Fixing the timestamps in the
// test makes the ordering claim the only variable.
export async function seedEntries(
  dataSource: DataSource,
  entries: JournalEntry[],
): Promise<void> {
  await dataSource.getRepository(JournalEntry).insert(entries);
}
