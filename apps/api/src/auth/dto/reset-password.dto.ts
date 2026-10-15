import { PASSWORD_MIN_LENGTH, type ResetPassword } from '@neuron/contracts';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/*
 * The password has RegisterDto's rules. The token is only required to be
 * some text: whether it is a real one is the service's to say, with the one
 * answer it gives for every link that does not work.
 */
export class ResetPasswordDto implements ResetPassword {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(128)
  password!: string;
}
