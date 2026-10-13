'use client';

import { Gate } from '@/components/layout/Gate';
import { PageNotFound } from './Missing';

/*
 * The same screen a missing day gets, behind the same gate: a person who is
 * not signed in is sent to sign in, as from any other address of the journal.
 */
export function AddressNotFound() {
  return <Gate>{() => <PageNotFound />}</Gate>;
}
