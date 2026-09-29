import { IsString } from 'class-validator';

/*
 * Login does not validate the shape of the address, and that is deliberate.
 * Registration decides what a valid address is; login only decides whether
 * these credentials match. Rejecting a malformed address here with a
 * different error would tell an attacker which addresses were never valid,
 * and every failure on this route has to look the same -- see ADR-012.
 */
export class LoginDto {
  @IsString()
  email: string;

  @IsString()
  password: string;
}
