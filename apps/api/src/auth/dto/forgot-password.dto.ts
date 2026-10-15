import type { ForgotPassword } from '@neuron/contracts';
import { IsEmail, MaxLength } from 'class-validator';

/*
 * The same shape check as RegisterDto's. Refusing an address that is not
 * one tells nobody anything about who has an account, because no account
 * can have such an address.
 */
export class ForgotPasswordDto implements ForgotPassword {
  @IsEmail({}, { message: 'email must be an email address' })
  @MaxLength(254)
  email!: string;
}
