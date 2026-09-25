import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * The generated version of this migration was 506 lines and rebuilt all four
 * tables. It was discarded for the same defect Day 8 found in
 * AddUserPasswordHash: it created entries.day_id as NOT NULL and then copied
 * the rows without supplying a value, which passes on an empty table and
 * fails as soon as one entry exists. It also dropped UQ_users_name.
 *
 * This is written by hand and does three things:
 *
 *   1. creates days, with UNIQUE(user_id, date) as the business key
 *   2. adds entries.day_id, nullable, so the copy is not needed at all
 *   3. backfills a day for every entry that already has one, and points the
 *      entry at it
 *
 * day_id stays nullable here. Making it NOT NULL is the contract step of
 * expand-backfill-contract and belongs in its own migration, after the
 * application has been writing it for a while. Day 10 made the same split
 * for user_id and it is the reason that one was safe.
 *
 * The backfill computes the day in UTC, which is the deferral recorded in
 * ADR-015: there is no timezone on a user yet. Rows written from here on get
 * their day resolved the same way at write time, so nothing moves later.
 */
export class AddDays1790354879734 implements MigrationInterface {
  name = 'AddDays1790354879734';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "days" (
        "id" text PRIMARY KEY NOT NULL,
        "date" text NOT NULL,
        "mood" text,
        "created_at" text NOT NULL,
        "user_id" text NOT NULL,
        CONSTRAINT "FK_days_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_days_user_date" ON "days" ("user_id", "date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_days_user_date" ON "days" ("user_id", "date" DESC)
    `);

    await queryRunner.query(`
      ALTER TABLE "entries" ADD COLUMN "day_id" text
    `);

    /*
     * One day row per (user, date) that already has entries. The 4am boundary
     * is applied by shifting the instant back four hours before taking its
     * date, so 01:30 on the 9th belongs to the 8th. randomblob(16) gives each
     * row a distinct id without needing a round trip per day.
     */
    await queryRunner.query(`
      INSERT INTO "days" ("id", "date", "mood", "created_at", "user_id")
      SELECT
        lower(hex(randomblob(16))),
        date("created_at", '-4 hours'),
        NULL,
        min("created_at"),
        "user_id"
      FROM "entries"
      WHERE "user_id" IS NOT NULL
      GROUP BY "user_id", date("created_at", '-4 hours')
    `);

    await queryRunner.query(`
      UPDATE "entries"
      SET "day_id" = (
        SELECT "days"."id"
        FROM "days"
        WHERE "days"."user_id" = "entries"."user_id"
          AND "days"."date" = date("entries"."created_at", '-4 hours')
      )
      WHERE "user_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_entries_day_id" ON "entries" ("day_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_entries_day_id"`);
    await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "day_id"`);
    await queryRunner.query(`DROP INDEX "IDX_days_user_date"`);
    await queryRunner.query(`DROP INDEX "UQ_days_user_date"`);
    await queryRunner.query(`DROP TABLE "days"`);
  }
}
