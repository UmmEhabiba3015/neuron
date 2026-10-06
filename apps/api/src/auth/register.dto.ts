import { PASSWORD_MIN_LENGTH } from '@neuron/contracts';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
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
}
