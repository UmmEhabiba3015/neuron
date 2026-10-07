import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { entities } from '../database/entities';
import { migrations } from '../database/migrations';
import { PasswordService } from '../auth/password.service';
import { User } from './user.entity';
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
  let users: Repository<User>;

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
});
