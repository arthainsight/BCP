'use client';

import type { ChartData } from '@/types';
import type { AshtakavargaSystem } from '@/lib/ashtakavarga';
import { KEY_HOUSE, buildPhala, nakshatraName, type SignClass } from '@/lib/ashtakavargaPhala';
import { SIGN_ABBR } from '@/lib/signs';
import { useT } from '@/lib/i18n';

// What the Aṣṭakavarga numbers say by BPHS 70 and 72 (see ashtakavargaPhala.ts for the rules, and what was taken where the verses are open).

const CELL = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5';
const HEAD = `${CELL} font-semibold text-zinc-500 dark:text-zinc-400`;
const KIND_CLASS: Record<SignClass['kind'], string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  middle: 'text-zinc-700 dark:text-zinc-200',
  poor: 'text-red-600 dark:text-red-400',
};

const signs = (list: number[]) => (list.length > 0 ? list.map(sign => SIGN_ABBR[sign]).join(', ') : '—');

export function PhalaView({ chart, system }: { chart: ChartData; system: AshtakavargaSystem }) {
  const t = useT();
  const phala = buildPhala(chart, system);
  const kindLabel = (kind: SignClass['kind']) => (kind === 'good' ? t('good') : kind === 'middle' ? t('middle') : t('poor'));
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t('What each Aṣṭakavarga is for, and the point of Saturn')}</h4>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          {t('The Śodhya Piṇḍa of a graha times the bindus of its own Bhinnāṣṭakavarga in the house the verse names, divided by 27 (the nakṣatra) and by 12 (the sign), counting a remainder of nought as the divisor. When Saturn goes through that nakṣatra or sign, or the trine of it, the thing the graha stands for is troubled. BPHS 70.5–10 and 70.22–42.')}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-center font-mono text-xs" data-phala-saturn>
            <thead>
              <tr>
                <th scope="col" className={`text-left ${HEAD}`}>{t('Graha')}</th>
                <th scope="col" className={`text-left ${HEAD}`}>{t('Stands for')}</th>
                <th scope="col" className={HEAD}>{t('House')}</th>
                <th scope="col" className={HEAD}>{t('Bindus')}</th>
                <th scope="col" className={HEAD}>{t('Piṇḍa')}</th>
                <th scope="col" className={HEAD}>{t('Product')}</th>
                <th scope="col" className={`text-left ${HEAD}`}>{t('Nakṣatra (÷ 27)')}</th>
                <th scope="col" className={`text-left ${HEAD}`}>{t('Sign (÷ 12)')}</th>
              </tr>
            </thead>
            <tbody>
              {phala.saturn.map(point => (
                <tr key={point.planet} className="text-zinc-700 dark:text-zinc-200">
                  <th scope="row" className={`text-left font-semibold ${CELL}`} title={point.verse}>{point.planet}</th>
                  <td className={`text-left ${CELL}`}>{t(point.signification)}</td>
                  <td className={`${CELL} tabular-nums`}>{KEY_HOUSE[point.planet].house}th · {SIGN_ABBR[point.houseSign]}</td>
                  <td className={`${CELL} tabular-nums`}>{point.bindus}</td>
                  <td className={`${CELL} tabular-nums`}>{point.sodhyaPinda}</td>
                  <td className={`${CELL} tabular-nums`}>{point.product}</td>
                  <td className={`text-left ${CELL}`}>
                    {point.nakshatra === null ? '—' : <><span className="font-semibold">{nakshatraName(point.nakshatra)}</span> <span className="text-zinc-400">· {point.nakshatraTrine.slice(1).map(nakshatraName).join(', ')}</span></>}
                  </td>
                  <td className={`text-left ${CELL}`}>
                    {point.sign === null ? '—' : <><span className="font-semibold">{SIGN_ABBR[point.sign]}</span> <span className="text-zinc-400">· {point.signTrine.slice(1).map(sign => SIGN_ABBR[sign]).join(', ')}</span></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 space-y-0.5">
          {phala.saturn.map(point => <li key={point.planet}>{point.planet}: {t('trouble to')} {t(point.troubles)} ({point.verse})</li>)}
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t('The Sun and the Moon: signs for and against auspicious acts')}</h4>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('No bindu in the Sun’s or the Moon’s Aṣṭakavarga: no auspicious act (a wedding, an initiation) while the Sun or the Moon goes through the sign. The signs with the most bindus favour it even when the Sun or Jupiter is not well placed. BPHS 70.19–21.')}</p>
        <table className="w-full min-w-[420px] border-collapse text-center font-mono text-xs" data-phala-months>
          <thead><tr><th scope="col" className={`text-left ${HEAD}`} /><th scope="col" className={HEAD}>{t('No bindu')}</th><th scope="col" className={HEAD}>{t('Most bindus')}</th></tr></thead>
          <tbody>
            <tr><th scope="row" className={`text-left font-semibold ${CELL}`}>{t('Sun')}</th><td className={`${CELL} text-red-600 dark:text-red-400`}>{signs(phala.sunEmpty)}</td><td className={`${CELL} text-emerald-600 dark:text-emerald-400`}>{signs(phala.sunRichest)}</td></tr>
            <tr><th scope="row" className={`text-left font-semibold ${CELL}`}>{t('Moon')}</th><td className={`${CELL} text-red-600 dark:text-red-400`}>{signs(phala.moonEmpty)}</td><td className={`${CELL} text-emerald-600 dark:text-emerald-400`}>{signs(phala.moonRichest)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t('The Sarvāṣṭakavarga by house')}</h4>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('A sign with more than thirty bindus gives good, from twenty-five to thirty middling, fewer bad; a Lagna with the more is of enjoyment and wealth, with the fewer of want. BPHS 72.3–8.')}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-center font-mono text-xs" data-phala-houses>
            <thead>
              <tr>
                <th scope="col" className={`text-left ${HEAD}`}>{t('House')}</th>
                {phala.houses.map(item => <th scope="col" key={item.house} className={HEAD}>{item.house}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row" className={`text-left font-semibold ${CELL}`}>{t('Sign')}</th>{phala.houses.map(item => <td key={item.house} className={CELL}>{SIGN_ABBR[item.sign]}</td>)}</tr>
              <tr><th scope="row" className={`text-left font-semibold ${CELL}`}>SAV</th>{phala.houses.map(item => <td key={item.house} className={`${CELL} font-bold tabular-nums ${KIND_CLASS[item.kind]}`}>{item.bindus}</td>)}</tr>
              <tr><th scope="row" className={`text-left font-semibold ${CELL}`}>{t('Reads')}</th>{phala.houses.map(item => <td key={item.house} className={`${CELL} ${KIND_CLASS[item.kind]}`}>{kindLabel(item.kind)}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          {t('The Lagna has')} {phala.lagna.bindus} {t('bindus')}: {phala.lagna.enjoyment ? t('of enjoyment and wealth (more than thirty).') : phala.lagna.kind === 'poor' ? t('of want (fewer than twenty-five).') : t('middling.')}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-center font-mono text-xs" data-phala-khandas>
            <thead>
              <tr>
                <th scope="col" className={`text-left ${HEAD}`}>{t('Part of the houses')}</th>
                <th scope="col" className={HEAD}>{t('Houses')}</th>
                <th scope="col" className={HEAD}>{t('Bindus')}</th>
                <th scope="col" className={`text-left ${HEAD}`}>{t('Malefics in it')}</th>
              </tr>
            </thead>
            <tbody>
              {phala.khandas.map(item => (
                <tr key={item.stage} className="text-zinc-700 dark:text-zinc-200">
                  <th scope="row" className={`text-left font-semibold ${CELL}`}>{t(item.stage)}</th>
                  <td className={`${CELL} tabular-nums`}>{item.houses[0]}–{item.houses[1]}</td>
                  <td className={`${CELL} tabular-nums`}>{item.bindus}</td>
                  <td className={`text-left ${CELL} ${item.malefics.length > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{item.malefics.length > 0 ? item.malefics.join(', ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('The verse divides the twelve houses in three parts (BPHS 72.9–10): a malefic in a part troubles that stage of life, childhood, adulthood and old age in turn. Here the parts are of four houses each, and the malefics are the Sun, Mars, Saturn, Rahu and Ketu.')}</p>
      </section>

      <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
        {t('Where the verses are short the choices are named in the source document: the bindus are those of the graha’s own Bhinnāṣṭakavarga before the reductions, and the trine of a nakṣatra is the ones nine and eighteen on. This is not checked against another program. The length of life of BPHS 71 and the months of 72.11–29 with their dangers and the gifts to be given are not calculated: the counts of the verses are not clear enough.')}
      </p>
    </div>
  );
}
