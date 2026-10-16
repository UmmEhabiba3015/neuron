import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { MAX_BODY_BYTES, TOO_LARGE } from '../voice-memo-rules';
import { VoiceMemoSizeInterceptor } from './voice-memo-size.interceptor';

describe('VoiceMemoSizeInterceptor', () => {
  const interceptor = new VoiceMemoSizeInterceptor();

  const contextWith = (headers: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    }) as unknown as ExecutionContext;

  const handler = (answer: () => unknown) => {
    const handle = jest.fn(answer);

    return { handle, next: { handle } as unknown as CallHandler };
  };

  it('refuses a body that says it is too large, before anything reads it', () => {
    const { handle, next } = handler(() => of('created'));

    expect(() =>
      interceptor.intercept(
        contextWith({ 'content-length': String(MAX_BODY_BYTES + 1) }),
        next,
      ),
    ).toThrow(new BadRequestException(TOO_LARGE));
    expect(handle).not.toHaveBeenCalled();
  });

  it.each([
    ['exactly the largest body', { 'content-length': String(MAX_BODY_BYTES) }],
    ['a body that does not say its length', {}],
  ])('lets %s through to multer', async (_label, headers) => {
    const { handle, next } = handler(() => of('created'));

    await expect(
      lastValueFrom(interceptor.intercept(contextWith(headers), next)),
    ).resolves.toBe('created');
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("turns multer's 413 for a file over the limit into the 400 of every other refusal", async () => {
    const { next } = handler(() =>
      throwError(() => new PayloadTooLargeException('File too large')),
    );

    await expect(
      lastValueFrom(interceptor.intercept(contextWith({}), next)),
    ).rejects.toEqual(new BadRequestException(TOO_LARGE));
  });

  it('leaves every other error as it was', async () => {
    const notFound = new NotFoundException('gone');
    const { next } = handler(() => throwError(() => notFound));

    await expect(
      lastValueFrom(interceptor.intercept(contextWith({}), next)),
    ).rejects.toBe(notFound);
  });
});
