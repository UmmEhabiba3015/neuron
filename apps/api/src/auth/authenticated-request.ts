import type { Request } from 'express';
import type { User } from '../users/user.entity';

// What `JwtAuthGuard` leaves on the request, and the one place its name and
// type are written down. A handler reads `request.user`; this is what makes
// that a checked property rather than an `any` the compiler cannot help with.
//
// A `User`, not the token payload. The payload is a set of claims frozen at
// login and valid for an hour, so a user deleted five minutes ago would keep
// working for the remaining fifty-five. Deleting a journal account is somebody
// saying "I want out, now", and honouring that an hour late is the wrong
// answer for this application in particular. The same reasoning covers a
// disabled account and a password reset after a compromise: each is a
// revocation, and a frozen claim cannot be revoked.
//
// The cost is one indexed primary-key lookup per authenticated request, on a
// connection the request was going to open anyway.
export interface AuthenticatedRequest extends Request {
  user: User;
}
