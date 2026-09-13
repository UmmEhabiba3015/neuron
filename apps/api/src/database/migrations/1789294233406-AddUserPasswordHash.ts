import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds the credential column. Day 9's schema change, and the first one made
// against a schema this project has already shipped.
//
// **Hand-corrected after reading what `migration:generate` produced**, which is
// the README's rule about generated SQL earning its keep for the first time.
// The generated version created `password_hash text NOT NULL` and then copied
// the existing rows without supplying a value for it. That works on an empty
// `users` table — there are no rows to copy, so the constraint is never tested
// — and fails with a NOT NULL violation the moment the table has a single user
// in it. The table is empty today, so every test would have passed and the
// failure would have belonged to whoever ran it against a database where
// somebody had registered.
//
// `NOT NULL` is wrong here anyway, and not just inconvenient. A row written
// before this column existed genuinely has no password, and `nullable` says
// that truthfully. A `NOT NULL DEFAULT ''` would be the other way to satisfy
// the constraint and it would be much worse: it invents a credential that
// nothing can ever verify, and "" is a value `argon2.verify` will happily be
// asked about.
//
// The application treats a null hash as an account that cannot log in, which is
// the correct reading of "registered before passwords existed".
export class AddUserPasswordHash1789294233406 implements MigrationInterface {
  name = 'AddUserPasswordHash1789294233406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // A plain ALTER, not the table rebuild TypeORM generated. SQLite cannot add
    // a *constraint* in place, which is why Day 8's foreign key needed the
    // temporary-table dance — but adding a nullable column with no constraint
    // is something it supports directly. One statement instead of four, and no
    // copy of every row.
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "password_hash" text
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite has supported DROP COLUMN since 3.35, and better-sqlite3 ships far
    // newer than that.
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "password_hash"
        `);
  }
}
