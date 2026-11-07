'use client';

import { useState } from 'react';
import type { ChartData } from '@/types';
import type { AshtakavargaPlanet, AshtakavargaSystem } from '@/lib/ashtakavarga';
import {
  AV_PLANETS, GRAHA_MULTIPLIERS, KAKSHYA_LORDS, RASI_MULTIPLIERS_BPHS, SHODHANA_RULES, buildPrastara, buildShodhana, kakshyaOf, type ShodhanaRulesName,
} from '@/lib/ashtakavargaShodhana';
import { SIGN_ABBR } from '@/lib/signs';
import { useT } from '@/lib/i18n';

// The Prastāra, the Śodhana with the Piṇḍas, and the Kakṣyā of the Aṣṭakavarga (BPHS 67–69; see ashtakavargaShodhana.ts).

const CELL = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5';
const HEAD = `${CELL} font-semibold text-zinc-500 dark:text-zinc-400`;
const SELECT = 'rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs normal-case tracking-normal text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200';
const ABBR: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Ascendant: 'As' };

function GrahaSelect({ value, onChange }: { value: AshtakavargaPlanet; onChange: (planet: AshtakavargaPlanet) => void }) {
  const t = useT();
  return (
    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
      {t('Graha')}
      <select value={value} onChange={event => onChange(event.target.value as AshtakavargaPlanet)} className={`ml-2 ${SELECT}`}>
        {AV_PLANETS.map(planet => <option key={planet} value={planet}>{planet}</option>)}
      </select>
    </label>
  );
}

