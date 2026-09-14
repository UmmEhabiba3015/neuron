import { IsString, ValidateIf } from 'class-validator';

export class FindEntriesQueryDto {
  @ValidateIf((query: FindEntriesQueryDto) => query.word !== undefined)
  @IsString()
  word?: string;
}
