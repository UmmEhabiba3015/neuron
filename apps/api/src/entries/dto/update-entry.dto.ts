import type { UpdateEntry } from '@neuron/contracts';
import { IsString, ValidateIf } from 'class-validator';
import { ContainsAtLeastOneField } from '../../shared/decorators/contains-at-least-one-field.decorator';
import { ContainsNoNulCharacter } from '../../shared/decorators/contains-no-nul-character.decorator';
import { ContainsNonWhitespace } from '../../shared/decorators/contains-non-whitespace.decorator';

/*
 * The contract's UpdateEntry has one field, and it is required. A body
 * without it is still refused with the class-level message, which names the
 * fault better than "content must be a string" would. Once the body has been
 * validated, `content` is always there, which is what `!` says.
 */
@ContainsAtLeastOneField()
export class UpdateEntryDto implements UpdateEntry {
  @ValidateIf((dto: UpdateEntryDto) => dto.content !== undefined)
  @IsString()
  @ContainsNonWhitespace()
  @ContainsNoNulCharacter()
  content!: string;
}
