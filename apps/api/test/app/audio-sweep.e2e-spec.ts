import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AudioStorage } from '../../src/entries/audio-storage';
import { configureHttp } from '../../src/shared/utils/configure-http';
import {
  closeTestDataSource,
  createTestDataSource,
} from '../support/test-database';

/*
 * ADR-024, decision 4: the sweep runs before the API listens, so it can
 * never meet an upload whose file is written and whose row is not yet.
 * Here the sweep is held part way, and the port must stay shut until it is
 * let go. Which files it keeps is a unit test of AudioSweep.
 */
describe('the audio sweep at start (e2e)', () => {
  const ORPHAN = '44444444-4444-4444-8444-444444444444';

  let dataSource: DataSource;
  let folder: string;
  let app: INestApplication | undefined;

  beforeEach(async () => {
    dataSource = await createTestDataSource();
    folder = mkdtempSync(join(tmpdir(), 'neuron-sweep-start-'));
  });

  afterEach(async () => {
    await app?.close();
    await closeTestDataSource(dataSource);
    rmSync(folder, { recursive: true, force: true });
  });

  it('finishes before the port opens, so no request is served during it', async () => {
    const storage = new AudioStorage(folder);
    await storage.write(ORPHAN, Buffer.from('left by a crash'));

    let letGo!: () => void;
    const held = new Promise<void>((resolve) => (letGo = resolve));
    const listing = storage.keys.bind(storage);
    const keys = jest.spyOn(storage, 'keys').mockImplementation(async () => {
      await held;

      return listing();
    });

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .overrideProvider(AudioStorage)
      .useValue(storage)
      .compile();

    app = moduleFixture.createNestApplication();
    configureHttp(app);

    let listened = false;
    const listening = app.listen(0, '127.0.0.1').then(() => {
      listened = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(keys).toHaveBeenCalled();
    expect(listened).toBe(false);
    expect((app.getHttpServer() as { listening: boolean }).listening).toBe(
      false,
    );
    expect(existsSync(join(folder, ORPHAN))).toBe(true);

    letGo();
    await listening;

    expect(existsSync(join(folder, ORPHAN))).toBe(false);
    await request(app.getHttpServer() as never)
      .get('/auth/me')
      .expect(401);
  });
});
