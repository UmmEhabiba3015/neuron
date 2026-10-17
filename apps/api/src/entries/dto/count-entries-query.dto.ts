import { EntryKind } from '@neuron/contracts';
import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { IsCalendarDate } from '../../shared/decorators/is-calendar-date.decorator';

export class CountEntriesQueryDto {
  @ValidateIf((query: CountEntriesQueryDto) => query.word !== undefined)
  @IsString()
  word?: string;

  @ValidateIf((query: CountEntriesQueryDto) => query.date !== undefined)
  @IsCalendarDate()
  date?: string;

  /*
   * Text or Voice, as the contract's EntryKind writes them. Present and
   * empty is refused, as ?date= is.
   */
  @ValidateIf((query: CountEntriesQueryDto) => query.kind !== undefined)
  @IsEnum(EntryKind)
  kind?: EntryKind;
}
