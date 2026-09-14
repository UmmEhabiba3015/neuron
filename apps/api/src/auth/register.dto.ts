import { IsString, MaxLength, MinLength } from 'class-validator';
import { ContainsNonWhitespace } from '../entries/contains-non-whitespace.decorator';

export class RegisterDto {
  @IsString()
  @ContainsNonWhitespace()
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
