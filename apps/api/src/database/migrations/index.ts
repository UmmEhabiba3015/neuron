import type { MigrationInterface } from 'typeorm';
import { Baseline1793123529224 } from './1793123529224-Baseline';
import { KeptOutOfMemory1793174439276 } from './1793174439276-KeptOutOfMemory';

type Migration = new () => MigrationInterface;

/*
 * One baseline since the move to Postgres (feature 8), and every change
 * after it, oldest first. The SQLite migrations before it are in git's
 * history.
 */
export const migrations: Migration[] = [
  Baseline1793123529224,
  KeptOutOfMemory1793174439276,
];
