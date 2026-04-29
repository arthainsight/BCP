import { getSignIndex } from './utils';

// D1 Rasi: the natal sign itself
export function calcD1(longitude: number): number {
  return getSignIndex(longitude);
}
