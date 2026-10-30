// Cheṣṭā Bala of Mars, Mercury, Jupiter, Venus and Saturn from the cheṣṭā-kendra (BPHS 27.24–25).
//
// The verses give the method: the kendra is the śīghrocca (the apogee of the planet's quick motion)
// less the mean of the planet's mean and true longitudes; when it is over six signs it is taken from the
// circle; the degrees divided by three are the strength. They do not give mean longitudes, which every
// reader has had to take from astronomy tables. This module uses B. V. Raman's (Graha and Bhava Balas,
// articles 87–107), who took them from Kedarnath Dutt's Book of Fate: positions of the mean Sun, Mars,
// Jupiter and Saturn and of the śīghrocca of Mercury and Venus at the Ujjain midnight that begins
// 1 January 1900, their daily motions, and a small yearly correction for Mercury, Jupiter, Venus and
// Saturn. The positions are in the zodiac of Lahiri's ayanamsa (the mean Sun at the epoch is 257°27',
// the tropical one less the Lahiri ayanamsa of 1900).
//
// The motions are the ones the 6000-day rows of Raman's tables give.
//
// The other table is the Sūrya Siddhānta's own: the revolutions of a kalpa and the Kali-yuga midnight at
// Ujjain, when every mean graha stood at the beginning of Aries, with none of Dutt's corrections. The two
// agree for Mars to the hundredth of a virūpa and differ for the others by up to 2.2 virūpa (Mercury), 1.7
// (Venus), 0.7 (Jupiter) and 0.5 (Saturn) in the charts checked (docs/shadbala-sources.md). It is a choice
// of the Bala views (C13).

import type { CheshtaMeans } from './balaOptions';

export type CheshtaGraha = 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

/** The civil days of a kalpa in the Sūrya Siddhānta, and the revolutions of each graha in it (the śīghrocca of Mercury and Venus). */
const KALPA_DAYS = 1_577_917_828_000;
const KALPA_REVOLUTIONS: Record<'Sun' | CheshtaGraha, number> = {
  Sun: 4_320_000_000,
  Mars: 2_296_832_000,
  Mercury: 17_937_060_000,
  Jupiter: 364_220_000,
  Venus: 7_022_376_000,
  Saturn: 146_568_000,
};
/** The Julian day of the midnight that begins the Kali Yuga (18 February 3102 BCE, Julian), at Ujjain. */
const KALI_YUGA_JD = 588_465.5;
const UJJAIN_LONGITUDE = 76;

/** The Julian day of 1 January 1900, 0h at 76°E (Ujjain mean midnight), in UT. */
const EPOCH_JD = 2415020.5 - 76 / 360;

/** Mean Sun at the epoch (degrees) and its mean daily motion. */
const SUN = { epoch: 257.4568, motion: 0.98560265 };

type MeanElements = {
  epoch: number;
  motion: number;
  /** The correction added to the position, as a + b·t with t the years since 1900 (zero for the Sun and Mars). */
  correction: (yearsSince1900: number) => number;
};

/** The mean longitude of the planet, or for Mercury and Venus their śīghrocca. */
const ELEMENTS: Record<CheshtaGraha, MeanElements> = {
  Mars: { epoch: 270.22, motion: 0.52402, correction: () => 0 },
  Mercury: { epoch: 164, motion: 4.09232, correction: (t) => 6.67 - 0.00133 * t },
  Jupiter: { epoch: 220.04, motion: 0.0830967, correction: (t) => -(3.33 + 0.0067 * t) },
  Venus: { epoch: 328.51, motion: 1.602147, correction: (t) => -(5 + 0.001 * t) },
  Saturn: { epoch: 236.74, motion: 0.03344, correction: (t) => 5 + 0.001 * t },
};

const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;
/** The signed difference of two longitudes, -180 to 180. */
const difference = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

function yearOf(julianDay: number): number {
  return new Date((julianDay - 2440587.5) * 86_400_000).getUTCFullYear();
}

/** The mean Sun and the planet's mean longitude (śīghrocca for Mercury and Venus), in the Lahiri zodiac. */
export function meanLongitudes(planet: CheshtaGraha, julianDay: number, means: CheshtaMeans = 'raman'): { sun: number; planet: number } {
  if (means === 'surya-siddhanta') {
    const days = julianDay + UJJAIN_LONGITUDE / 360 - KALI_YUGA_JD;
    const revolutions = (graha: 'Sun' | CheshtaGraha) => normalize(((KALPA_REVOLUTIONS[graha] / KALPA_DAYS) * days % 1) * 360);
    return { sun: revolutions('Sun'), planet: revolutions(planet) };
  }
  const days = julianDay - EPOCH_JD;
  const years = yearOf(julianDay) - 1900;
  const element = ELEMENTS[planet];
  return {
    sun: normalize(SUN.epoch + SUN.motion * days),
    planet: normalize(element.epoch + element.motion * days + element.correction(years)),
  };
}

/**
 * The reduced cheṣṭā-kendra, 0 to 180°, of a planet. `trueLongitude` is the planet's apparent
 * longitude in the Lahiri zodiac, which is the one the mean positions are in.
 */
export function cheshtaKendra(planet: CheshtaGraha, julianDay: number, trueLongitude: number, means: CheshtaMeans = 'raman'): number {
  const { sun, planet: planetMean } = meanLongitudes(planet, julianDay, means);
  // Mars, Jupiter and Saturn: the mean Sun is the śīghrocca and the planet's own mean is the mean.
  // Mercury and Venus: the mean is the mean Sun and the śīghrocca is the planet's own.
  const inferior = planet === 'Mercury' || planet === 'Venus';
  const sighrocca = inferior ? planetMean : sun;
  const mean = inferior ? sun : planetMean;
  const average = normalize(mean + difference(trueLongitude, mean) / 2);
  const kendra = normalize(sighrocca - average);
  return kendra > 180 ? 360 - kendra : kendra;
}

/** Cheṣṭā Bala in virūpa: the reduced kendra divided by three, 60 at 180° and 0 at 0°. */
export function cheshtaKendraBalaVirupa(planet: CheshtaGraha, julianDay: number, trueLongitude: number, means: CheshtaMeans = 'raman'): number {
  return cheshtaKendra(planet, julianDay, trueLongitude, means) / 3;
}
