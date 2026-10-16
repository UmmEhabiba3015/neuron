import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * A voice memo is an entry of another kind, in the same table (ADR-023).
 *
 *   kind         'Text' or 'Voice'. Every entry already written is 'Text',
 *                which is also the column's default.
 *   content      may now be NULL, for a memo that has no transcript yet.
 *   audio_key    the name AudioStorage keeps the memo's file under,
 *   audio_type   the MIME type it was recorded in, and
 *   duration_ms  its length: all three set for a memo, all three NULL for a
 *                typed entry.
 *
 * CHK_entries_kind makes the database hold those rules itself. It also keeps
 * the rule that a typed entry has words, which the NOT NULL on content held
 * until now.
 *
 * SQLite cannot drop NOT NULL or add a CHECK to an existing table, so entries
 * is rebuilt, the way RequireEntryDay rebuilt it, and a rebuild keeps only
 * what is written out again: every column, both foreign keys and
 * IDX_entries_day_id. Nothing points at entries, so no other table is
 * touched. The generated migration also rebuilt password_resets, sessions and
 * days to rename keys that have nothing to do with this change; that was
 * left out.
 *
 * Each foreign key keeps FOREIGN KEY (...) REFERENCES "table" on one line,
 * because TypeORM reads a constraint's name back with a pattern that does not
 * allow a line break there. The index is created last, once DROP TABLE has
 * freed its name. TypeORM switches foreign keys off while migrations run
 * forwards, so the last step asks SQLite to check every key itself.
 */
const OLD_COLUMNS = `"id", "content", "created_at", "user_id", "day_id", "deleted_at"`;

const CHECK_KIND = `CONSTRAINT "CHK_entries_kind" CHECK (("kind" = 'Text' AND "content" IS NOT NULL AND "audio_key" IS NULL AND "audio_type" IS NULL AND "duration_ms" IS NULL) OR ("kind" = 'Voice' AND "audio_key" IS NOT NULL AND "audio_type" IS NOT NULL AND "duration_ms" IS NOT NULL))`;

const FOREIGN_KEYS = `CONSTRAINT "FK_entries_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_entries_day" FOREIGN KEY ("day_id") REFERENCES "days" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`;

export class AddVoiceMemos1792150486058 implements MigrationInterface {
  name = 'AddVoiceMemos1792150486058';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "entries_with_kind" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text,
                "created_at" text NOT NULL,
                "user_id" text NOT NULL,
                "day_id" text NOT NULL,
                "deleted_at" text,
                "kind" text NOT NULL DEFAULT ('Text'),
                "audio_key" text,
                "audio_type" text,
                "duration_ms" integer,
                ${CHECK_KIND},
                ${FOREIGN_KEYS}
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries_with_kind" (${OLD_COLUMNS}, "kind")
            SELECT ${OLD_COLUMNS}, 'Text' FROM "entries"
        `);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`
            ALTER TABLE "entries_with_kind" RENAME TO "entries"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_entries_day_id" ON "entries" ("day_id")
        `);

    await checkForeignKeys(queryRunner);
  }

  /*
   * The way back has nowhere to put a voice memo: content would have to be
   * NOT NULL again, and the audio's key would be lost. So it refuses while
   * any memo exists, deleted ones included, and says how many. It does not
   * delete them, because each is somebody's recording.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const memos = (await queryRunner.query(
      `SELECT COUNT(*) AS count FROM "entries" WHERE "kind" <> 'Text'`,
    )) as { count: number }[];
    const memoCount = memos[0].count;

    if (memoCount > 0) {
      throw new Error(
        `Cannot remove voice memos: ${memoCount} entries are voice memos. ` +
          `Nothing has been changed. The schema before this migration has no ` +
          `place for them, and this migration refuses to delete a recording.`,
      );
    }

    await queryRunner.query(`
            CREATE TABLE "entries_without_kind" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL,
                "user_id" text NOT NULL,
                "day_id" text NOT NULL,
                "deleted_at" text,
                ${FOREIGN_KEYS}
            )
        `);
    await queryRunner.query(`
            INSERT INTO "entries_without_kind" (${OLD_COLUMNS})
            SELECT ${OLD_COLUMNS} FROM "entries"
        `);
    await queryRunner.query(`DROP TABLE "entries"`);
    await queryRunner.query(`
            ALTER TABLE "entries_without_kind" RENAME TO "entries"
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_entries_day_id" ON "entries" ("day_id")
        `);

    await checkForeignKeys(queryRunner);
  }
}

async function checkForeignKeys(queryRunner: QueryRunner): Promise<void> {
  const broken = (await queryRunner.query(
    `PRAGMA foreign_key_check("entries")`,
  )) as unknown[];

  if (broken.length > 0) {
    throw new Error(
      `Rebuilding entries left ${broken.length} entries pointing at a user ` +
        `or a day that does not exist. Nothing has been kept: the migration ` +
        `is rolled back.`,
    );
  }
}
