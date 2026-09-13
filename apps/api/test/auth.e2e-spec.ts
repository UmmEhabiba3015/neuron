import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { User } from './../src/users/user.entity';
import { closeTestDataSource, createTestDataSource } from './test-database';

const messagesFrom = (res: request.Response): string[] =>
  (res.body as { message: string[] }).message;

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

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
  });

  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });

  describe('POST /auth/register', () => {
    it('should create a user and return it with an id', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'umer', password: 'a-long-enough-password' })
        .expect(201);

      const body = response.body as { id: string; name: string };

      expect(body.name).toBe('umer');
      expect(typeof body.id).toBe('string');
    });

    // **The claim this whole block exists for**, and it is deliberately stated
    // as a fact about the response body rather than about `@Exclude()` or about
    // `ClassSerializerInterceptor`. Either of those could be renamed, removed
    // or bypassed and this test would still be the thing that notices.
    //
    // It is written as an exact key list rather than
    // `expect(body.passwordHash).toBeUndefined()`, for the reason Day 8's
    // ownership work established: checking one absent field passes for a body
    // that leaked a different one. `password`, `passwordHash` and
    // `password_hash` are three separate spellings a future change could
    // introduce, and only "these keys and no others" rules out all of them at
    // once.
    it('should never put a credential in the response body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'umer', password: 'a-long-enough-password' })
        .expect(201);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'createdAt',
        'id',
        'name',
      ]);

      // The same claim again, against the raw text rather than the parsed
      // object. A hash nested inside some future wrapper field would survive
      // the key check above and would not survive this.
      expect(JSON.stringify(response.body)).not.toContain('$argon2');
    });

    it('should store a hash, never the password itself', async () => {
      const password = 'a-long-enough-password';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'umer', password })
        .expect(201);

      const stored = await dataSource
        .getRepository(User)
        .findOneByOrFail({ name: 'umer' });

      expect(stored.passwordHash).not.toBe(password);
      expect(stored.passwordHash).not.toContain(password);
      // The PHC string from ADR-011: algorithm, version, parameters, salt and
      // hash in one column.
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
    });

    // Two users, the same password, different stored hashes. The whole of why
    // a salt is per-user: identical hashes would tell an attacker reading the
    // table which accounts share a password, and would make one precomputed
    // table crack all of them at once.
    it('should store different hashes for two users with the same password', async () => {
      const password = 'the-very-same-password';

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'alice', password })
        .expect(201);
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'bob', password })
        .expect(201);

      const users = await dataSource.getRepository(User).find();

      expect(users).toHaveLength(2);
      expect(users[0].passwordHash).not.toBe(users[1].passwordHash);
    });

    it('should reject a name that is already taken with 409', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'umer', password: 'a-long-enough-password' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'umer', password: 'a-different-password' })
        .expect(409);

      expect(await dataSource.getRepository(User).count()).toBe(1);
    });

    describe('validation', () => {
      it('should reject a password shorter than 8 characters', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ name: 'umer', password: 'short' })
          .expect(400);

        expect(messagesFrom(response)).toContainEqual(
          expect.stringContaining('password must be longer than or equal to 8'),
        );
      });

      it('should reject a whitespace-only name', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ name: '   ', password: 'a-long-enough-password' })
          .expect(400);
      });

      it('should reject a body with an unknown field', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'umer',
            password: 'a-long-enough-password',
            isAdmin: true,
          })
          .expect(400);
      });

      it('should reject a missing password', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ name: 'umer' })
          .expect(400);
      });
    });
  });

  describe('POST /auth/login', () => {
    const credentials = { name: 'umer', password: 'a-long-enough-password' };

    const registerUser = () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(201);

    it('should return a token and the user for correct credentials', async () => {
      await registerUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const body = response.body as {
        accessToken: string;
        user: { id: string; name: string };
      };

      expect(typeof body.accessToken).toBe('string');
      expect(body.user.name).toBe('umer');
    });

    // 200, not 201. Logging in creates nothing; the token describes an account
    // that already exists.
    it('should answer 200 rather than 201', async () => {
      await registerUser();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);
    });

    // A JWT is signed, not encrypted — anyone holding one can base64url-decode
    // the payload without the secret. So the claim worth making is not "the
    // token is safe" but "there is nothing sensitive in it".
    it('should put no credential in the token payload', async () => {
      await registerUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      const { accessToken } = response.body as { accessToken: string };
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64url').toString(),
      ) as Record<string, unknown>;

      expect(payload.sub).toEqual(expect.any(String));
      expect(Object.keys(payload).sort()).toEqual([
        'exp',
        'iat',
        'name',
        'sub',
      ]);
      expect(JSON.stringify(payload)).not.toContain(credentials.password);
      expect(JSON.stringify(payload)).not.toContain('$argon2');
    });

    it('should never put a credential in the login response body', async () => {
      await registerUser();

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      expect(JSON.stringify(response.body)).not.toContain('$argon2');
      expect(JSON.stringify(response.body)).not.toContain(credentials.password);
    });

    // **The enumeration claim, and the reason this block exists.** A wrong
    // password and a name nobody has registered must be indistinguishable from
    // outside: same status, same message, same body. Anything that separates
    // them turns one request per address into a verified membership list, and
    // for a private journal membership is itself the sensitive fact.
    //
    // Asserted as an equality between the two responses rather than as two
    // separate `.expect(401)` calls. Two tests that each check a status would
    // both pass while the messages differed, which is exactly the leak.
    it('should answer identically for a wrong password and an unknown name', async () => {
      await registerUser();

      const wrongPassword = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'umer', password: 'the-wrong-password' })
        .expect(401);

      const unknownName = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'nobody-has-this-name', password: 'the-wrong-password' })
        .expect(401);

      expect(unknownName.body).toEqual(wrongPassword.body);
      expect(JSON.stringify(wrongPassword.body)).not.toContain('umer');
    });

    // The other half of the same defence, and the one that is easy to omit.
    // Identical messages leak nothing; a fast answer for an unknown name and a
    // slow one for a wrong password leak the same fact through a stopwatch,
    // because argon2 is ~60ms of deliberate work that an early return skips.
    //
    // The bound is loose on purpose. This is a timing assertion on a shared CI
    // machine, and a tight one would be flaky without being more true: the leak
    // worth catching is an order-of-magnitude difference — 1ms versus 60ms —
    // not a few milliseconds of noise.
    it('should take comparable time for a wrong password and an unknown name', async () => {
      await registerUser();

      const timeOf = async (name: string): Promise<number> => {
        const startedAt = process.hrtime.bigint();
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ name, password: 'the-wrong-password' })
          .expect(401);
        return Number(process.hrtime.bigint() - startedAt) / 1e6;
      };

      const wrongPassword = await timeOf('umer');
      const unknownName = await timeOf('nobody-has-this-name');

      expect(unknownName).toBeGreaterThan(wrongPassword / 4);
    });

    it('should reject a login for a user whose password was never set', async () => {
      // A row from before credentials existed: registered by the Day 8 schema,
      // with a null hash. It must not be loggable-into, and it must fail the
      // same way everything else does.
      await dataSource.getRepository(User).insert({
        id: 'legacy-user',
        name: 'legacy',
        createdAt: '2026-09-01T00:00:00.000Z',
        passwordHash: null,
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'legacy', password: 'any-password-at-all' })
        .expect(401);
    });

    it('should reject a body with an unknown field', async () => {
      await registerUser();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...credentials, isAdmin: true })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    const credentials = { name: 'umer', password: 'a-long-enough-password' };

    const login = async (): Promise<string> => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(credentials)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      return `Bearer ${(response.body as { accessToken: string }).accessToken}`;
    };

    // The day's claim, stated as one assertion: the server can name its caller.
    it('should name the caller for a valid token', async () => {
      const authorization = await login();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', authorization)
        .expect(200);

      expect((response.body as { name: string }).name).toBe('umer');
    });

    it('should never put a credential in the body', async () => {
      const authorization = await login();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', authorization)
        .expect(200);

      expect(Object.keys(response.body as object).sort()).toEqual([
        'createdAt',
        'id',
        'name',
      ]);
    });

    // Each of these is a different way the guard can be reached, and all four
    // must answer 401 with an identical body. Only the `WWW-Authenticate`
    // header distinguishes them, and only for expiry.
    it.each([
      ['no Authorization header', undefined],
      ['an empty Authorization header', ''],
      ['the wrong scheme', 'Basic dXNlcjpwYXNz'],
      ['Bearer with nothing after it', 'Bearer'],
      ['a token that is not a JWT', 'Bearer not-a-token'],
      ['a JWT-shaped value that is not signed', 'Bearer a.b.c'],
    ])('should answer 401 for %s', async (_label, header) => {
      const call = request(app.getHttpServer()).get('/auth/me');

      if (header !== undefined) {
        void call.set('Authorization', header);
      }

      await call.expect(401);
    });

    // A token this server would have accepted, signed by something that is not
    // this server. The signature is the whole of what stops a client editing
    // `sub` to say somebody else.
    it('should reject a token signed with a different secret', async () => {
      const { JwtService } = await import('@nestjs/jwt');
      const forged = await new JwtService({
        secret: 'a-completely-different-secret-of-sufficient-length',
      }).signAsync({ sub: 'anyone', name: 'attacker' });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    // The distinction that is safe to make, made where a client looks for it.
    // The body stays identical; the header says which.
    it('should say invalid_token in WWW-Authenticate without saying so in the body', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not-a-token')
        .expect(401);

      expect(response.headers['www-authenticate']).toContain('invalid_token');
      expect(JSON.stringify(response.body)).not.toContain('invalid_token');
    });

    // Expiry is the one distinction the guard makes, and it is safe to make
    // because the requester already holds the token — being told it aged out is
    // a fact about an object in their own hand, and confirms no account and
    // exposes nobody else. A client needs it to tell "refresh and retry" from
    // "send the user to log in".
    //
    // Signed here with a negative lifetime rather than by waiting an hour.
    it('should distinguish an expired token in the header, not the body', async () => {
      const { JwtService } = await import('@nestjs/jwt');
      const expired = await new JwtService({
        secret: process.env.JWT_SECRET,
      }).signAsync({ sub: 'anyone', name: 'umer' }, { expiresIn: '-1h' });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);

      expect(response.headers['www-authenticate']).toContain('expired');

      // The body is the same one every other failure gets. Only the header
      // differs, so anything that logs or displays a response body leaks
      // nothing.
      const valid = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not-a-token')
        .expect(401);

      expect(response.body).toEqual(valid.body);
    });

    // The user is loaded on every request rather than read off the token, so a
    // token outliving its account stops working immediately rather than in an
    // hour. Deleting a journal account is somebody saying "I want out, now".
    it('should reject a valid token whose user no longer exists', async () => {
      const authorization = await login();

      await dataSource.getRepository(User).delete({ name: 'umer' });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', authorization)
        .expect(401);
    });
  });

  // The claim the `api()` helper in `app.e2e-spec.ts` would otherwise hide:
  // those routes really are closed without a token. Before Day 9 every one of
  // them answered to anybody who knew the URL.
  describe('the entries routes require a token', () => {
    it.each([
      ['GET', '/entries'],
      ['GET', '/entries/count'],
      ['GET', '/entries/some-id'],
      ['POST', '/entries'],
      ['PATCH', '/entries/some-id'],
      ['DELETE', '/entries/some-id'],
    ])('should answer 401 for %s %s without a token', async (method, url) => {
      const server = request(app.getHttpServer());
      const call = {
        GET: () => server.get(url),
        POST: () => server.post(url).send({ content: 'x' }),
        PATCH: () => server.patch(url).send({ content: 'x' }),
        DELETE: () => server.delete(url),
      }[method as 'GET' | 'POST' | 'PATCH' | 'DELETE'];

      await call().expect(401);
    });

    // Validation runs *after* the guard, which is the correct order: an
    // unauthenticated caller should not be told whether their body was
    // well-formed. A 400 here would confirm the route exists and say what it
    // expects, to somebody with no credential at all.
    it('should answer 401 rather than 400 for a malformed body without a token', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .send({ not_a_real_field: true })
        .expect(401);
    });
  });
});
