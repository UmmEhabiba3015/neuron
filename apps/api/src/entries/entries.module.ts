import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.entity';

@Module({
  imports: [
    DatabaseModule,

    AuthModule,

    TypeOrmModule.forFeature([JournalEntry]),
  ],
  controllers: [EntriesController],

  providers: [EntriesService, EntriesRepository],
})
export class EntriesModule {}
