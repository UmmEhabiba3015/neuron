import type { MigrationInterface } from 'typeorm';
import { Baseline1793123529224 } from './1793123529224-Baseline';

type Migration = new () => MigrationInterface;

/*
 * One baseline since the move to Postgres (feature 8). The SQLite
 * migrations before it are in git's history.
 */
export const migrations: Migration[] = [Baseline1793123529224];
