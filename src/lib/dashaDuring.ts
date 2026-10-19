import type { GrahaDashaTable } from './dashaEvents';

// The daśā lords through a stretch of time, for putting the daśās beside other timing: which mahādaśā and antardaśā lords run while it lasts.

export interface DashaStretch {
  md: string;
  ad: string;
  /** In ms since the epoch, cut to the stretch asked for. */
  startTime: number;
  endTime: number;
}

/** The mahādaśā and antardaśā lords that run between two moments, in time order, each with the time it runs inside them. */
export function dashaLordsDuring(table: GrahaDashaTable, fromTime: number, toTime: number): DashaStretch[] {
  const stretches: DashaStretch[] = [];
  for (const md of table.entries) {
    if (md.endDate.getTime() <= fromTime || md.startDate.getTime() >= toTime) continue;
    for (const ad of table.children(md)) {
      const start = Math.max(ad.startDate.getTime(), fromTime);
      const end = Math.min(ad.endDate.getTime(), toTime);
      if (end > start) stretches.push({ md: md.lord, ad: ad.lord, startTime: start, endTime: end });
    }
  }
  return stretches;
}

/** Which lord to ask for: the mahādaśā lord alone, or the mahādaśā or antardaśā lord. */
export type LordLevel = 'md' | 'mdad';

/** Whether one of the grahas is a lord (of the level asked for) at some time of the stretches. */
export function hasLord(stretches: readonly DashaStretch[], grahas: readonly string[], level: LordLevel): boolean {
  return stretches.some(stretch => grahas.includes(stretch.md) || (level === 'mdad' && grahas.includes(stretch.ad)));
}
