import type { User } from '@neuron/contracts';
import type { UserEntity } from '../../users/entities/user.entity';

/*
 * A person as the API sends them. Built field by field from the entity, so
 * the password hash, which the entity also holds, cannot follow it into a
 * response.
 *
 * The fields are declared in the order the JSON has always had them, and
 * the order of the declarations is the order of the keys.
 */
export class UserResponseDto implements User {
  id: string;
  email: string;
  createdAt: string;
  name: string;
  timezone: string;

  constructor(user: UserEntity) {
    this.id = user.id;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.name = user.name;
    this.timezone = user.timezone;
  }
}
