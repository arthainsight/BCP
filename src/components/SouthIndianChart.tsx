'use client';

import { PlanetData } from '@/types';
import { useTheme } from 'next-themes';

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  ascendantSign: number;
  planets: PlanetData[];
}

const SIGN_NAMES = ['','Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];

const GRID = [
  [12,1,2,3],
  [11,null,null,4],
  [10,null,null,5],
  [9,8,7,6],
];

function getHouse(sign:number, asc:number){
  return ((sign - asc + 12)%12)+1;
}

export default function SouthIndianChart({activeYearHouse,activeMonthHouse,ascendantSign,planets}:Props){
  const {resolvedTheme}=useTheme();
  const isDark = resolvedTheme==='dark';

  const bySign:Record<number,PlanetData[]>={};
  planets.forEach(p=>{
    if(!bySign[p.sign]) bySign[p.sign]=[];
    bySign[p.sign].push(p);
  });

  return (
    <div className="grid grid-cols-4 gap-1 max-w-[500px] mx-auto">
      {GRID.flat().map((sign,idx)=>{
        if(!sign) return <div key={idx}/>;
        const house = getHouse(sign,ascendantSign);
        const isYear = house===activeYearHouse;
        const isMonth= house===activeMonthHouse;
        const bg = isYear&&isMonth ? 'bg-purple-200 dark:bg-purple-900/30'
                 : isYear ? 'bg-cyan-200 dark:bg-cyan-900/30'
                 : isMonth? 'bg-green-200 dark:bg-green-900/30'
                 : 'bg-white dark:bg-zinc-900';

        return (
          <div key={idx} className={`border border-zinc-300 dark:border-zinc-700 p-2 text-xs font-mono ${bg}`}>
            <div className="text-[10px] opacity-60">{SIGN_NAMES[sign]}</div>
            {sign===ascendantSign && <div className="text-[10px] text-emerald-500">ASC</div>}
            <div className="space-y-0.5">
              {(bySign[sign]||[]).map(p=>(
                <div key={p.name}>{p.name.slice(0,2)}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
