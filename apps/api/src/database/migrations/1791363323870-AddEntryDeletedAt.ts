import { MigrationInterface, QueryRunner } from 'typeorm';

/*
 * A nullable column with no default is the one change SQLite makes to a
 * table in place, so there is no rebuild here and nothing to write out
 * again: the other columns, both foreign keys and IDX_entries_day_id are
 * never touched.
 *
 * Every existing entry gets NULL, which means alive.
 *
 * DROP COLUMN is also done in place. SQLite refuses it for a column that is
 * indexed or part of a key, and deleted_at is neither.
 */
export class AddEntryDeletedAt1791363323870 implements MigrationInterface {
  name = 'AddEntryDeletedAt1791363323870';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "entries" ADD COLUMN "deleted_at" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "deleted_at"`);
  }
}
