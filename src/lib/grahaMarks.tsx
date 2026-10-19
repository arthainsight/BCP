'use client';

import { createContext, useContext } from 'react';
import type { YogiRole } from './yogiPoints';

// The Yogi, Sahayogi and Avayogi marked on the grahas of the charts (a layer of the chart that is switched on in the ··· menu, like the
// dasha lords). The page provides who holds which role; the charts add the small letters after the graha and the roles to its hover text.

/** The small letter after the name of a graha for each role. */
export const YOGI_MARK: Record<YogiRole, string> = { Yogi: 'ʸ', Sahayogi: 'ˢ', Avayogi: 'ᵃ' };

export type GrahaRoles = Record<string, YogiRole[]>;

export const GrahaMarksContext = createContext<GrahaRoles>({});

/** The roles of the grahas to mark: empty when the layer is off. */
export const useGrahaRoles = () => useContext(GrahaMarksContext);

/** The letters of the roles of a graha, in the order Yogi, Sahayogi, Avayogi. */
export function yogiMarkOf(roles: GrahaRoles, graha: string): string {
  return (['Yogi', 'Sahayogi', 'Avayogi'] as const).filter(role => roles[graha]?.includes(role)).map(role => YOGI_MARK[role]).join('');
}
