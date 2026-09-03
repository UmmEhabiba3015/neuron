import { MigrationInterface, QueryRunner } from 'typeorm';

// The schema as it stood at the end of Day 7, written down for the first time.
//
// Until today this table was created by `CREATE TABLE IF NOT EXISTS` running at
// every boot, which meant a fresh database got its schema from whichever
// version of the code happened to start first, and an existing one silently
// kept whatever it already had. ADR-010 records the demonstration: adding a
// column to that statement produced two different schemas on two machines from
// one commit, and nothing reported it.
//
// This file is the replacement. It was produced by `pnpm migration:generate`
// against an empty database, so the SQL below is TypeORM's own reading of the
// entity — not a hand-copy of the old statement — and the fact that it matches
// the old statement column for column is what says the driver swap changed no
// schema. `created_at` is TEXT holding an ISO-8601 string, which is why an
// existing development database still opens.

export class InitialSchema1788262448946 implements MigrationInterface {
  name = 'InitialSchema1788262448946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "entries"
        `);
  }
}
