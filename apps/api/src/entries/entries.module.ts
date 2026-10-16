import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DaysModule } from '../days/days.module';
import type { EnvironmentVariables } from '../config/env.validation';
import { AudioStorage, resolveAudioPath } from './audio-storage';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { EntryEntity } from './entities/entry.entity';

@Module({
  imports: [
    DatabaseModule,

    AuthModule,

    DaysModule,

    TypeOrmModule.forFeature([EntryEntity]),
  ],
  controllers: [EntriesController],

  providers: [
    EntriesService,
    EntriesRepository,
    /*
     * Made once, at start, which is when its folder is made: a path that
     * cannot be a folder stops the start (ADR-007).
     */
    {
      provide: AudioStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        new AudioStorage(
          resolveAudioPath(
            config.get('AUDIO_PATH', { infer: true }),
            config.get('DATABASE_PATH', { infer: true }),
          ),
        ),
    },
  ],
})
export class EntriesModule {}
