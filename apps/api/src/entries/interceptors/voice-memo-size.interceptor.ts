import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { catchError, type Observable } from 'rxjs';
import { MAX_BODY_BYTES, TOO_LARGE } from '../voice-memo-rules';

/*
 * Stands in front of multer on POST /entries/voice.
 *
 * A body that says in its Content-Length that it is too large is refused
 * before any of it is read. A body that does not say, or says less than it
 * sends, is stopped by multer at the limit, which answers 413; that is turned
 * into the 400 every other refusal of an upload is.
 */
@Injectable()
export class VoiceMemoSizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const declared = Number(request.headers['content-length']);

    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      throw new BadRequestException(TOO_LARGE);
    }

    return next.handle().pipe(
      catchError((error: unknown) => {
        throw error instanceof PayloadTooLargeException
          ? new BadRequestException(TOO_LARGE)
          : error;
      }),
    );
  }
}
