import {
  as,
  messagesFrom,
  startApp,
  stopApp,
  type RunningApp,
} from '../support/app';
import { authenticate } from '../support/test-database';

/*
 * Changing the timezone (docs/features.md, Ref 7). Its check is
 * registration's and is a unit test in update-timezone.dto.spec.ts; here is
 * the change through the running app, and one refused body to show the
 * check is connected. What the change does to days is in
 * test/days/future.e2e-spec.ts.
 */
describe('changing the timezone (e2e)', () => {
  let running: RunningApp;

  beforeEach(async () => {
    running = await startApp();
  });

  afterEach(async () => {
    await stopApp(running);
  });

  it('changes the timezone, answers the user with it, and every later answer agrees', async () => {
    const habiba = as(
      running.server,
      await authenticate(running.server, 'habiba', 'Asia/Karachi'),
    );

    expect(
      ((await habiba.get('/auth/me').expect(200)).body as { timezone: string })
        .timezone,
    ).toBe('Asia/Karachi');

    const changed = await habiba
      .patch('/auth/me')
      .send({ timezone: 'america/new_york' })
      .expect(200);

    expect(changed.body).toMatchObject({
      email: 'habiba@example.com',
      timezone: 'America/New_York',
    });
    expect(
      ((await habiba.get('/auth/me').expect(200)).body as { timezone: string })
        .timezone,
    ).toBe('America/New_York');
  });

  it("refuses an offset, changes nothing, and changes no one else's", async () => {
    const habiba = as(
      running.server,
      await authenticate(running.server, 'habiba', 'Asia/Karachi'),
    );
    await authenticate(running.server, 'umer', 'Europe/London');

    const refused = await habiba
      .patch('/auth/me')
      .send({ timezone: '+05:00' })
      .expect(400);

    expect(messagesFrom(refused)).toEqual([
      'timezone must be an IANA time zone name such as Asia/Karachi',
    ]);

    await habiba.patch('/auth/me').send({ timezone: 'Asia/Tokyo' }).expect(200);

    expect(
      await running.dataSource.query(
        `SELECT email, timezone FROM users ORDER BY email`,
      ),
    ).toEqual([
      { email: 'habiba@example.com', timezone: 'Asia/Tokyo' },
      { email: 'umer@example.com', timezone: 'Europe/London' },
    ]);
  });
});
