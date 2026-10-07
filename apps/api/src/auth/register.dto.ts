import {
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type WireRegistration,
} from '@neuron/contracts';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ContainsNonWhitespace } from '../validation/contains-non-whitespace.decorator';
import {
  IsIanaTimeZone,
  resolveTimeZone,
} from '../validation/is-iana-time-zone.decorator';

export class RegisterDto implements WireRegistration {
  /*
   * 254 is the longest an address can be, from the SMTP path limit in
   * RFC 5321. IsEmail is deliberately the only shape check: anything
   * stricter rejects addresses that really exist.
   */
  @IsEmail({}, { message: 'email must be an email address' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  password: string;

  /*
   * Trimmed here and not in the service, because the pipe transforms a body
   * before it validates it. The rules below therefore measure the trimmed
   * name, which is the one that is stored: sixty characters with a space on
   * each side is sixty characters.
   *
   * Anything that is not a string is passed on untouched, so IsString is
   * what refuses it.
   */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @ContainsNonWhitespace()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  /*
   * Replaced by the name it is stored under, for the same reason the name is
   * trimmed here. A value that is not a timezone is passed on untouched and
   * refused below.
   *
   * There is no default. An account that started in a zone nobody chose
   * would file its entries under the wrong dates with nothing to show for it.
   */
  @Transform(({ value }: { value: unknown }) => resolveTimeZone(value) ?? value)
  @IsIanaTimeZone()
  timezone: string;
}
