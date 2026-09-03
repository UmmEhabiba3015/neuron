import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../database/database.module';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';
import { JournalEntry } from './entry.interface';

// A "module" is Nest's unit of grouping: it declares which controllers
// and services belong together as one feature. It also lets Nest wire up
// dependency injection — EntriesController asks for an EntriesService in
// its constructor, and Nest uses this module's `providers` list to know
// what to hand it, without the controller ever calling `new EntriesService()`
// itself.
@Module({
  imports: [
    // The connection. Importing it here is what makes the repository token
    // below resolvable — providers are private to their own module until
    // they're exported *and* imported.
    DatabaseModule,
    // `forFeature` is the half of TypeORM's wiring that names entities rather
    // than connections: it registers one provider per entity listed, under the
    // token `@InjectRepository(JournalEntry)` asks for. `forRoot` opens the
    // database once for the whole application; `forFeature` says which tables
    // *this* feature is allowed to reach. Both are needed, and forgetting the
    // second fails at boot with "Nest can't resolve dependencies of
    // EntriesRepository" rather than at compile time — the same shape of
    // failure the Day 4 finding recorded for a missing provider.
    TypeOrmModule.forFeature([JournalEntry]),
  ],
  controllers: [EntriesController],
  // EntriesRepository is listed but deliberately not exported: EntriesService
  // cannot be constructed without it, and nothing outside this module should
  // be able to reach past the service to the database. Omitting it here fails
  // at boot rather than at compile time, because DI wiring is resolved when
  // the application starts.
  providers: [EntriesService, EntriesRepository],
})
export class EntriesModule {}
