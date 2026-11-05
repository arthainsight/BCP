import type { ChartData } from '@/types';
import { SIGN_LORDS, SIGN_NAMES } from '@/lib/signs';
import { BHRIGU_PADA_CYCLES, type BhriguPadaVersion } from './bhriguPadaProgression';
import { calculateBhriguPadas } from './bhriguPadaProgression';

export type FinancialActivationRole = '2L' | '11L' | 'A2L' | 'A11L';
export type BhriguIncomeTarget = '2nd house' | '11th house' | 'A2' | 'A11';

export interface BhriguIncomePeriod {
  body: string;
  roles: FinancialActivationRole[];
  mdSign: number;
  mdHouse: number;
  adSign: number;
  adHouse: number;
  pdSign: number;
  pdHouse: number;
  pdNumber: number;
  startAge: number;
  endAge: number;
  startDate: Date;
  endDate: Date;
  adTargets: BhriguIncomeTarget[];
  pdTargets: BhriguIncomeTarget[];
  adIn11th: boolean;
  pdIn11th: boolean;
  priority: number;
}

function wrapSign(sign: number): number {
  return ((sign - 1) % 12 + 12) % 12 + 1;
}

function houseFromLagna(ascendantSign: number, sign: number): number {
  return ((sign - ascendantSign + 12) % 12) + 1;
}

function ageDate(birthDate: Date, age: number): Date {
  return new Date(birthDate.getTime() + age * 365.2425 * 86400000);
}

const TARGET_LABELS: readonly BhriguIncomeTarget[] = ['2nd house', '11th house', 'A2', 'A11'];

/**
 * Enumerates Bhṛgu Pada PD intervals for the four natal financial lords.
 * MD is the graha's fixed natal sign; AD advances by one sign per cycle/12;
 * PD advances by one sign per cycle/144, restarting from the current AD sign.
 * Only AD–PD periods that activate one of the four financial target signs
 * are returned. Entry into the 11th house is ranked above other activations.
 */
export function calculateBhriguIncomePeriods(
  chart: ChartData,
  birthDate: Date,
  maxAge: number,
  version: BhriguPadaVersion = 'nadi-praveshika-8',
): BhriguIncomePeriod[] {
  if (!Number.isFinite(maxAge) || maxAge <= 0 || Number.isNaN(birthDate.getTime())) return [];

  const asc = chart.ascendant.sign;
  const house2Sign = wrapSign(asc + 1);
  const house11Sign = wrapSign(asc + 10);
  const padas = calculateBhriguPadas(chart, version);
  const a2 = padas.find(pada => pada.house === 2);
  const a11 = padas.find(pada => pada.house === 11);
  const targets: { label: BhriguIncomeTarget; sign: number }[] = [
    { label: '2nd house', sign: house2Sign },
    { label: '11th house', sign: house11Sign },
    ...(a2 ? [{ label: 'A2' as const, sign: a2.sign }] : []),
    ...(a11 ? [{ label: 'A11' as const, sign: a11.sign }] : []),
  ];

  const roleMap = new Map<string, FinancialActivationRole[]>();
  const addRole = (body: string, role: FinancialActivationRole) => {
    roleMap.set(body, [...(roleMap.get(body) ?? []), role]);
  };
  addRole(SIGN_LORDS[house2Sign - 1], '2L');
  addRole(SIGN_LORDS[house11Sign - 1], '11L');
  if (a2) addRole(SIGN_LORDS[a2.sign - 1], 'A2L');
  if (a11) addRole(SIGN_LORDS[a11.sign - 1], 'A11L');

  const periods: BhriguIncomePeriod[] = [];
  for (const [body, roles] of roleMap) {
    const natal = chart.planets.find(planet => planet.name === body);
    const cycleYears = BHRIGU_PADA_CYCLES[version][body];
    if (!natal || !cycleYears) continue;

    const pdDuration = cycleYears / 144;
    const pdCount = Math.ceil(maxAge / pdDuration);
    for (let pdIndex = 0; pdIndex < pdCount; pdIndex += 1) {
      const startAge = pdIndex * pdDuration;
      const endAge = Math.min((pdIndex + 1) * pdDuration, maxAge);
      if (startAge >= maxAge) break;

      const adIndex = Math.floor(pdIndex / 12);
      const pdNumber = (pdIndex % 12) + 1;
      const adSign = wrapSign(natal.sign + adIndex);
      const pdSign = wrapSign(adSign + pdNumber - 1);
      const adTargets = targets.filter(target => target.sign === adSign).map(target => target.label);
      const pdTargets = targets.filter(target => target.sign === pdSign).map(target => target.label);
      const adHouse = houseFromLagna(asc, adSign);
      const pdHouse = houseFromLagna(asc, pdSign);
      const adIn11th = adHouse === 11;
      const pdIn11th = pdHouse === 11;

      if (adTargets.length === 0 && pdTargets.length === 0) continue;

      // The user's primary signal: one of the four financial lords progresses
      // into the 11th house. AD entry outranks PD entry; other target hits follow.
      const priority = adIn11th ? 4 : pdIn11th ? 3 : adTargets.length ? 2 : 1;
      periods.push({
        body,
        roles,
        mdSign: natal.sign,
        mdHouse: houseFromLagna(asc, natal.sign),
        adSign,
        adHouse,
        pdSign,
        pdHouse,
        pdNumber,
        startAge,
        endAge,
        startDate: ageDate(birthDate, startAge),
        endDate: ageDate(birthDate, endAge),
        adTargets,
        pdTargets,
        adIn11th,
        pdIn11th,
        priority,
      });
    }
  }

  return periods.sort((a, b) =>
    b.priority - a.priority ||
    a.startDate.getTime() - b.startDate.getTime() ||
    a.body.localeCompare(b.body),
  );
}

export function financialTargetSignLabels(chart: ChartData, version: BhriguPadaVersion = 'nadi-praveshika-8') {
  const asc = chart.ascendant.sign;
  const padas = calculateBhriguPadas(chart, version);
  const a2 = padas.find(pada => pada.house === 2);
  const a11 = padas.find(pada => pada.house === 11);
  return [
    { label: '2. huone', sign: wrapSign(asc + 1), lord: SIGN_LORDS[wrapSign(asc + 1) - 1] },
    { label: '11. huone', sign: wrapSign(asc + 10), lord: SIGN_LORDS[wrapSign(asc + 10) - 1] },
    { label: 'A2', sign: a2?.sign ?? null, lord: a2 ? SIGN_LORDS[a2.sign - 1] : null },
    { label: 'A11', sign: a11?.sign ?? null, lord: a11 ? SIGN_LORDS[a11.sign - 1] : null },
  ].map(item => ({ ...item, signName: item.sign ? SIGN_NAMES[item.sign - 1] : '—' }));
}

export const FINANCIAL_ROLE_LABELS: Record<FinancialActivationRole, string> = {
  '2L': '2. huoneen hallitsija',
  '11L': '11. huoneen hallitsija',
  'A2L': 'A2:n hallitsija',
  'A11L': 'A11:n hallitsija',
};

export const FINANCIAL_TARGET_LABELS: Record<BhriguIncomeTarget, string> = {
  '2nd house': '2. huone',
  '11th house': '11. huone',
  A2: 'A2',
  A11: 'A11',
};

export const FINANCIAL_TARGET_ORDER = TARGET_LABELS;