export function PrastaraView({ chart, system }: { chart: ChartData; system: AshtakavargaSystem }) {
  const t = useT();
  const [planet, setPlanet] = useState<AshtakavargaPlanet>('Sun');
  const table = buildPrastara(chart, system)[planet];
  return (
    <div className="space-y-3">
      <GrahaSelect value={planet} onChange={setPlanet} />
      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('The Prastāra of a graha: which of the eight (the seven grahas and the Lagna) give it a bindu in each sign. Its columns add up to the Bhinnāṣṭakavarga.')}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-center font-mono text-xs" data-prastara>
          <thead>
            <tr>
              <th scope="col" className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 text-left ${HEAD}`}>{t('From')}</th>
              {SIGN_ABBR.map(sign => <th scope="col" key={sign} className={HEAD}>{sign}</th>)}
              <th scope="col" className={HEAD}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map(row => (
              <tr key={row.contributor} className="text-zinc-700 dark:text-zinc-200">
                <th scope="row" title={row.contributor} className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 text-left font-semibold ${CELL}`}>{ABBR[row.contributor]} <span className="font-normal text-zinc-400">{SIGN_ABBR[row.sign]}</span></th>
                {row.bindu.map((held, sign) => <td key={SIGN_ABBR[sign]} className={`${CELL} ${held ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-zinc-300 dark:text-zinc-700'}`}>{held ? '•' : '·'}</td>)}
                <td className={`${CELL} tabular-nums`}>{row.bindu.filter(Boolean).length}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 text-left font-bold ${CELL}`}>BAV</th>
              {table.totals.map((value, sign) => <td key={SIGN_ABBR[sign]} className={`${CELL} font-bold tabular-nums`}>{value}</td>)}
              <td className={`${CELL} font-bold tabular-nums`}>{table.totals.reduce((sum, value) => sum + value, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ShodhanaView({ chart, system }: { chart: ChartData; system: AshtakavargaSystem }) {
  const t = useT();
  const [planet, setPlanet] = useState<AshtakavargaPlanet>('Mars');
  const [rulesName, setRulesName] = useState<ShodhanaRulesName>('bphs');
  const result = buildShodhana(chart, system, SHODHANA_RULES[rulesName]);
  const steps: [string, number[]][] = [
    [t('Bhinnāṣṭakavarga'), result.original[planet]],
    [t('after Trikoṇa Śodhana'), result.afterTrikona[planet]],
    [t('Śodhita (after Ekādhipatya)'), result.sodhita[planet]],
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <GrahaSelect value={planet} onChange={setPlanet} />
        <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {t('Rules')}
          <select value={rulesName} onChange={event => setRulesName(event.target.value as ShodhanaRulesName)} className={`ml-2 ${SELECT}`}>
            <option value="bphs">{t('BPHS 67–69 (the verses)')}</option>
            <option value="pyjhora">PyJHora</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-center font-mono text-xs" data-shodhana>
          <thead>
            <tr>
              <th scope="col" className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 text-left ${HEAD}`}>{planet}</th>
              {SIGN_ABBR.map((sign, index) => <th scope="col" key={sign} className={`${HEAD} ${result.occupied[index] ? 'text-emerald-700 dark:text-emerald-400' : ''}`} title={result.occupied[index] ? t('holds a graha') : t('empty')}>{sign}{result.occupied[index] ? '*' : ''}</th>)}
              <th scope="col" className={HEAD}>Σ</th>
            </tr>
          </thead>
          <tbody>
            {steps.map(([label, values]) => (
              <tr key={label} className="text-zinc-700 dark:text-zinc-200">
                <th scope="row" className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 text-left font-semibold ${CELL}`}>{label}</th>
                {values.map((value, sign) => <td key={SIGN_ABBR[sign]} className={`${CELL} tabular-nums`}>{value}</td>)}
                <td className={`${CELL} font-semibold tabular-nums`}>{values.reduce((sum, value) => sum + value, 0)}</td>
              </tr>
            ))}
            <tr className="text-zinc-400 dark:text-zinc-500">
              <th scope="row" className={`sticky left-0 z-10 bg-white dark:bg-zinc-900 text-left ${CELL}`}>{t('number of the sign')}</th>
              {SHODHANA_RULES[rulesName].rasiMultipliers.map((value, sign) => <td key={SIGN_ABBR[sign]} className={`${CELL} tabular-nums`}>{value}</td>)}
              <td className={CELL} />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('* a sign that holds a graha (Rahu and Ketu included). The Ekādhipatya Śodhana is for the grahas that own two signs: Mars, Mercury, Jupiter, Venus and Saturn.')}</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-center font-mono text-xs" data-pinda>
          <thead>
            <tr>
              <th scope="col" className={`text-left ${HEAD}`}>{t('Piṇḍa')}</th>
              {AV_PLANETS.map(graha => <th scope="col" key={graha} className={HEAD} title={`${graha} · ${t('number of the graha')} ${GRAHA_MULTIPLIERS[graha]}`}>{ABBR[graha]}</th>)}
            </tr>
          </thead>
          <tbody>
            {([[t('Rāśi Piṇḍa'), result.rasiPinda], [t('Graha Piṇḍa'), result.grahaPinda], [t('Śodhya Piṇḍa'), result.sodhyaPinda]] as const).map(([label, values], index) => (
              <tr key={label} className={`text-zinc-700 dark:text-zinc-200 ${index === 2 ? 'font-bold' : ''}`}>
                <th scope="row" className={`text-left font-semibold ${CELL}`}>{label}</th>
                {AV_PLANETS.map(graha => <td key={graha} className={`${CELL} tabular-nums`}>{values[graha]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
        {t('Rāśi Piṇḍa: what is left in each sign times the number of the sign (Aries 7 … Pisces 12). Graha Piṇḍa: what is left in the sign of each graha times the number of that graha (Jupiter 10, Mars 8, Venus 7, the others 5). BPHS 69.')}
        {rulesName === 'pyjhora' && ` ${t('PyJHora differs from the verses in the number of Virgo (6 for 5), in a sign with a graha against an empty one of the same value, and in counting the Lagna as a graha.')}`}
        {rulesName === 'bphs' && ` ${t('The numbers of the signs:')} ${RASI_MULTIPLIERS_BPHS.map((value, sign) => `${SIGN_ABBR[sign]} ${value}`).join(', ')}.`}
      </p>
    </div>
  );
}

export function KakshyaView({ chart, system }: { chart: ChartData; system: AshtakavargaSystem }) {
  const t = useT();
  const prastara = buildPrastara(chart, system);
  const rows = AV_PLANETS.flatMap(planet => {
    const body = chart.planets.find(item => item.name === planet);
    if (!body) return [];
    const kakshya = kakshyaOf(body.longitude);
    const gives = prastara[planet].rows.find(row => row.contributor === kakshya.lord)?.bindu[kakshya.sign] ?? false;
    return [{ planet, body, kakshya, gives }];
  });
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
        {t('Kakṣyā: a sign in eight parts of 3°45′, ruled in turn by Saturn, Jupiter, Mars, the Sun, Venus, Mercury, the Moon and the Lagna. A graha in a kakṣyā does well when the lord of it gives a bindu to that graha in that sign. Not in BPHS 66–69, and not checked against another program.')}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-center font-mono text-xs" data-kakshya>
          <thead>
            <tr>
              <th scope="col" className={`text-left ${HEAD}`}>{t('Graha')}</th>
              <th scope="col" className={HEAD}>{t('Position')}</th>
              <th scope="col" className={HEAD}>{t('Kakṣyā')}</th>
              <th scope="col" className={HEAD}>{t('Lord')}</th>
              <th scope="col" className={HEAD}>{t('Runs')}</th>
              <th scope="col" className={HEAD}>{t('Bindu from the lord')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ planet, body, kakshya, gives }) => (
              <tr key={planet} className="text-zinc-700 dark:text-zinc-200">
                <th scope="row" className={`text-left font-semibold ${CELL}`}>{planet}</th>
                <td className={`${CELL} tabular-nums`}>{SIGN_ABBR[kakshya.sign]} {(body.longitude % 30).toFixed(2)}°</td>
                <td className={`${CELL} tabular-nums`}>{kakshya.index + 1}</td>
                <td className={CELL}>{kakshya.lord === 'Ascendant' ? t('Lagna') : kakshya.lord}</td>
                <td className={`${CELL} tabular-nums`}>{kakshya.from.toFixed(2)}°–{kakshya.to.toFixed(2)}°</td>
                <td className={`${CELL} font-bold ${gives ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{gives ? t('yes') : t('no')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('The order of the lords:')} {KAKSHYA_LORDS.join(', ')}.</p>
    </div>
  );
}
