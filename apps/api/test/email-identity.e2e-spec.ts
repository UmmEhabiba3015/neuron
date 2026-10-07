import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { configureHttp } from './../src/configure-http';
import { closeTestDataSource, createTestDataSource } from './test-database';

describe('email as the identifier (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const password = 'a-long-enough-password';

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  const register = (email: string) =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, name: 'Somebody', timezone: 'UTC' });

  const login = (email: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  it('treats two spellings of one address as the same account', async () => {
    await register('Ummi@Example.com').expect(201);
    await register('ummi@example.com').expect(409);
  });

  it('signs in with a different case from the one registered', async () => {
    await register('Ummi@Example.com').expect(201);
    await login('UMMI@EXAMPLE.COM').expect(200);
  });

  it('keeps the address as the user typed it', async () => {
    const created = await register('Ummi@Example.com').expect(201);
    expect((created.body as { email: string }).email).toBe('Ummi@Example.com');
  });

  it('enforces this in the database, not only in the check before it', async () => {
    await register('ummi@example.com').expect(201);

    await expect(
      dataSource.query(
        `INSERT INTO users (id, email, created_at, password_hash, name, timezone)
         VALUES ('sneaky', 'UMMI@EXAMPLE.COM', '2026-01-01T00:00:00.000Z', 'x', 'Sneaky', 'UTC')`,
      ),
    ).rejects.toThrow(/UNIQUE constraint failed/i);
  });

  it('still keeps different addresses apart', async () => {
    await register('alice@example.com').expect(201);
    await register('bob@example.com').expect(201);
  });

  it('refuses something that is not an address', async () => {
    await register('umer').expect(400);
    await register('umer@').expect(400);
    await register('@example.com').expect(400);
    await register('umer example.com').expect(400);
  });

  it('answers the same for an unknown address and a wrong password', async () => {
    await register('known@example.com').expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'known@example.com', password: 'not-the-password' });

    const unknownAddress = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password });

    expect(wrongPassword.status).toBe(unknownAddress.status);
    expect(wrongPassword.body).toEqual(unknownAddress.body);
  });

  it('never puts the address in an error message', async () => {
    await register('known@example.com').expect(201);
    const conflict = await register('known@example.com').expect(409);

    expect(JSON.stringify(conflict.body)).not.toContain('known@example.com');
  });
});
