import { MigrationInterface, QueryRunner } from 'typeorm';

// Makes `users.name` unique, which is what lets it be the thing a person
// authenticates *as*. Day 8 left the constraint off deliberately and recorded
// why in a test: uniqueness has no meaning until there is a login.
//
// **Hand-written after reading the generated version**, which was not wrong but
// did the work twice. `migration:generate` plans each entity change as its own
// pass and emitted eight statements: a full table rebuild whose `CREATE TABLE`
// was byte-identical to the existing one, then a second rebuild that actually
// added the constraint. Two copies of every row and two `DROP TABLE`s to add
// one index.
//
// A unique index is not a table constraint in SQLite's eyes — `CREATE UNIQUE
// INDEX` is a first-class statement that needs no rebuild at all, and it
// enforces exactly the same thing. One statement, no copy, no drop.
//
// The index is also what `findByName` will use on every login, so this pays for
// itself twice.
export class AddUniqueUserName1789295560638 implements MigrationInterface {
  name = 'AddUniqueUserName1789295560638';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Will fail loudly if two users already share a name, which is correct:
    // that is data this constraint cannot be imposed on without someone
    // deciding which row wins.
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
