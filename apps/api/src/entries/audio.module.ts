import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { EnvironmentVariables } from '../config/env.validation';
import { DatabaseModule } from '../database/database.module';
import { AudioKeysRepository } from './audio-keys.repository';
import { AudioStorage, resolveAudioPath } from './audio-storage';
import { AudioSweep } from './audio-sweep.service';
import { EntryEntity } from './entities/entry.entity';

/*
 * The audio of voice memos, as a module of its own inside entries, because
 * three modules need it: entries writes and plays it, auth removes it when
 * an account is deleted, and export reads it. EntriesModule imports
 * AuthModule, so AuthModule could not import EntriesModule for it.
 *
 * It imports nothing of auth, entries or export, so it is never part of a
 * cycle. The sweep at start lives here (ADR-024).
 */
@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([EntryEntity])],
  providers: [
    /*
     * Made once, at start, which is when its folder is made: a path that
     * cannot be a folder stops the start (ADR-007).
     */
    {
      provide: AudioStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        new AudioStorage(
          resolveAudioPath(config.get('AUDIO_PATH', { infer: true })),
        ),
    },
    AudioKeysRepository,
    AudioSweep,
  ],
  exports: [AudioStorage, AudioKeysRepository],
})
export class AudioModule {}
