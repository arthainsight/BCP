'use client';

import { PlanetData } from '@/types';

const OUTER_PLANETS = ['Uranus','Neptune','Pluto'];

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  ascendantSign: number;
  planets: PlanetData[];
  transitPlanets?: PlanetData[];
  showNatalPlanets?: boolean;
  showTransitPlanets?: boolean;
  showSigns?: boolean;
  showDegrees?: boolean;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  showOuterPlanets?: boolean;
  karakaByPlanet?: Record<string, string>;
}

const SIGN_NAMES = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
  Uranus:'Ur', Neptune:'Ne', Pluto:'Pl'
};
const TRANSIT_COLOR = '#f43f5e';

function filterOuter(planets: PlanetData[], showOuter?: boolean) {
  return showOuter ? planets : planets.filter(p => !OUTER_PLANETS.includes(p.name));
}

export default function SouthIndianChart({
  activeYearHouse,
  activeMonthHouse,
  ascendantSign,
  planets,
  transitPlanets = [],
  showNatalPlanets = true,
  showTransitPlanets = false,
  showSigns = true,
  showDegrees = false,
  showCharaKaraka = false,
  showNakshatra = false,
  showOuterPlanets = false,
  karakaByPlanet = {},
}: Props) {
  type MergedPlanet = PlanetData & { isTransit: boolean };
  const bySign: Record<number, MergedPlanet[]> = {};

  const natal = filterOuter(planets, showOuterPlanets);
  const transits = filterOuter(transitPlanets, showOuterPlanets);

  if (showNatalPlanets) {
    natal.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: false });
    });
  }

  if (showTransitPlanets) {
    transits.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: true });
    });
  }

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="grid gap-1 aspect-square" style={{gridTemplateColumns:'repeat(4,1fr)',gridTemplateRows:'repeat(4,1fr)'}}>
        {Array.from({length:16}).map((_,i)=>{
          const sign = [12,1,2,3,11,null,null,4,10,null,null,5,9,8,7,6][i];
          if(!sign) return <div key={i} />;

          const house = ((sign - ascendantSign + 12) % 12) + 1;
          const planetsHere = bySign[sign] ?? [];

          return (
            <div key={i} className="border p-1 text-xs">
              {showSigns && SIGN_NAMES[sign]}
              {planetsHere.map((p,idx)=>(
                <div key={idx} style={p.isTransit?{color:TRANSIT_COLOR}:{}}>
                  {PLANET_CODES[p.name] ?? p.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
