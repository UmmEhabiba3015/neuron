import { IsString } from 'class-validator';

// Deliberately thinner than `RegisterDto`. Registration decides what a valid
// new credential looks like — a minimum length, a maximum, a non-whitespace
// name — and login only has to carry what the caller typed to the check.
//
// Re-applying `@MinLength(8)` here would be a real information leak rather than
// tidiness: a 4-character password would come back 400 with "password must be
// longer than or equal to 8 characters" while a wrong 12-character one came
// back 401, so the response would distinguish "too short to be anyone's
// password" from "wrong". It would also break every account whose password
// predates a future rule change.
//
// One shape of failure for every bad credential is the whole point (see
// `auth.service.ts`), and that starts with validation not sorting them first.
export class LoginDto {
  @IsString()
  name: string;

  @IsString()
  password: string;
}
