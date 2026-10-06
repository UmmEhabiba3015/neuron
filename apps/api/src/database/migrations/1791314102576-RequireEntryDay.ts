import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * SQLite cannot add NOT NULL to an existing column, so the table is rebuilt,
 * and a rebuild keeps only what is written out again: every column, both
 * foreign keys and IDX_entries_day_id.
 *
 * TypeORM switches PRAGMA foreign_keys OFF for the whole of a migration run
 * and back ON afterwards. So nothing below is checked by SQLite while it
 * runs: the copy into the new table would accept a day_id that points at no
 * day. That is why the second refusal exists.
 *
 * Each constraint keeps FOREIGN KEY (...) REFERENCES "table" on one line.
 * TypeORM reads a constraint's name back out of the stored CREATE TABLE with
 * a pattern that allows one space there and not a line break. Written across
 * two lines the key works and TypeORM cannot see what it is called.
 *
 * The index is created last. DROP TABLE removes a table's indexes with it,
 * and index names are global in SQLite, so the name is not free until then.
 */
export class RequireEntryDay1791314102576 implements MigrationInterface {
  name = 'RequireEntryDay1791314102576';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const withoutDay = (await queryRunner.query(
      `SELECT COUNT(*) AS count FROM "entries" WHERE "day_id" IS NULL`,
    )) as { count: number }[];
    const daylessCount = withoutDay[0].count;

    if (daylessCount > 0) {
      throw new Error(
        `Cannot require a day: ${daylessCount} entries have no day_id. ` +
          `Point each of them at a row in days, or delete them, then run this ` +
          `migration again. This migration refuses to choose a day for them, ` +
          `because that would write the 4am rule in a third place, and it ` +
          `refuses to delete them, because somebody wrote them.`,
      );
    }

    const withMissingDay = (await queryRunner.query(`
            SELECT COUNT(*) AS count FROM "entries"
            WHERE "day_id" IS NOT NULL
              AND "day_id" NOT IN (SELECT "id" FROM "days")
        `)) as { count: number }[];
    const danglingCount = withMissingDay[0].count;

    if (danglingCount > 0) {
      throw new Error(
        `Cannot require a day: ${danglingCount} entries have a day_id that ` +
          `matches no row in days. Point each of them at a day that exists, ` +
          `or delete them, then run this migration again. Foreign keys are ` +
          `not checked while a migration runs, so this migration checks.`,
      );
    }

    await queryRunner.query(`
            CREATE TABLE "entries_with_day" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text NOT NULL,
                "day_id" text NOT NULL,
                CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_entries_day" FOREIGN KEY ("day_id") REFERENCES "days" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries_with_day" ("id", "content", "created_at", "user_id", "day_id")
            SELECT "id", "content", "created_at", "user_id", "day_id" FROM "entries"
        `);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`
            ALTER TABLE "entries_with_day" RENAME TO "entries"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_entries_day_id" ON "entries" ("day_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "entries_nullable_day" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text NOT NULL,
                "day_id" text,
                CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries_nullable_day" ("id", "content", "created_at", "user_id", "day_id")
            SELECT "id", "content", "created_at", "user_id", "day_id" FROM "entries"
        `);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`
            ALTER TABLE "entries_nullable_day" RENAME TO "entries"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_entries_day_id" ON "entries" ("day_id")
        `);
  }
}
