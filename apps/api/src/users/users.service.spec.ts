import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { entities } from '../database/entities';
import { migrations } from '../database/migrations';
import { PasswordService } from '../auth/password.service';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const registration = (password: string) => ({
  email: 'umer',
  password,
  name: 'Umer',
  timezone: 'Asia/Karachi',
});

describe('UsersService', () => {
  let service: UsersService;
  let users: Repository<UserEntity>;

  beforeEach(async () => {
    const dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities,
      migrations,
      synchronize: false,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    users = dataSource.getRepository(UserEntity);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersRepository,
        PasswordService,
        { provide: getRepositoryToken(UserEntity), useValue: users },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should generate the id and createdAt itself', async () => {
      const user = await service.register(
        registration('a-long-enough-password'),
      );

      expect(user?.id).toEqual(expect.any(String));

      expect(user?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should store a hash rather than the password', async () => {
      const password = 'a-long-enough-password';

      await service.register(registration(password));

      const stored = await users.findOneByOrFail({ email: 'umer' });

      expect(stored.passwordHash).not.toBe(password);
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it('should return undefined when the name is already taken', async () => {
      await service.register(registration('a-long-enough-password'));

      expect(
        await service.register(registration('a-different-password')),
      ).toBeUndefined();
      expect(await users.count()).toBe(1);
    });

    it('should not overwrite the existing user when the name is taken', async () => {
      await service.register(registration('the-first-password'));
      const first = await users.findOneByOrFail({ email: 'umer' });

      await service.register(registration('the-second-password'));

      expect(
        (await users.findOneByOrFail({ email: 'umer' })).passwordHash,
      ).toBe(first.passwordHash);
    });
  });

  describe('findByEmail', () => {
    it('should return undefined when no user has that name', async () => {
      expect(await service.findByEmail('nobody')).toBeUndefined();
    });

    it('should find a registered user', async () => {
      await service.register(registration('a-long-enough-password'));

      expect((await service.findByEmail('umer'))?.email).toBe('umer');
    });
  });

  /*
   * An address is one account whatever its capitals, because the unique
   * index is on lower(email) and the lookup agrees with it. The address is
   * still stored as it was typed.
   */
  describe('the email address', () => {
    const as = (email: string, name = 'Ummi') => ({
      email,
      password: 'a-long-enough-password',
      name,
      timezone: 'UTC',
    });

    it('keeps the address as it was typed', async () => {
      expect((await service.register(as('Ummi@Example.com')))?.email).toBe(
        'Ummi@Example.com',
      );
    });

    it('refuses a second account for the same address in other capitals', async () => {
      await service.register(as('Ummi@Example.com'));

      expect(await service.register(as('ummi@example.com'))).toBeUndefined();
      expect(await users.count()).toBe(1);
    });

    it('finds the account by the address in any capitals', async () => {
      await service.register(as('Ummi@Example.com'));

      expect((await service.findByEmail('UMMI@EXAMPLE.COM'))?.email).toBe(
        'Ummi@Example.com',
      );
    });

    it('keeps different addresses apart, and lets two people share a name', async () => {
      await service.register(as('alice@example.com', 'Sam'));
      await service.register(as('bob@example.com', 'Sam'));

      expect(await users.count()).toBe(2);
    });
  });

  describe('setPasswordHash', () => {
    it("replaces the one person's hash, and no one else's", async () => {
      const alice = (await service.register({
        ...registration('alice-password'),
        email: 'alice@example.com',
      }))!;
      const bob = (await service.register({
        ...registration('bob-password'),
        email: 'bob@example.com',
      }))!;

      await service.setPasswordHash(alice.id, '$argon2id$a-new-hash');

      const hashOf = async (id: string) =>
        (
          await users
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.id = :id', { id })
            .getOneOrFail()
        ).passwordHash;

      expect(await hashOf(alice.id)).toBe('$argon2id$a-new-hash');
      expect(await hashOf(bob.id)).toBe(bob.passwordHash);
    });
  });
});
