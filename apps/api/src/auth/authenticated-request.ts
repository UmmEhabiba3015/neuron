import type { Request } from 'express';
import type { User } from '../users/user.entity';

export interface AuthenticatedRequest extends Request {
  user: User;
  session: { id: string };
}
