import type { PalmRecord } from './storage';

/**
 * The photograph to put beside the open one when two palms are compared: the other hand when there is one
 * (a right hand beside a left), otherwise the next photograph, otherwise the same one.
 */
export function pairFor(records: Pick<PalmRecord, 'id' | 'side'>[], firstId: string): string {
  const first = records.find(record => record.id === firstId);
  const others = records.filter(record => record.id !== firstId);
  const opposite = first && first.side !== 'other' ? others.find(record => record.side !== 'other' && record.side !== first.side) : undefined;
  return (opposite ?? others[0] ?? records[0]).id;
}
