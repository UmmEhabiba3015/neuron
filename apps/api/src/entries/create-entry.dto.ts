import { IsString } from 'class-validator';
import { ContainsNonWhitespace } from './contains-non-whitespace.decorator';

// A class rather than an interface because decorators need a runtime object to
// attach to. Anything not listed here is rejected rather than ignored — that
// comes from `forbidNonWhitelisted` on the pipe in `app.module.ts`, so the
// absence of a field is as load-bearing as its presence (ADR-008).
export class CreateEntryDto {
  // Not redundant with the type: SQLite TEXT has affinity, not constraint, so
  // the number 42 is stored as "42" and one entry would have two types
  // depending on which endpoint served it (ADR-005).
  @IsString()
  // `@IsString()` accepts "" and "   ".
  @ContainsNonWhitespace()
  content: string;
}
