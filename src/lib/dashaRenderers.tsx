import { ReactNode } from 'react';
import { PlanetData, CharaOptions, RasiDashaOptions } from '@/types';
import { DashaRendererKey } from './dashaRegistry';
import VimshottariPanel from '@/components/VimshottariPanel';
import VdsPanel from '@/components/VdsPanel';
import VimshottariVariantPanel from '@/components/VimshottariVariantPanel';
import type { VimshottariVariantChoice } from './vimshottariVariants';
import CharaCleanPanel from '@/components/CharaCleanPanel';
import KalachakraPanel from '@/components/KalachakraPanel';
import YoginiPanel from '@/components/YoginiPanel';
import AshtottariPanel from '@/components/AshtottariPanel';
import NaisargikaPanel from '@/components/NaisargikaPanel';
import RasiDashaPanel from '@/components/RasiDashaPanel';
import NakshatraSystemPanel from '@/components/NakshatraSystemPanel';
import AyurdayaPanel from '@/components/AyurdayaPanel';
import { NAKSHATRA_SYSTEM_KEYS, type NakshatraSystemKey } from './nakshatraSystems';

export type DashaRendererContext = {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  charaOptions: CharaOptions;
  rasiOptions: RasiDashaOptions;
  variantChoice: VimshottariVariantChoice;
};

const RENDERERS: Record<DashaRendererKey, (ctx: DashaRendererContext) => ReactNode> = {
  vimshottari: ({ planets, birthDatetime }) => (
    <VimshottariPanel planets={planets} birthDatetime={birthDatetime} />
  ),
  vimshottariVariant: ({ planets, ascendant, birthDatetime, variantChoice }) => (
    <VimshottariVariantPanel planets={planets} birthDatetime={birthDatetime} choice={variantChoice} ascendantSign={ascendant.sign} />
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
  naisargika: ({ planets, ascendant, birthDatetime }) => <NaisargikaPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />,
  paindi: ({ planets, ascendant, birthDatetime }) => <AyurdayaPanel kind="paindi" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />,
  amshi: ({ planets, ascendant, birthDatetime }) => <AyurdayaPanel kind="amshi" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />,
  narayana: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="narayana" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  moola: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="moola" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  sthira: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="sthira" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  yogardha: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="yogardha" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  drig: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="drig" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  trikona: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="trikona" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  shula: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="shula" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  mandooka: ({ planets, ascendant, birthDatetime, rasiOptions, charaOptions }) => <RasiDashaPanel system="mandooka" planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} options={rasiOptions} karaka={charaOptions.karaka} />,
  ...(Object.fromEntries(NAKSHATRA_SYSTEM_KEYS.map(system => [system, ({ planets, ascendant, birthDatetime }: DashaRendererContext) => (
    <NakshatraSystemPanel system={system} planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
  )])) as Record<NakshatraSystemKey, (ctx: DashaRendererContext) => ReactNode>),
};

export function renderDasha(rendererKey: DashaRendererKey, ctx: DashaRendererContext) {
  return RENDERERS[rendererKey]?.(ctx) ?? null;
}
