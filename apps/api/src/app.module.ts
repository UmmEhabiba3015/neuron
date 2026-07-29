import { Module } from '@nestjs/common';
import { EntriesModule } from './entries/entries.module';

// The root module. It doesn't do anything itself — it just assembles the
// feature modules that make up the app. Right now there's only one:
// EntriesModule. As the app grows, new features get their own module and
// get listed here, rather than everything living in one giant file.
@Module({
  imports: [EntriesModule],
})
export class AppModule {}
