import { DataSource } from 'typeorm';
import { START_POSTGRES_HINT, TEST_DATABASE_URL } from './test-database';

/*
 * Run once, before any test file, by both Jest configurations. Without the
 * server every test that touches the database would fail with its own
 * connection error; this fails the run once, with what to do about it. It
 * never skips: a run that cannot reach the database has not passed.
 */
export default async function checkPostgres(): Promise<void> {
  const server = new DataSource({
    type: 'postgres',
    url: TEST_DATABASE_URL,
    connectTimeoutMS: 5_000,
  });

  try {
    await server.initialize();
  } catch (error) {
    throw new Error(`${START_POSTGRES_HINT}\n${String(error)}`, {
      cause: error,
    });
  }

  await server.destroy();
}
