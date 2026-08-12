import { ReactNode } from 'react';
import { BcpResult, PlanetData, CharaOptions, RasiDashaOptions } from '@/types';
import { DashaRendererKey } from './dashaRegistry';
import VimshottariPanel from '@/components/VimshottariPanel';
import VdsPanel from '@/components/VdsPanel';
import CharaCleanPanel from '@/components/CharaCleanPanel';
import KalachakraPanel from '@/components/KalachakraPanel';
import YoginiPanel from '@/components/YoginiPanel';
import AshtottariPanel from '@/components/AshtottariPanel';
import RasiDashaPanel from '@/components/RasiDashaPanel';

export type DashaRendererContext = {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  charaOptions: CharaOptions;
  rasiOptions: RasiDashaOptions;
};

const RENDERERS: Record<DashaRendererKey, (ctx: DashaRendererContext) => ReactNode> = {
  vimshottari: ({ planets, birthDatetime }) => (
    <VimshottariPanel planets={planets} birthDatetime={birthDatetime} />
  ),
  vds: ({ planets, ascendant, birthDatetime }) => (
    <VdsPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
  ),
  chara: ({ planets, ascendant, birthDatetime, charaOptions }) => (
    <CharaCleanPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} settings={charaOptions} />
  ),
  kalachakra: ({ planets, birthDatetime }) => (
    <KalachakraPanel planets={planets} birthDatetime={birthDatetime} />
  ),
  yogini: ({ planets, birthDatetime }) => (
    <YoginiPanel planets={planets} birthDatetime={birthDatetime} />
  ),
  ashtottari: ({ planets, ascendant, birthDatetime }) => (
    <AshtottariPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
  ),
  narayana: ({ planets, ascendant, birthDatetime, rasiOptions }) => <RasiDashaPanel system="narayana" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} />,
  moola: ({ planets, ascendant, birthDatetime, rasiOptions }) => <RasiDashaPanel system="moola" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} />,
  sthira: ({ planets, ascendant, birthDatetime, rasiOptions }) => <RasiDashaPanel system="sthira" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} />,
};

export function renderDasha(rendererKey: DashaRendererKey, ctx: DashaRendererContext) {
  return RENDERERS[rendererKey]?.(ctx) ?? null;
}
