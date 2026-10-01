import { IsString, ValidateIf } from 'class-validator';

/*
 * The same filters the listing takes, without the paging. forbidNonWhitelisted
 * is on globally, so /entries/count?wrod=sister is a 400 rather than a count
 * of everything -- which is how the original bug would have looked to a
 * client: a plausible number, quietly wrong.
 */
export class CountEntriesQueryDto {
  @ValidateIf((query: CountEntriesQueryDto) => query.word !== undefined)
  @IsString()
  word?: string;
}
