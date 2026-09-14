import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788262448946 implements MigrationInterface {
  name = 'InitialSchema1788262448946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "entries" (
                "id" text PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" text NOT NULL
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "entries"
        `);
  }
}
