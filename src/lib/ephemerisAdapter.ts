import { ayanamsaModeNumber, type AyanamsaMode } from './ayanamsas';

interface SweInstance {
  initSwissEph(): Promise<void>;
  set_sid_mode(mode: number, t0: number, ayan_t0: number): void;
  julday(year: number, month: number, day: number, hour: number): number;
  get_ayanamsa_ut(jd: number): number;
  calc_ut(jd: number, planet: number, flags: number): Float64Array;
  houses(jd: number, lat: number, lng: number, hsys: string): { ascmc: Record<number, number> };
  /** Greenwich mean sidereal time in hours. */
  sidtime(jd: number): number;
  readonly SE_SIDM_LAHIRI: number;
}

// swe_calc_ut flag combinations. SEFLG_SWIEPH(2) selects the Swiss ephemeris,
// SEFLG_SPEED(256) populates the speed slots, SEFLG_EQUATORIAL(2048) switches
// the output from ecliptic longitude/latitude to right ascension/declination.
const FLAGS_ECLIPTIC = 2 | 256;
const FLAGS_EQUATORIAL = 2 | 256 | 2048;

let _swe: SweInstance | null = null;
let _initPromise: Promise<void> | null = null;
let _sidMode = 1;
let _ayanamsaQueue: Promise<void> = Promise.resolve();

async function getSwe(): Promise<SweInstance> {
  if (_swe) return _swe;
  if (!_initPromise) {
    _initPromise = (async () => {
      const mod = (await import('swisseph-wasm')) as unknown as { default: new () => SweInstance };
      const instance = new mod.default();
      await instance.initSwissEph();
      instance.set_sid_mode(instance.SE_SIDM_LAHIRI, 0, 0);
      _swe = instance;
    })();
  }
  await _initPromise;
  return _swe!;
}

export const SE_SUN       = 0;
export const SE_MOON      = 1;
export const SE_MERCURY   = 2;
export const SE_VENUS     = 3;
export const SE_MARS      = 4;
export const SE_JUPITER   = 5;
export const SE_SATURN    = 6;
export const SE_URANUS    = 7;
export const SE_NEPTUNE   = 8;
export const SE_PLUTO     = 9;
export const SE_MEAN_NODE = 10;
export const SE_TRUE_NODE = 11;

async function setSiderealMode(mode: number): Promise<void> {
  const swe = await getSwe();
  if (_sidMode !== mode) {
    swe.set_sid_mode(mode, 0, 0);
    _sidMode = mode;
  }
}

export async function sweJulday(year: number, month: number, day: number, hour: number): Promise<number> {
  return (await getSwe()).julday(year, month, day, hour);
}

export function sweGetAyanamsa(jd: number, ayanamsa: AyanamsaMode = 'lahiri'): Promise<number> {
  if (ayanamsa === 'tropical') return Promise.resolve(0);
  const task = _ayanamsaQueue.then(async () => {
    await setSiderealMode(ayanamsaModeNumber(ayanamsa) ?? 1);
    return (await getSwe()).get_ayanamsa_ut(jd);
  });
  _ayanamsaQueue = task.then(() => undefined, () => undefined);
  return task;
}

export async function sweCalcUt(jd: number, planetId: number): Promise<{ longitude: number; speed: number }> {
  const r = (await getSwe()).calc_ut(jd, planetId, FLAGS_ECLIPTIC);
  return { longitude: r[0], speed: r[3] };
}

/** Right ascension and declination in degrees. */
export async function sweCalcUtEquatorial(jd: number, planetId: number): Promise<{ rightAscension: number; declination: number }> {
  const r = (await getSwe()).calc_ut(jd, planetId, FLAGS_EQUATORIAL);
  return { rightAscension: r[0], declination: r[1] };
}

export async function sweSidtime(jd: number): Promise<number> {
  return (await getSwe()).sidtime(jd);
}

export async function sweGetAscendant(jd: number, lat: number, lng: number): Promise<number> {
  return (await getSwe()).houses(jd, lat, lng, 'W').ascmc[0];
}