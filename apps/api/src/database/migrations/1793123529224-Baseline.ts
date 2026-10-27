import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * The whole schema, on Postgres, in one step (feature 8). It is today's
 * schema as the fifteen SQLite migrations left it, written out by hand from
 * that database and not generated: every table, column, default, NOT NULL,
 * primary key, foreign key with its ON DELETE, unique index and CHECK. Git
 * keeps the fifteen; nothing here depends on them.
 *
 * Nothing changes meaning on the way:
 *
 *   - Every time and date stays text, in the format the application writes
 *     (ISO 8601 for an instant, YYYY-MM-DD for a day), so the application's
 *     clock decides every value and comparing two of them is still comparing
 *     text (ADR-015).
 *   - Every foreign key is ON DELETE NO ACTION, as it was: a row cannot go
 *     while another points at it, so deleting an account deletes children
 *     first (ADR-024).
 *   - An address is one account whatever its capitals: UQ_users_email is on
 *     lower(email), which TypeORM cannot declare on the entity, so the entity
 *     marks it synchronize: false and it lives only here.
 *   - CHK_entries_kind is the same condition, word for word.
 *
 * The primary keys keep the names Postgres gives them (users_pkey and so on);
 * SQLite's had no names at all.
 */
export class Baseline1793123529224 implements MigrationInterface {
  name = 'Baseline1793123529224';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" text PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "created_at" text NOT NULL,
        "password_hash" text NOT NULL,
        "name" text NOT NULL,
        "timezone" text NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_email" ON "users" (lower("email"))
    `);

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
      CREATE TABLE "entries" (
        "id" text PRIMARY KEY NOT NULL,
        "content" text,
        "created_at" text NOT NULL,
        "user_id" text NOT NULL,
        "day_id" text NOT NULL,
        "deleted_at" text,
        "kind" text NOT NULL DEFAULT 'Text',
        "audio_key" text,
        "audio_type" text,
        "duration_ms" integer,
        CONSTRAINT "CHK_entries_kind" CHECK (("kind" = 'Text' AND "content" IS NOT NULL AND "audio_key" IS NULL AND "audio_type" IS NULL AND "duration_ms" IS NULL) OR ("kind" = 'Voice' AND "audio_key" IS NOT NULL AND "audio_type" IS NOT NULL AND "duration_ms" IS NOT NULL)),
        CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_entries_day" FOREIGN KEY ("day_id")
          REFERENCES "days" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_entries_day_id" ON "entries" ("day_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "refresh_token_hash" text NOT NULL,
        "created_at" text NOT NULL,
        "expires_at" text NOT NULL,
        "revoked_at" text,
        "user_agent" text,
        "last_used_at" text NOT NULL,
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "password_resets" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" text NOT NULL,
        "used_at" text,
        "created_at" text NOT NULL,
        CONSTRAINT "FK_password_resets_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_password_resets_token_hash" ON "password_resets" ("token_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_password_resets_user_id" ON "password_resets" ("user_id")
    `);
  }

  /* Children first, as the foreign keys require. */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_resets"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`DROP TABLE "days"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
