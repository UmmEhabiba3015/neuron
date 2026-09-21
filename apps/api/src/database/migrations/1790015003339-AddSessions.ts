import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessions1790015003339 implements MigrationInterface {
  name = 'AddSessions1790015003339';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "sessions" (
                "id" text PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL,
                "refresh_token_hash" text NOT NULL,
                "created_at" text NOT NULL,
                "expires_at" text NOT NULL,
                "revoked_at" text,
                CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id")
                    REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_sessions_user_id"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
