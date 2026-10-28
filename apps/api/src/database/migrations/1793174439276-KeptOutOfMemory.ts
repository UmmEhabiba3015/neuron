import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * Keep out of memory (features.md, Ref 25): one column, generated and read.
 * Every entry already written is in memory, which is what the default gives
 * the existing rows.
 */
export class KeptOutOfMemory1793174439276 implements MigrationInterface {
  name = 'KeptOutOfMemory1793174439276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "entries"
      ADD "kept_out_of_memory" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "entries" DROP COLUMN "kept_out_of_memory"
    `);
  }
}
