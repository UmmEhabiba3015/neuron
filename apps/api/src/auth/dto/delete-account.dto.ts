import type { DeleteAccount } from '@neuron/contracts';
import { IsNotEmpty, IsString } from 'class-validator';

/*
 * Only that a password was sent. Whether it is the person's own is the
 * service's question, and a wrong one is a 400 of its own (ADR-024).
 */
export class DeleteAccountDto implements DeleteAccount {
  @IsString()
  @IsNotEmpty()
  password!: string;
}
