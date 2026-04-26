interface SweInstance {
  initSwissEph(): Promise<void>;
  set_sid_mode(mode: number, t0: number, ayan_t0: number): void;
  julday(year: number, month: number, day: number, hour: number): number;
  get_ayanamsa_ut(jd: number): number;
  calc_ut(jd: number, planet: number, flags: number): Float64Array;
  houses(jd: number, lat: number, lng: number, hsys: string): { ascmc: Record<number, number> };
  readonly SE_SIDM_LAHIRI: number;
}

let _swe: SweInstance | null = null;
let _initPromise: Promise<void> | null = null;

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
export const SE_MEAN_NODE = 10;

export async function sweJulday(year: number, month: number, day: number, hour: number): Promise<number> {
  return (await getSwe()).julday(year, month, day, hour);
}

export async function sweGetAyanamsa(jd: number): Promise<number> {
  return (await getSwe()).get_ayanamsa_ut(jd);
}

export async function sweCalcUt(jd: number, planetId: number): Promise<number> {
  return (await getSwe()).calc_ut(jd, planetId, 2)[0]; // 2=SEFLG_SWIEPH; [0]=longitude
}

export async function sweGetAscendant(jd: number, lat: number, lng: number): Promise<number> {
  return (await getSwe()).houses(jd, lat, lng, 'W').ascmc[0];
}
