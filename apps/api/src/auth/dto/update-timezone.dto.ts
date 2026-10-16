import type { UpdateTimezone } from '@neuron/contracts';
import { Transform } from 'class-transformer';
import {
  IsIanaTimeZone,
  resolveTimeZone,
} from '../../shared/decorators/is-iana-time-zone.decorator';

/*
 * The body of PATCH /auth/me. The timezone is checked exactly as
 * registration checks it (RegisterDto): an IANA name that Node knows, stored
 * under the name Node gives it, and never an offset such as +05:00.
 */
export class UpdateTimezoneDto implements UpdateTimezone {
  @Transform(({ value }: { value: unknown }) => resolveTimeZone(value) ?? value)
  @IsIanaTimeZone()
  timezone!: string;
}
