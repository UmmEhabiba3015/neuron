import type { AccountDeletionService } from './account-deletion.service';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import type { UsersService } from '../users/users.service';

/*
 * POST /auth/forgot-password answers before anything is looked up, stored or
 * sent, so its timing does not say which addresses have accounts
 * (docs/features.md, Ref 4).
 *
 * The service is the real one, with request() made to never finish. If the
 * handler waited for it, in any way, its answer would never come.
 */
describe('AuthController', () => {
  describe('forgotPassword', () => {
    /* Nothing below reaches these: request() is replaced. */
    const passwordResetService = new PasswordResetService(
      ...(new Array(7).fill(undefined) as ConstructorParameters<
        typeof PasswordResetService
      >),
    );

    const controller = new AuthController(
      undefined as unknown as UsersService,
      undefined as unknown as AuthService,
      passwordResetService,
      undefined as unknown as AccountDeletionService,
    );

    afterEach(() => jest.restoreAllMocks());

    it('answers while the request it started has not settled', async () => {
      const request = jest
        .spyOn(passwordResetService, 'request')
        .mockReturnValue(new Promise<void>(() => {}));

      const answer = Promise.resolve(
        controller.forgotPassword({ email: 'umer@example.com' }),
      ).then(() => 'answered');
      const stillWaiting = new Promise<string>((resolve) =>
        setImmediate(() => resolve('still waiting')),
      );

      await expect(Promise.race([answer, stillWaiting])).resolves.toBe(
        'answered',
      );
      expect(request).toHaveBeenCalledWith('umer@example.com');
    });
  });
});
