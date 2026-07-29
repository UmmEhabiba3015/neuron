import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

// A "module" is Nest's unit of grouping: it declares which controllers
// and services belong together as one feature. It also lets Nest wire up
// dependency injection — EntriesController asks for an EntriesService in
// its constructor, and Nest uses this module's `providers` list to know
// what to hand it, without the controller ever calling `new EntriesService()`
// itself.
@Module({
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
