import { DatabaseSync } from 'node:sqlite';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DATABASE } from './../src/database/database.module';

// The companion unit test (`src/entries/entries.controller.spec.ts`) calls the
// controller class directly through Nest's DI wiring. This file is the other
// half: it boots the whole application and talks to it over HTTP, so it covers
// what calling a method never can — that the route is actually mapped at
// `/entries`, that the status code is right, and that the response survives JSON
// serialization on the way out.
describe('EntriesController (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseSync;

  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    db.exec(`
      CREATE TABLE entries (
        id         TEXT PRIMARY KEY,
        content    TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Importing AppModule pulls in the real database provider, which would
      // open (and create) the development database file. `overrideProvider`
      // replaces that factory before it ever runs, so the test suite leaves
      // nothing on disk. Everything else about the app stays real.
      .overrideProvider(DATABASE)
      .useValue(db)
      .compile();

    // `.compile()` resolves the dependency graph; `app.init()` is what starts
    // the application on top of it — running lifecycle hooks and registering
    // routes with the underlying Express server. Without it there is no HTTP
    // layer to make a request against.
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // A round trip, not a fixed count. `toHaveLength(2)` used to work only
  // because the service handed back a hardcoded array; with a real database the
  // number of entries is whatever the test itself put there, so the meaningful
  // claim is that what went in over HTTP comes back out over HTTP.
  it('/entries (POST then GET)', async () => {
    // `supertest` issues a real HTTP request against the running server and
    // asserts on the real response — headers, status, parsed body — instead of
    // inspecting a returned value in-process.
    const created = await request(app.getHttpServer())
      .post('/entries')
      .send({ content: 'written over HTTP' })
      .expect(201);

    // 201, not 200: Nest defaults POST handlers to "Created". The body is what
    // the handler returned, after a trip through JSON.
    expect(created.body).toMatchObject({ content: 'written over HTTP' });

    await request(app.getHttpServer())
      .get('/entries')
      .expect(200)
      .expect((res) => {
        expect(res.body).toContainEqual(created.body);
      });
  });

  // Each test above booted a real server holding a real port and open handles.
  // `app.close()` releases them; skipping it leaks a server per test and
  // eventually hangs Jest, which waits for the process to have nothing left to
  // do. `afterEach` pairs with `beforeEach` so every boot has exactly one
  // matching shutdown, even when a test fails partway through.
  afterEach(async () => {
    await app.close();
    db.close();
  });
});
