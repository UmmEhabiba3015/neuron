import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * Two things change, not one: the column is renamed, and the unique index
 * becomes case-insensitive. A rename alone would leave a plain unique index,
 * so two addresses that differ only in capital letters would be two accounts
 * for one mailbox. The index is built on lower(email) and the application
 * stores what the user typed.
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
