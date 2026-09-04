import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import type { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { closeTestDataSource, createTestDataSource } from './test-database';
import type { JournalEntry } from './../src/entries/entry.entity';

// `supertest` types `res.body` as `any`, so every field read off it is an
// unchecked assumption — and reading one directly is a lint error, correctly,
// because `any` turns a typo into silence. This puts the assertion in one
// place: the tests below say what shape they expect, once, and the compiler
// checks every field access after that. The cast is still a cast; what changes
// is that there is one of them rather than one per line.
const entryFrom = (res: request.Response): JournalEntry =>
  res.body as JournalEntry;

// `ValidationPipe` answers with `{ statusCode, message, error }` where
// `message` is an **array** of sentences, one per rule that failed. Reading it
// through one cast, for the same reason `entryFrom` exists.
//
// The tests below assert on those sentences and not merely on the number 400.
// A status code alone is satisfied by the wrong rule firing — by the body being
// rejected for a reason nobody intended — and this project has a written case
// of a completely broken search passing its test because the claim was too
// loose to notice.
const messagesFrom = (res: request.Response): string[] =>
  (res.body as { message: string[] }).message;

// The companion unit test (`src/entries/entries.controller.spec.ts`) calls the
// controller class directly through Nest's DI wiring. This file is the other
// half: it boots the whole application and talks to it over HTTP, so it covers
// what calling a method never can — that the route is actually mapped at
// `/entries`, that the status code is right, and that the response survives JSON
// serialization on the way out.
describe('EntriesController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // The lever this suite pulls, rebuilt. Until Day 8 it was
      // `.overrideProvider(DATABASE).useValue(db)`; the DATABASE symbol is
      // gone, and what took its place is the token `TypeOrmModule.forRootAsync`
      // registers for the connection — `getDataSourceToken()`, which for the
      // default connection is the `DataSource` class itself.
      //
      // The guarantee is the one that mattered before and it is unchanged.
      // Importing AppModule pulls in the real database wiring, whose factory
      // would open (and create) the development database file; overriding the
      // provider replaces that factory before it ever runs, so the connection
      // the application uses is the in-memory one built above and the suite
      // leaves nothing on disk. Everything else about the app stays real —
      // the repository, the pipe, the routes, the exception layer.
      //
      // `TypeOrmModule.forFeature` builds its repository provider by asking for
      // this same token, so overriding here reaches the repository too. Nothing
      // in the application constructs a connection of its own, which is what
      // makes one line enough.
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
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

  // The entry JSON contract, stated as the exact set of keys.
  //
  // Added on Day 8b, when `entries` gained a `user_id` column, and the reason
  // it had to be added is that nothing in this suite could have caught the
  // regression. Every other body assertion here compares one response against
  // another — `toContainEqual(created.body)` above, `toEqual([created])` and
  // `toEqual(created)` below — so a field appearing on *both* sides leaves them
  // all green. `{"id":…,"content":…,"createdAt":…,"userId":null}` is a changed
  // API and it would have shipped silently.
  //
  // The claim is deliberately about keys rather than values. `id` and
  // `createdAt` are generated by the server, so their values cannot be written
  // down in advance; what can be written down is that there are exactly three
  // of them and what they are called. That is the sentence Day 9 and Day 10
  // have to keep true while ownership becomes real, and the one that has to be
  // deliberately edited on the day a response is *meant* to say who owns an
  // entry.
  it('/entries (POST) returns exactly id, content and createdAt', async () => {
    const created = await request(app.getHttpServer())
      .post('/entries')
      .send({ content: 'written over HTTP' })
      .expect(201);

    expect(Object.keys(created.body as object)).toEqual([
      'id',
      'content',
      'createdAt',
    ]);

    const [listed] = (
      await request(app.getHttpServer()).get('/entries').expect(200)
    ).body as object[];

    expect(Object.keys(listed)).toEqual(['id', 'content', 'createdAt']);
  });

  // The unit tests in src/entries/entries.controller.spec.ts assert that a
  // `BadRequestException` or `NotFoundException` is thrown. That is not the same
  // claim as the one below. An exception class only becomes a status code once
  // Nest's exception layer has handled it, and that layer only exists in a
  // running application — so these tests are what actually prove the day's work:
  // the number on the wire.
  describe('status codes', () => {
    // Four bodies, four different rules, and the message each one produces.
    //
    // The messages are `class-validator`'s own, and two of them changed on
    // Day 7: a missing `content` used to answer `content is required` and now
    // answers `content must be a string`, and both the empty and the
    // whitespace-only body used to answer `content must not be empty`. Each is
    // a change to what a client sees, decided rather than inherited — the
    // library's defaults were accepted as the price of not hand-writing a
    // `message` on every rule (ADR-008, Decision 8).
    //
    // The third message is the exception: it belongs to a custom decorator,
    // because no rule the library ships enforces it and its own attempt reads
    // `content must match /\S/ regular expression`.
    it.each([
      ['no content field', {}, 'content must be a string'],
      [
        'content that is not a string',
        { content: 42 },
        'content must be a string',
      ],
      [
        'empty content',
        { content: '' },
        'content must contain at least one character that is not whitespace',
      ],
      [
        'whitespace-only content',
        { content: '   ' },
        'content must contain at least one character that is not whitespace',
      ],
    ])(
      'POST /entries rejects %s with 400 and says why',
      async (_label, body, message) => {
        const rejected = await request(app.getHttpServer())
          .post('/entries')
          .send(body)
          .expect(400);

        expect(messagesFrom(rejected)).toEqual([message]);
      },
    );

    // Exactly one sentence, which is the claim. `@Matches(/\S/)` was rejected
    // as the implementation of the non-whitespace rule partly because it fires
    // alongside the string rule, answering one mistake with two sentences of
    // which one is noise (ADR-008, Decision 4).
    it('POST /entries answers a non-string content with one message', async () => {
      const rejected = await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 42 })
        .expect(400);

      expect(messagesFrom(rejected)).toHaveLength(1);
    });

    // `transform: true` hands the controller a real `CreateEntryDto` built by
    // `class-transformer`, and the risk that comes with it is that something in
    // that conversion quietly edits the value. Nothing does, and this is what
    // says so: whitespace decides validity at the boundary and never rewrites
    // what the user wrote (ADR-005).
    it('POST /entries stores content verbatim, spacing included', async () => {
      const padded = '  the spacing I chose  ';

      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: padded })
          .expect(201),
      );

      expect(created.content).toBe(padded);

      const reread = entryFrom(
        await request(app.getHttpServer())
          .get(`/entries/${created.id}`)
          .expect(200),
      );

      expect(reread.content).toBe(padded);
    });

    it('POST /entries accepts valid content with 201', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 'real text' })
        .expect(201);
    });

    // Proves the rejections above were not merely reported — nothing was
    // written. A 400 that still stored the row would pass every test above.
    it('GET /entries is empty after only rejected writes', async () => {
      await request(app.getHttpServer()).post('/entries').send({}).expect(400);
      await request(app.getHttpServer())
        .post('/entries')
        .send({ content: '   ' })
        .expect(400);

      await request(app.getHttpServer())
        .get('/entries')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('GET /entries/:id returns 404 for an unknown id', async () => {
      await request(app.getHttpServer()).get('/entries/nope').expect(404);
    });

    // 200 with an empty array, not 404 and not 500. "Nothing matched" is a
    // successful search that found nothing.
    it('GET /entries?word=… returns 200 and [] when nothing matches', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 'quiet evening at home' })
        .expect(201);

      await request(app.getHttpServer())
        .get('/entries')
        .query({ word: 'zzzzz' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    // Before today this was a 201 with the extra field silently discarded.
    // Both endpoints are listed because a body that is a 400 on one and a 201
    // on the other is the inconsistency ADR-006 set out to remove.
    it('POST /entries rejects an unrecognised field with 400', async () => {
      const rejected = await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 'x', id: 'i-picked-this-myself' })
        .expect(400);

      // `Unrecognised field(s): id. Only content may be sent.` until Day 7.
      // The old sentence named the rule and said what a client may send; this
      // one names the symptom. It is worse, and it is accepted rather than
      // patched with a `message` option, because writing one on every rule is
      // the hand-writing this whole day exists to stop. Revisit when a person
      // rather than an engineer has to read it — Day 12 (ADR-008, Decision 8).
      expect(messagesFrom(rejected)).toEqual(['property id should not exist']);
    });

    // The message has to name the offending field. Somebody who typed `contnet`
    // needs to be told which word was wrong, which is the entire reason
    // unrecognised fields are refused rather than ignored (ADR-006).
    it('POST /entries names the unrecognised field', async () => {
      const rejected = await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 'x', contnet: 'y' })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'property contnet should not exist',
      ]);
    });

    it('PATCH /entries/:id rejects an unrecognised field with 400', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'the original text' })
          .expect(201),
      );

      const rejected = await request(app.getHttpServer())
        .patch(`/entries/${created.id}`)
        .send({ contnet: 'I fixed my typo' })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'property contnet should not exist',
      ]);

      // The 400 is only half the claim. The other half is that the entry was
      // left alone — a server that rejected the request and edited the row
      // anyway would satisfy the line above.
      const reread = entryFrom(
        await request(app.getHttpServer())
          .get(`/entries/${created.id}`)
          .expect(200),
      );

      expect(reread.content).toBe('the original text');
    });

    // `?word=a&word=b`. Express turns a repeated parameter into an array, and
    // the old handler searched for the text `a,b` and answered `200 []` —
    // "I found nothing" in place of "I could not read your request".
    it('GET /entries rejects a repeated word parameter with 400', async () => {
      const rejected = await request(app.getHttpServer())
        .get('/entries?word=a&word=b')
        .expect(400);

      // Enforced by the library now rather than by `parseSearchTerm`, and the
      // sentence changed with it: `word may only be given once` became
      // `word must be a string`. The second is the literal truth about what
      // Express delivered — an array — and the first said more about what the
      // sender should do. Accepted along with the rest (ADR-008, Decision 8).
      expect(messagesFrom(rejected)).toEqual(['word must be a string']);
    });

    // New behaviour on Day 7, arriving as a side effect and kept on purpose.
    // `forbidNonWhitelisted` does not distinguish a body from a query string,
    // so an unrecognised query parameter is refused exactly like an
    // unrecognised field. It was put as a decision rather than accepted
    // silently, and chosen for consistency with POST and PATCH; the standing
    // counter-argument is that browsers and analytics tools append parameters
    // to URLs, which is a real difference between a query string and a body
    // (ADR-008, Decision 6).
    it('GET /entries rejects an unrecognised query parameter with 400', async () => {
      const rejected = await request(app.getHttpServer())
        .get('/entries?werd=sister')
        .expect(400);

      expect(messagesFrom(rejected)).toEqual([
        'property werd should not exist',
      ]);
    });

    // The pair, in one test, and the pairing is the point. An absent `word` and
    // an empty one are different messages: `GET /entries` means "I am not
    // searching, show me everything", `GET /entries?word=` means "I am
    // searching, and this is my term" — and searching for nothing finds
    // nothing.
    //
    // Written as two assertions in one test because the failure this catches is
    // that they agree. `if (word)` treats `""` as falsy and answers both with
    // the whole journal; a `%%` pattern handed to LIKE does the same thing one
    // layer down. Split across two tests, either mistake leaves one of them
    // green and looking fine (ADR-008, Decision 7).
    it('GET /entries?word= finds nothing while GET /entries finds everything', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'a quiet evening at home' })
          .expect(201),
      );

      await request(app.getHttpServer())
        .get('/entries?word=')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });

      await request(app.getHttpServer())
        .get('/entries')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([created]);
        });
    });

    // A percent sign is ordinary text to a person writing a journal and a
    // wildcard to `LIKE`. The escaping that reconciles those two lives in the
    // repository — rewritten on Day 8 around TypeORM's `Raw`, which is exactly
    // why this test matters: an ORM removes the SQL you write, not the SQL
    // that runs, and it escapes nothing for you. Asserted here because a query
    // string is where such a character actually arrives, URL-encoded
    // (ADR-006).
    it('GET /entries?word=100%25 finds the entry containing 100%', async () => {
      await request(app.getHttpServer())
        .post('/entries')
        .send({ content: '100% exhausted today' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 'an ordinary quiet evening' })
        .expect(201);

      await request(app.getHttpServer())
        .get('/entries?word=100%25')
        .expect(200)
        .expect((res) => {
          expect(res.body as JournalEntry[]).toHaveLength(1);
          expect((res.body as JournalEntry[])[0].content).toBe(
            '100% exhausted today',
          );
        });
    });

    it('PATCH /entries/:id returns 200 and the updated entry', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'the first draft' })
          .expect(201),
      );

      const updated = entryFrom(
        await request(app.getHttpServer())
          .patch(`/entries/${created.id}`)
          .send({ content: 'the second draft' })
          .expect(200),
      );

      expect(updated.content).toBe('the second draft');
      expect(updated.id).toBe(created.id);
      // `createdAt` records when the entry was written, not when it was last
      // touched, so an edit must not move it (ADR-006).
      expect(updated.createdAt).toBe(created.createdAt);
    });

    it('PATCH /entries/:id returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .patch('/entries/nope')
        .send({ content: 'anything' })
        .expect(404);
    });

    // With one updatable field, "no field to update" and "no content" are the
    // same body. The claim is about the empty body either way: a request that
    // asks for no change is one the server cannot act on.
    it('PATCH /entries/:id returns 400 for an empty body', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'unchanged' })
          .expect(201),
      );

      const rejected = await request(app.getHttpServer())
        .patch(`/entries/${created.id}`)
        .send({})
        .expect(400);

      // Ours, not the library's. No per-property decorator can express "at
      // least one field must be present", so this comes from a class-level
      // check — and its sentence says what the body needs rather than what was
      // wrong with it (ADR-008, Decision 5).
      expect(messagesFrom(rejected)).toEqual([
        'the request body must contain at least one field to update',
      ]);
    });

    // The case that was a 500 before `@IsOptional()` was replaced with
    // `@ValidateIf` on `UpdateEntryDto`: `null` looked absent to the pipe, so
    // the body passed every rule and reached a `NOT NULL` column. The 400 is
    // half the claim; the other half is that the entry was left alone.
    it('PATCH /entries/:id returns 400 for a content field of null', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'unchanged' })
          .expect(201),
      );

      const rejected = await request(app.getHttpServer())
        .patch(`/entries/${created.id}`)
        .send({ content: null })
        .expect(400);

      expect(messagesFrom(rejected)).toEqual(['content must be a string']);

      const reread = entryFrom(
        await request(app.getHttpServer())
          .get(`/entries/${created.id}`)
          .expect(200),
      );

      expect(reread.content).toBe('unchanged');
    });

    // The one gap the class-level check has to close by hand. `class-validator`
    // has no class-level registration, so the rule is registered against no
    // property at all — which makes a field named literally `undefined` look,
    // to `forbidNonWhitelisted`, like a property the server recognises. Without
    // the guard inside the decorator this body slips through validation and
    // fails downstream as a 500.
    it('PATCH /entries/:id returns 400 for a field named undefined', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'unchanged' })
          .expect(201),
      );

      await request(app.getHttpServer())
        .patch(`/entries/${created.id}`)
        .send({ undefined: 'x' })
        .expect(400);

      const reread = entryFrom(
        await request(app.getHttpServer())
          .get(`/entries/${created.id}`)
          .expect(200),
      );

      expect(reread.content).toBe('unchanged');
    });

    // 200 with the entry, not 204 with nothing — the caller gets back what it
    // just removed, which is what makes an undo possible (ADR-006).
    it('DELETE /entries/:id returns 200 with the deleted entry, which is then gone', async () => {
      const created = entryFrom(
        await request(app.getHttpServer())
          .post('/entries')
          .send({ content: 'here for a moment' })
          .expect(201),
      );

      const deleted = entryFrom(
        await request(app.getHttpServer())
          .delete(`/entries/${created.id}`)
          .expect(200),
      );

      expect(deleted).toEqual(created);

      await request(app.getHttpServer())
        .get(`/entries/${created.id}`)
        .expect(404);
    });

    it('DELETE /entries/:id returns 404 for an unknown id', async () => {
      await request(app.getHttpServer()).delete('/entries/nope').expect(404);
    });

    // The shape matters as much as the status. Asserting the whole body rather
    // than just `body.count` is what would catch a regression back to a bare
    // number, since `5` and `{ count: 5 }` both satisfy a loose check.
    it('GET /entries/count returns 200 and { count }', async () => {
      await request(app.getHttpServer())
        .get('/entries/count')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ count: 0 });
        });

      await request(app.getHttpServer())
        .post('/entries')
        .send({ content: 'one' })
        .expect(201);

      await request(app.getHttpServer())
        .get('/entries/count')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ count: 1 });
        });
    });
  });

  // Each test above booted a real server holding a real port and open handles.
  // `app.close()` releases them; skipping it leaks a server per test and
  // eventually hangs Jest, which waits for the process to have nothing left to
  // do. `afterEach` pairs with `beforeEach` so every boot has exactly one
  // matching shutdown, even when a test fails partway through.
  afterEach(async () => {
    await app.close();
    await closeTestDataSource(dataSource);
  });
});
