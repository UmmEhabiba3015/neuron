import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// The companion unit test (`src/entries/entries.controller.spec.ts`) calls the
// controller class directly through Nest's DI wiring. This file is the other
// half: it boots the whole application and talks to it over HTTP, so it covers
// what calling a method never can — that the route is actually mapped at
// `/entries`, that the status code is 200, and that the response survives JSON
// serialization on the way out.
describe('EntriesController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // `.compile()` resolves the dependency graph; `app.init()` is what starts
    // the application on top of it — running lifecycle hooks and registering
    // routes with the underlying Express server. Without it there is no HTTP
    // layer to make a request against.
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/entries (GET)', () => {
    // `supertest` issues a real HTTP request against the running server and
    // asserts on the real response — headers, status, parsed body — instead of
    // inspecting a returned value in-process.
    return request(app.getHttpServer())
      .get('/entries')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(2);
      });
  });

  // Each test above booted a real server holding a real port and open handles.
  // `app.close()` releases them; skipping it leaks a server per test and
  // eventually hangs Jest, which waits for the process to have nothing left to
  // do. `afterEach` pairs with `beforeEach` so every boot has exactly one
  // matching shutdown, even when a test fails partway through.
  afterEach(async () => {
    await app.close();
  });
});
