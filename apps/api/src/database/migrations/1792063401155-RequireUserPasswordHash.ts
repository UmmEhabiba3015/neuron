import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * Every account has had a password since AddUserPasswordHash, and every way
 * of making one stores its hash, so the column is made to say so.
 *
 * If any user has no hash, nothing is changed and the migration says how
 * many. It does not delete them, because each is somebody's account, and it
 * does not invent a password for them.
 *
 * SQLite cannot add NOT NULL to an existing column, so users is rebuilt, the
 * way AddUserNameAndTimezone rebuilt it: the new table is built under another
 * name, the old one is dropped, and the new one is renamed into place, so the
 * keys that sessions, days and entries hold to "users" find it again without
 * being rewritten. UQ_users_email lives on the table and goes with it, so it
 * is created again, last, once its name is free. TypeORM switches foreign
 * keys off while migrations run forwards, which is what allows the DROP, and
 * means nothing is checked on the way, so the last step asks SQLite to check
 * every key itself.
 */
const COLUMNS = `"id", "email", "created_at", "password_hash", "name", "timezone"`;

export class RequireUserPasswordHash1792063401155 implements MigrationInterface {
  name = 'RequireUserPasswordHash1792063401155';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const withoutHash = (await queryRunner.query(
      `SELECT COUNT(*) AS count FROM "users" WHERE "password_hash" IS NULL`,
    )) as { count: number }[];
    const hashlessCount = withoutHash[0].count;

    if (hashlessCount > 0) {
      throw new Error(
        `Cannot require a password: ${hashlessCount} users have no ` +
          `password_hash. Nothing has been changed. Give each of them a ` +
          `password, or delete them yourself if they are not needed, then ` +
          `run this migration again. This migration refuses to delete an ` +
          `account or to invent a password for one.`,
      );
    }

    await rebuildUsers(queryRunner, 'NOT NULL');
  }

  /*
   * The way back is the same rebuild, and it needs foreign keys off for the
   * DROP. When TypeORM reverts a migration it opens the transaction first
   * and switches foreign keys off second, and SQLite ignores that switch
   * inside a transaction. So the transaction TypeORM opened, which holds
   * nothing yet, is closed, the keys are switched off, and a new one is
   * opened. TypeORM commits that one together with the removal of this
   * migration's row, or rolls both back if anything fails.
   *
   * Nothing switches the keys on again inside it: TypeORM's own attempt to,
   * after down(), is ignored for the same reason. The connection is the
   * migration command's, and it ends with the command.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.isTransactionActive) {
      await queryRunner.commitTransaction();
      await queryRunner.query(`PRAGMA foreign_keys = OFF`);
      await queryRunner.startTransaction();
    }

    await rebuildUsers(queryRunner, '');
  }
}

async function rebuildUsers(
  queryRunner: QueryRunner,
  passwordHash: 'NOT NULL' | '',
): Promise<void> {
  await queryRunner.query(`
            CREATE TABLE "users_rebuilt" (
                "id" text PRIMARY KEY NOT NULL,
                "email" text NOT NULL,
                "created_at" text NOT NULL,
                "password_hash" text ${passwordHash},
                "name" text NOT NULL,
                "timezone" text NOT NULL
            )
        `);
  await queryRunner.query(`
            INSERT INTO "users_rebuilt" (${COLUMNS})
            SELECT ${COLUMNS} FROM "users"
        `);
  await queryRunner.query(`DROP TABLE "users"`);
  await queryRunner.query(`
            ALTER TABLE "users_rebuilt" RENAME TO "users"
        `);
  await queryRunner.query(
    `CREATE UNIQUE INDEX "UQ_users_email" ON "users" (lower("email"))`,
  );

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
