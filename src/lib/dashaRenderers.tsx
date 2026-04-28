import { ReactNode } from 'react';
import { BcpResult, PlanetData, CharaOptions } from '@/types';
import { DashaRendererKey } from './dashaRegistry';
import BcpSummary from '@/components/BcpSummary';
import VimshottariPanel from '@/components/VimshottariPanel';
import VdsPanel from '@/components/VdsPanel';
import CharaCleanPanel from '@/components/CharaCleanPanel';

export type DashaRendererContext = {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  charaOptions: CharaOptions;
};

const RENDERERS: Record<DashaRendererKey, (ctx: DashaRendererContext) => ReactNode> = {
  bcp: ({ bcp, planets, ascendant }) => (
    <BcpSummary bcp={bcp} planets={planets} ascSign={ascendant.sign} />
  ),
  vimshottari: ({ planets, birthDatetime }) => (
    <VimshottariPanel planets={planets} birthDatetime={birthDatetime} />
  ),
  vds: ({ planets, ascendant, birthDatetime }) => (
    <VdsPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
  ),
  chara: ({ planets, ascendant, birthDatetime, charaOptions }) => (
    <CharaCleanPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} settings={charaOptions} />
  ),
};

export function renderDasha(rendererKey: DashaRendererKey, ctx: DashaRendererContext) {
  return RENDERERS[rendererKey]?.(ctx) ?? null;
}
