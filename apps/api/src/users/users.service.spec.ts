import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { migrations } from '../database/migrations';
import { JournalEntry } from '../entries/entry.entity';
import { PasswordService } from '../auth/password.service';
import { User } from './user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let users: Repository<User>;

  beforeEach(async () => {
    const dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [JournalEntry, User],
      migrations,
      synchronize: false,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    users = dataSource.getRepository(User);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersRepository,
        PasswordService,
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should generate the id and createdAt itself', async () => {
      const user = await service.register('umer', 'a-long-enough-password');

      expect(user?.id).toEqual(expect.any(String));

      expect(user?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should store a hash rather than the password', async () => {
      const password = 'a-long-enough-password';

      await service.register('umer', password);

      const stored = await users.findOneByOrFail({ name: 'umer' });

      expect(stored.passwordHash).not.toBe(password);
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    });

    it('should return undefined when the name is already taken', async () => {
      await service.register('umer', 'a-long-enough-password');

      expect(
        await service.register('umer', 'a-different-password'),
      ).toBeUndefined();
      expect(await users.count()).toBe(1);
    });

    it('should not overwrite the existing user when the name is taken', async () => {
      await service.register('umer', 'the-first-password');
      const first = await users.findOneByOrFail({ name: 'umer' });

      await service.register('umer', 'the-second-password');

      expect((await users.findOneByOrFail({ name: 'umer' })).passwordHash).toBe(
        first.passwordHash,
      );
    });
  });

  describe('findByName', () => {
    it('should return undefined when no user has that name', async () => {
      expect(await service.findByName('nobody')).toBeUndefined();
    });

    it('should find a registered user', async () => {
      await service.register('umer', 'a-long-enough-password');

      expect((await service.findByName('umer'))?.name).toBe('umer');
    });
  });
});
