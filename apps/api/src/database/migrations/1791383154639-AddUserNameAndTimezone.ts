import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * Both columns are NOT NULL and neither has a default. A default would let
 * an insert that forgot the value succeed, which is the opposite of
 * required. SQLite only adds a NOT NULL column in place when it is given a
 * default, and cannot take a default away afterwards, so the table is
 * rebuilt.
 *
 * A rebuild keeps only what is written out again. For users that is four
 * columns and UQ_users_email, which is on lower("email") and is what makes
 * two addresses that differ only in capital letters one account.
 *
 * sessions, days and entries each hold a foreign key to users, by name. The
 * new table is built under another name, the old one is dropped, and the new
 * one is renamed into place, so those three keys find a table called users
 * again without being rewritten. Renaming the old table away first would
 * take the three keys with it to the old table's new name.
 *
 * TypeORM switches PRAGMA foreign_keys OFF while migrations run forwards,
 * which is what allows the DROP. It also means nothing is checked while up()
 * runs, so its last step asks SQLite to check every key itself.
 *
 * An existing account is given the part of its address before the @ as its
 * name, and UTC as its timezone, because UTC is the zone its days were in
 * fact worked out in. The 60 is the name limit on the day this was written.
 */
const WHITESPACE = `char(9, 10, 11, 12, 13, 32)`;

const BEFORE_THE_AT = `
    CASE
        WHEN instr("email", '@') > 0 THEN substr("email", 1, instr("email", '@') - 1)
        ELSE "email"
    END`;

const NAME_FROM_EMAIL = `trim(substr(trim(${BEFORE_THE_AT}, ${WHITESPACE}), 1, 60), ${WHITESPACE})`;

export class AddUserNameAndTimezone1791383154639 implements MigrationInterface {
  name = 'AddUserNameAndTimezone1791383154639';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const withoutName = (await queryRunner.query(
      `SELECT COUNT(*) AS count FROM "users" WHERE ${NAME_FROM_EMAIL} = ''`,
    )) as { count: number }[];
    const namelessCount = withoutName[0].count;

    if (namelessCount > 0) {
      throw new Error(
        `Cannot require a name: ${namelessCount} users have an email with ` +
          `nothing before the @, so there is nothing to make a name from. ` +
          `Correct the email of each, then run this migration again. This ` +
          `migration refuses to invent a name for them.`,
      );
    }

    await queryRunner.query(`
            CREATE TABLE "users_with_name" (
                "id" text PRIMARY KEY NOT NULL,
                "email" text NOT NULL,
                "created_at" text NOT NULL,
                "password_hash" text,
                "name" text NOT NULL,
                "timezone" text NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "users_with_name" ("id", "email", "created_at", "password_hash", "name", "timezone")
            SELECT "id", "email", "created_at", "password_hash", ${NAME_FROM_EMAIL}, 'UTC' FROM "users"
        `);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`
            ALTER TABLE "users_with_name" RENAME TO "users"
        `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email" ON "users" (lower("email"))`,
    );

    await refuseBrokenForeignKeys(queryRunner);
  }

  /*
   * No rebuild on the way back. Removing a column is something SQLite does
   * in place, as long as the column is in no index and no key, and these two
   * are in neither.
   *
   * It also has to be done this way. When TypeORM reverts a migration it
   * opens the transaction first and switches foreign keys off second, and
   * SQLite ignores that switch inside a transaction. So foreign keys are
   * still ON here, and DROP TABLE "users" is refused while any session, day
   * or entry points at a user.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}

async function refuseBrokenForeignKeys(
  queryRunner: QueryRunner,
): Promise<void> {
  const broken = (await queryRunner.query(
    `PRAGMA foreign_key_check`,
  )) as unknown[];

  if (broken.length > 0) {
    throw new Error(
      `Rebuilding users left ${broken.length} rows pointing at a user that ` +
        `does not exist. Nothing has been kept: the migration is rolled back.`,
    );
  }
}
