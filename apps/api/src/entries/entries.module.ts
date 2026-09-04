import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.entity';

@Module({
  imports: [
    DatabaseModule,
    // `forRoot` opens the connection; `forFeature` says which tables this
    // feature may reach. Both are needed, and omitting this one fails at boot
    // rather than at compile time.
    TypeOrmModule.forFeature([JournalEntry]),
  ],
  controllers: [EntriesController],
  // EntriesRepository is deliberately not exported: nothing outside this module
  // should reach past the service to the database.
  providers: [EntriesService, EntriesRepository],
})
export class EntriesModule {}
