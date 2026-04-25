import { BcpResult, PlanetData } from '@/types';
import BcpSummary from './BcpSummary';
import HouseAnalysisDisplay from './HouseAnalysisDisplay';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascSign: number;
}

export default function DashaPanel({ bcp, planets, ascSign }: Props) {
  return (
    <div className="space-y-4">
      <HouseAnalysisDisplay
        yearHouse={bcp.activeYearHouse}
        monthHouse={bcp.activeMonthHouse}
        planets={planets.map((p) => ({
          name: p.name,
          sign: p.sign,
          degree: p.degree,
          house: p.house,
        }))}
        ascSign={ascSign}
      />
      <BcpSummary bcp={bcp} planets={planets} ascSign={ascSign} />
    </div>
  );
}
