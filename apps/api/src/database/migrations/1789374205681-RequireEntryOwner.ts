import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequireEntryOwner1789374205681 implements MigrationInterface {
  name = 'RequireEntryOwner1789374205681';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT COUNT(*) AS count FROM "entries" WHERE "user_id" IS NULL`,
    )) as { count: number }[];
    const orphanCount = rows[0].count;

    if (orphanCount > 0) {
      throw new Error(
        `Cannot require an owner: ${orphanCount} entries have no user_id. ` +
          `Assign them to a user or delete them, then run this migration again. ` +
          `This migration refuses to guess which, because both answers lose data ` +
          `that somebody may want.`,
      );
    }

    await queryRunner.query(`
            CREATE TABLE "entries_with_owner" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text NOT NULL,
                CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id")
                    REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries_with_owner" ("id", "content", "created_at", "user_id")
            SELECT "id", "content", "created_at", "user_id" FROM "entries"
        `);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`
            ALTER TABLE "entries_with_owner" RENAME TO "entries"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "entries_nullable_owner" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text,
                CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id")
                    REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries_nullable_owner" ("id", "content", "created_at", "user_id")
            SELECT "id", "content", "created_at", "user_id" FROM "entries"
        `);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`
            ALTER TABLE "entries_nullable_owner" RENAME TO "entries"
        `);
  }
}
