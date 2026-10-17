import {
  as,
  startApp,
  stopApp,
  type Caller,
  type RunningApp,
} from '../support/app';
import { freezeClockAt, moveClockTo, releaseClock } from '../support/clock';
import { authenticate, login } from '../support/test-database';

/*
 * Searching, filtering by day and paging through the journal, and the count
 * that the screen shows beside them. The filter rules themselves -- LIKE
 * escaping, the empty word, the day row rather than created_at -- are unit
 * tests of EntriesRepository. Here a client pages through over HTTP, and
 * what it can reach must be what the count says.
 */
describe('search, pages and the count (e2e)', () => {
  let running: RunningApp;
  let alice: Caller;

  const ON_THE_EIGHTH = [
    'the day before, first',
    'the day before, about the flat',
    'the day before, third',
  ];

  const ON_THE_NINTH = [
    'sister called about the flat',
    'sister again, briefly',
    '100% exhausted',
    'walked the canal',
    'the flat people said Tuesday',
  ];

  const contents = (body: unknown) =>
    (body as { content: string }[]).map((entry) => entry.content);

  const countFor = async (query: string): Promise<number> =>
    (
      (await alice.get(`/entries/count${query}`).expect(200)).body as {
        count: number;
      }
    ).count;

  /* A page at a time, the way a client that pages actually reaches them. */
  const walk = async (query: string, limit = 2): Promise<string[]> => {
    const seen: string[] = [];
    const separator = query === '' ? '?' : '&';

    for (let offset = 0; ; offset += limit) {
      const page = contents(
        (
          await alice
            .get(`/entries${query}${separator}limit=${limit}&offset=${offset}`)
            .expect(200)
        ).body,
      );
      seen.push(...page);

      if (page.length < limit) {
        return seen;
      }
    }
  };

  /*
   * The journal spans two days, so that a date filter the count forgot
   * would give a different number from the listing.
   */
  beforeEach(async () => {
    freezeClockAt('2026-08-08T12:00:00.000Z');
    running = await startApp();
    alice = as(running.server, await authenticate(running.server, 'alice'));
    const bob = as(running.server, await authenticate(running.server, 'bob'));

    /* A minute apart, so that newest first is one order and not a tie. */
    for (const [minute, content] of ON_THE_EIGHTH.entries()) {
      moveClockTo(`2026-08-08T12:0${minute}:00.000Z`);
      await alice.post('/entries').send({ content }).expect(201);
    }
    await bob
      .post('/entries')
      .send({ content: "bob's entry about his sister" })
      .expect(201);

    moveClockTo('2026-08-09T12:00:00.000Z');
    alice = as(running.server, await login(running.server, 'alice'));

    for (const [minute, content] of ON_THE_NINTH.entries()) {
      moveClockTo(`2026-08-09T12:0${minute}:00.000Z`);
      await alice.post('/entries').send({ content }).expect(201);
    }
  });

  afterEach(async () => {
    await stopApp(running);
    releaseClock();
  });

  it('finds entries by a word, finds nothing for an empty word, and takes % literally', async () => {
    expect(
      contents((await alice.get('/entries?word=sister').expect(200)).body),
    ).toEqual(['sister again, briefly', 'sister called about the flat']);
    expect((await alice.get('/entries?word=').expect(200)).body).toEqual([]);
    expect(
      contents((await alice.get('/entries?word=100%25').expect(200)).body),
    ).toEqual(['100% exhausted']);
    expect(
      contents(
        (await alice.get('/entries?date=2026-08-09&word=flat').expect(200))
          .body,
      ),
    ).toEqual(['the flat people said Tuesday', 'sister called about the flat']);
  });

  it('pages through the journal without repeating or skipping, and reads limit and offset as numbers', async () => {
    /* No limit is a page of DEFAULT_PAGE_SIZE, which holds all eight. */
    const all = contents((await alice.get('/entries').expect(200)).body);
    expect(all).toHaveLength(8);

    const walked = await walk('', 3);
    expect(walked).toEqual(all);

    expect(
      (await alice.get('/entries?limit=5&offset=500').expect(200)).body,
    ).toEqual([]);
    await alice.get('/entries?limit=201').expect(400);
  });

  it('counts exactly what paging reaches, for every filter, before and after deletes', async () => {
    const queries = [
      '',
      '?word=sister',
      '?word=flat',
      '?word=zzzz',
      '?word=',
      '?date=2026-08-09',
      '?date=2026-08-08',
      '?date=2026-08-01',
      '?date=2026-08-09&word=flat',
      '?date=2026-08-08&word=sister',
      '?kind=Text',
      '?kind=Voice',
      '?date=2026-08-09&kind=Text',
    ];

    const expectAgreement = async () => {
      for (const query of queries) {
        expect([query, await countFor(query)]).toEqual([
          query,
          (await walk(query)).length,
        ]);
      }
    };

    await expectAgreement();

    /* Agreement alone would hold if both ignored a filter, so pin numbers. */
    expect(await countFor('')).toBe(8);
    expect(await countFor('?date=2026-08-09')).toBe(5);
    expect(await countFor('?date=2026-08-09&word=flat')).toBe(2);
    expect(await countFor('?word=sister')).toBe(2);

    const deleted = [
      'sister again, briefly',
      'the flat people said Tuesday',
      'the day before, about the flat',
    ];
    const listed = (await alice.get('/entries').expect(200)).body as {
      id: string;
      content: string;
    }[];

    for (const entry of listed.filter(({ content }) =>
      deleted.includes(content),
    )) {
      await alice.delete(`/entries/${entry.id}`).expect(204);
    }

    await expectAgreement();

    expect(await countFor('')).toBe(5);
    expect(await countFor('?date=2026-08-09')).toBe(3);
    expect(await countFor('?word=flat')).toBe(1);
    expect(await countFor('?word=Tuesday')).toBe(0);

    const walkedAfter = await walk('');
    for (const content of deleted) {
      expect(walkedAfter).not.toContain(content);
    }
  });
});
