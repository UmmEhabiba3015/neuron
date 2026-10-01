import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Session } from './../src/auth/session.entity';
import { closeTestDataSource, createTestDataSource } from './test-database';

/*
 * Two states a long-lived system reaches on its own, and neither was tested
 * until the Day 14 mutation sweep: a session that has expired rather than
 * been revoked, and a token belonging to a user who no longer exists.
 *
 * Both mutations survived the whole suite. Logout and rotation were covered
 * thoroughly; simply waiting was not.
 */
describe('stale credentials (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let token: string;
  let sessionId: string;
  let userId: string;

  const credentials = {
    email: 'umer@example.com',
    password: 'a-long-enough-password',
  };

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials)
      .expect(200);

    const body = login.body as {
      accessToken: string;
      user: { id: string };
    };
    token = body.accessToken;
    userId = body.user.id;

    const sessions = await dataSource.getRepository(Session).find();
    sessionId = sessions[0].id;
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  const withToken = (path: string) =>
    request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${token}`);

  it('accepts the token while the session is live', async () => {
    await withToken('/entries').expect(200);
  });

  describe('when the session has expired rather than been revoked', () => {
    beforeEach(async () => {
      await dataSource
        .getRepository(Session)
        .update({ id: sessionId }, { expiresAt: '2020-01-01T00:00:00.000Z' });
    });

    it('refuses the access token', async () => {
      await withToken('/entries').expect(401);
    });

    it('refuses it on every authenticated route, not just one', async () => {
      await withToken('/entries').expect(401);
      await withToken('/entries/count').expect(401);
      await withToken('/auth/me').expect(401);
      await withToken('/days/2026-08-09').expect(401);
    });

    it('says the session is no longer active', async () => {
      const refused = await withToken('/entries').expect(401);

      expect(refused.headers['www-authenticate']).toContain(
        'The session is no longer active',
      );
    });

    it('is not treated as revoked, because it was not', async () => {
      const session = await dataSource
        .getRepository(Session)
        .findOneByOrFail({ id: sessionId });

      expect(session.revokedAt).toBeNull();
    });
  });

  describe('when the user has been deleted', () => {
    beforeEach(async () => {
      /*
       * The session has to survive the user, or the guard rejects on the
       * session check and never reaches the user one. Every foreign key is
       * ON DELETE NO ACTION, so that state cannot be reached through the
       * ORM -- the constraint is switched off for this one statement.
       *
       * The state is reachable in production regardless: ADR-014's cleanup
       * removes expired sessions, nothing removes live ones when an account
       * goes, and the roadmap has carried "does deleting a user delete their
       * journal?" as an open question since Day 8. This test does not answer
       * it; it only needs the state to exist to test the guard.
       */
      await dataSource.query('PRAGMA foreign_keys = OFF');
      await dataSource.query('DELETE FROM users WHERE id = ?', [userId]);
      await dataSource.query('PRAGMA foreign_keys = ON');
    });

    /*
     * ADR-012 attaches the user to the request rather than the token payload,
     * and this is the case that decided it: a payload-only guard would keep
     * admitting a deleted user until their token expired.
     */
    it('refuses a token whose user no longer exists', async () => {
      await withToken('/entries').expect(401);
    });

    it('refuses it on every authenticated route', async () => {
      await withToken('/entries').expect(401);
      await withToken('/auth/me').expect(401);
      await withToken('/days/2026-08-09').expect(401);
    });

    it('does not say the account is gone', async () => {
      const refused = await withToken('/entries').expect(401);

      expect(refused.headers['www-authenticate']).toContain(
        'The access token is not valid',
      );
      expect(JSON.stringify(refused.body)).not.toMatch(/user|account|deleted/i);
    });
  });
});
