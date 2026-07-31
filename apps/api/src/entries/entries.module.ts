import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EntriesController } from './entries.controller';
import { EntriesRepository } from './entries.repository';
import { EntriesService } from './entries.service';

// A "module" is Nest's unit of grouping: it declares which controllers
// and services belong together as one feature. It also lets Nest wire up
// dependency injection — EntriesController asks for an EntriesService in
// its constructor, and Nest uses this module's `providers` list to know
// what to hand it, without the controller ever calling `new EntriesService()`
// itself.
@Module({
  // EntriesRepository asks for the DATABASE token, which lives in
  // DatabaseModule. Importing it here is what makes that token resolvable —
  // providers are private to their own module until they're exported *and*
  // imported.
  imports: [DatabaseModule],
  controllers: [EntriesController],
  // EntriesRepository is listed but deliberately not exported: EntriesService
  // cannot be constructed without it, and nothing outside this module should
  // be able to reach past the service to the database. Omitting it here fails
  // at boot rather than at compile time, because DI wiring is resolved when
  // the application starts.
  providers: [EntriesService, EntriesRepository],
})
export class EntriesModule {}
