import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueUserName1789295560638 implements MigrationInterface {
  name = 'AddUniqueUserName1789295560638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_users_name" ON "users" ("name")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "UQ_users_name"
        `);
  }
}
