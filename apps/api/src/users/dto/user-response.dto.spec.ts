import { UserEntity } from '../entities/user.entity';
import { UserResponseDto } from './user-response.dto';

describe('UserResponseDto', () => {
  const user = Object.assign(new UserEntity(), {
    id: 'user-1',
    email: 'habiba@example.com',
    createdAt: '2026-09-01T00:00:00.000Z',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA',
    name: 'Habiba',
    timezone: 'Pacific/Kiritimati',
  });

  it('carries the id, the address, when it was made and the name, in that order', () => {
    expect(Object.keys(new UserResponseDto(user))).toEqual([
      'id',
      'email',
      'createdAt',
      'name',
    ]);
  });

  it('carries neither the password hash nor the timezone', () => {
    const json = JSON.stringify(new UserResponseDto(user));

    expect(json).not.toContain('$argon2');
    expect(json).not.toMatch(/time_?zone|Kiritimati/i);
  });
});
