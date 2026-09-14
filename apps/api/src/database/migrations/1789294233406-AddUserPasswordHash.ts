import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPasswordHash1789294233406 implements MigrationInterface {
  name = 'AddUserPasswordHash1789294233406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "password_hash" text
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "password_hash"
        `);
  }
}
