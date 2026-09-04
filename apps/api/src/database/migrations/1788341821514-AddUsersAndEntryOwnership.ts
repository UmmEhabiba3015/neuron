import { MigrationInterface, QueryRunner } from 'typeorm';

// `users`, and the column on `entries` that points at it. Nothing checks it
// yet (ADR-009).
//
// `user_id` is nullable deliberately: no user can exist until registration
// arrives on Day 9, so NOT NULL today would need a fictional placeholder owner
// or the deletion of every existing row. This is the expand step of expand,
// backfill, contract; Day 10 contracts it.
//
// Generated SQL, left exactly as generated. It rebuilds the table twice rather
// than altering it because SQLite cannot add a FOREIGN KEY to an existing
// table — the constraint is part of the stored CREATE TABLE text. The rebuild
// is only safe because TypeORM issues `PRAGMA foreign_keys = OFF` around
// migrations. Do not hand-edit to save the second pass.

export class AddUsersAndEntryOwnership1788341821514 implements MigrationInterface {
  name = 'AddUsersAndEntryOwnership1788341821514';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" text PRIMARY KEY NOT NULL,
                "name" text NOT NULL,
                "created_at" text NOT NULL
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_entries"("id", "content", "created_at")
            SELECT "id",
                "content",
                "created_at"
            FROM "entries"
        `);
    await queryRunner.query(`
            DROP TABLE "entries"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_entries"
                RENAME TO "entries"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text,
                CONSTRAINT "FK_73b250bca5e5a24e1343da56168" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_entries"("id", "content", "created_at", "user_id")
            SELECT "id",
                "content",
                "created_at",
                "user_id"
            FROM "entries"
        `);
    await queryRunner.query(`
            DROP TABLE "entries"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_entries"
                RENAME TO "entries"
        `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "entries"
                RENAME TO "temporary_entries"
        `);
    await queryRunner.query(`
            CREATE TABLE "entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries"("id", "content", "created_at", "user_id")
            SELECT "id",
                "content",
                "created_at",
                "user_id"
            FROM "temporary_entries"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_entries"
        `);
    await queryRunner.query(`
            ALTER TABLE "entries"
                RENAME TO "temporary_entries"
        `);
    await queryRunner.query(`
            CREATE TABLE "entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries"("id", "content", "created_at")
            SELECT "id",
                "content",
                "created_at"
            FROM "temporary_entries"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_entries"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
  }
}
