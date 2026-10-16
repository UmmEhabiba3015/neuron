import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * Two columns on sessions, so that Account can list the devices where a
 * person is signed in (docs/features.md, Ref 6).
 *
 * user_agent is the User-Agent header of the sign-in. It may be empty: a
 * session from before this migration has none, and a request may send none.
 *
 * last_used_at is set at sign-in and on every refresh, and is never empty.
 * A session from before this migration takes its created_at, the last time
 * it is known to have been used. SQLite cannot add a NOT NULL column whose
 * value comes from another column, so sessions is rebuilt: built under
 * another name, filled, the old one dropped, and the new one renamed into
 * place. Nothing points at sessions, so nothing else is touched. Its two
 * indexes go with the old table and are created again.
 *
 * The foreign key stays on one line from FOREIGN KEY to REFERENCES "users",
 * because TypeORM reads a constraint's name back with a pattern that allows
 * no line break there.
 *
 * The way back drops the two columns in place, which SQLite allows for a
 * column that is in no index and no key.
 */
const KEPT = `"id", "user_id", "refresh_token_hash", "created_at", "expires_at", "revoked_at"`;

export class AddSessionDevice1792068353868 implements MigrationInterface {
  name = 'AddSessionDevice1792068353868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "sessions_rebuilt" (
                "id" text PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL,
                "refresh_token_hash" text NOT NULL,
                "created_at" text NOT NULL,
                "expires_at" text NOT NULL,
                "revoked_at" text,
                "user_agent" text,
                "last_used_at" text NOT NULL,
                CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "sessions_rebuilt" (${KEPT}, "user_agent", "last_used_at")
            SELECT ${KEPT}, NULL, "created_at" FROM "sessions"
        `);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(
      `ALTER TABLE "sessions_rebuilt" RENAME TO "sessions"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP COLUMN "last_used_at"`,
    );
    await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "user_agent"`);
  }
}
