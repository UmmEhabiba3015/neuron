import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * One row for each reset link sent. token_hash is the SHA-256 of the token
 * in the link, never the token, and it is unique because a token is looked
 * up by it. user_id is indexed because a successful reset ends every other
 * unused reset of the same person.
 *
 * The foreign key stays on one line from FOREIGN KEY to REFERENCES "users",
 * because TypeORM reads a constraint's name back with a pattern that allows
 * no line break there.
 */
export class AddPasswordResets1792063401156 implements MigrationInterface {
  name = 'AddPasswordResets1792063401156';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "password_resets" (
                "id" text PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL,
                "token_hash" text NOT NULL,
                "expires_at" text NOT NULL,
                "used_at" text,
                "created_at" text NOT NULL,
                CONSTRAINT "FK_password_resets_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
                    ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_password_resets_token_hash" ON "password_resets" ("token_hash")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_password_resets_user_id" ON "password_resets" ("user_id")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_password_resets_user_id"`);
    await queryRunner.query(`DROP INDEX "UQ_password_resets_token_hash"`);
    await queryRunner.query(`DROP TABLE "password_resets"`);
  }
}
