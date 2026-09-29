import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * users.name becomes users.email. ADR-016.
 *
 * The designs ask for an email and never show a name field, and a name is
 * not an identifier anyone can recover -- there is no "forgot my name" flow
 * that works, and the designs have /restore.
 *
 * Two things change, not one:
 *
 *   the column is renamed
 *   the unique index becomes case-insensitive
 *
 * The second is the part a rename alone would miss. UQ_users_name was a
 * plain unique index, so "Ummi@example.com" and "ummi@example.com" could
 * both register and would be two accounts for one mailbox. Addresses are
 * treated as case-insensitive in practice, so the index is built on
 * lower(email) and the application stores what the user typed.
 *
 * Existing rows are not email addresses -- there is one test account -- so
 * nothing is converted. A production version of this would need a backfill
 * and a way to ask people for an address, which is a migration this project
 * does not need and should not pretend to have.
 */
export class UserNameBecomesEmail1790668948320 implements MigrationInterface {
  name = 'UserNameBecomesEmail1790668948320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_name"`);

    await queryRunner.query(`
      ALTER TABLE "users" RENAME COLUMN "name" TO "email"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_email" ON "users" (lower("email"))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_email"`);

    await queryRunner.query(`
      ALTER TABLE "users" RENAME COLUMN "email" TO "name"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_name" ON "users" ("name")
    `);
  }
}
