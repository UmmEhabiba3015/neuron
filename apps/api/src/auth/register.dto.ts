import { IsString, MaxLength, MinLength } from 'class-validator';
import { ContainsNonWhitespace } from '../entries/contains-non-whitespace.decorator';

// The registration body, validated at the boundary like every other DTO here.
// Anything not listed is rejected rather than ignored, which comes from
// `forbidNonWhitelisted` on the global pipe (ADR-008).
export class RegisterDto {
  @IsString()
  // `@IsString()` accepts "" and "   ", and a user called "   " cannot be
  // typed back by anyone. Reused from the entries DTOs rather than rewritten.
  @ContainsNonWhitespace()
  @MaxLength(100)
  name: string;

  @IsString()
  // A minimum, and deliberately a low one. Length is the only property of a
  // password this application is willing to have an opinion about: composition
  // rules ("one symbol, one digit") push people toward `Password1!` and are no
  // longer recommended by NIST, whose current guidance is to check length and
  // otherwise get out of the way.
  @MinLength(8)
  // The maximum is a denial-of-service control rather than a security rule.
  // Hashing cost rises with input length, so an unbounded field lets anyone
  // make the server do unbounded work with one request. 128 is far above any
  // real passphrase.
  //
  // Worth knowing for the comparison this project did not take: **bcrypt
  // silently truncates at 72 bytes**, so a 100-character passphrase would have
  // had its last 28 characters ignored with no error at all. argon2 has no such
  // limit, which is one of the reasons the choice went the way it did.
  @MaxLength(128)
  password: string;
}
