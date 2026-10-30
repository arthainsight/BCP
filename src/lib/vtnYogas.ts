// The combinations of Vāra, Tithi and Nakṣatra (Ernst Wilhelm, Classical Muhurta, chapter 9), written from the text of the
// book. Each combination is a yoga of one of the kinds the book weighs: Vāra/Tithi (VT), Tithi/Nakṣatra (TN), Vāra/Nakṣatra
// (VN) and Vāra/Tithi/Nakṣatra (VTN). "Vara/Nakshatra Yogas are three times as powerful as Vara/Tithi Yogas, and Vara/Tithi/
// Nakshatra Yogas are three times as powerful as Vara/Nakshatra Yogas. Tithi/Nakshatra Yogas are the least powerful."
//
// The tithi of a yoga is counted 1 to 15 in each half (the 12th is the 12th of the bright and of the dark half); Purnima
// is the full Moon, the 15th of the bright half only. The vāras are numbered from Sunday (0).

export type VtnKind = 'VT' | 'TN' | 'VN' | 'VTN';
/** Auspicious, inauspicious, or one that makes the event repeat (Tripuṣkara, Dvipuṣkara: good for what is to be repeated). */
export type VtnNature = 'auspicious' | 'inauspicious' | 'repeating';

export interface VtnYoga {
  id: string;
  name: string;
  kind: VtnKind;
  nature: VtnNature;
  /** The book: "three times as powerful" from one kind to the next; Tithi/Nakṣatra the least. */
  strength: number;
  /** Whether a moment (the vāra, the tithi 1 to 30 and the nakṣatra 0 to 26 of it) forms the yoga. */
  holds: (vara: number, tithi: number, nakshatra: number) => boolean;
}

export const VTN_STRENGTH: Record<VtnKind, number> = { TN: 1, VT: 2, VN: 6, VTN: 18 };

const NAKSHATRAS = [
  'Asvini', 'Bharani', 'Krittika', 'Rohini', 'Mrigasira', 'Ardra', 'Punarvasu', 'Pushya', 'Aslesha', 'Magha', 'Purvaphalguni',
  'Uttaraphalguni', 'Hasta', 'Chitra', 'Svati', 'Visakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purvashadha', 'Uttarashadha', 'Sravana',
  'Dhanishtha', 'Satabhisha', 'Purvabhadrapada', 'Uttarabhadrapada', 'Revati',
];
/** The numbers (0 to 26) of nakṣatras named in the book's spelling. */
const nk = (...names: string[]): number[] => names.map(name => {
  const index = NAKSHATRAS.indexOf(name);
  if (index < 0) throw new Error(`unknown nakshatra ${name}`);
  return index;
});

const NANDA = [1, 6, 11];
const BHADRA = [2, 7, 12];
const JAYA = [3, 8, 13];
const RIKTA = [4, 9, 14];
const PURNA = [5, 10, 15];
const UTTARAS = nk('Uttaraphalguni', 'Uttarashadha', 'Uttarabhadrapada');

/** The tithi of a half (1 to 15) of a tithi 1 to 30. */
export const tithiOfHalf = (tithi: number) => ((tithi - 1) % 15) + 1;

type PerVara<T> = [T, T, T, T, T, T, T];
const none: number[] = [];

/** A Vāra/Tithi yoga: for each vāra from Sunday the tithis (of a half) that form it. */
const vt = (id: string, name: string, nature: VtnNature, tithis: PerVara<number[]>): VtnYoga => ({
  id, name, kind: 'VT', nature, strength: VTN_STRENGTH.VT, holds: (vara, tithi) => tithis[vara].includes(tithiOfHalf(tithi)),
});
/** A Vāra/Nakṣatra yoga: for each vāra the nakṣatras that form it (those on a tithi that is not Riktā, where `notRikta`). */
const vn = (id: string, name: string, nature: VtnNature, nakshatras: PerVara<number[]>, notRikta = false): VtnYoga => ({
  id, name, kind: 'VN', nature, strength: VTN_STRENGTH.VN,
  holds: (vara, tithi, nakshatra) => nakshatras[vara].includes(nakshatra) && !(notRikta && RIKTA.includes(tithiOfHalf(tithi))),
});
/**
 * A Vāra/Tithi/Nakṣatra yoga: for each vāra the tithis and the nakṣatras that together form it. Purnima (the full Moon, the
 * 15th of the bright half only) is `'only'` the tithi of a vāra or `'also'` one of them.
 */
type Purnima = '' | 'only' | 'also';
const vtn = (id: string, name: string, nature: VtnNature, tithis: PerVara<number[]>, nakshatras: PerVara<number[]>, purnima: PerVara<Purnima> = ['', '', '', '', '', '', '']): VtnYoga => ({
  id, name, kind: 'VTN', nature, strength: VTN_STRENGTH.VTN,
  holds: (vara, tithi, nakshatra) => {
    if (!nakshatras[vara].includes(nakshatra)) return false;
    if (purnima[vara] === 'only') return tithi === 15;
    return tithis[vara].includes(tithiOfHalf(tithi)) || (purnima[vara] === 'also' && tithi === 15);
  },
});
/** A Tithi/Nakṣatra yoga: pairs of a tithi (of a half) and the nakṣatras with it. */
const tn = (id: string, name: string, pairs: [number, number[]][]): VtnYoga => ({
  id, name, kind: 'TN', nature: 'inauspicious', strength: VTN_STRENGTH.TN,
  holds: (_vara, tithi, nakshatra) => pairs.some(([day, list]) => day === tithiOfHalf(tithi) && list.includes(nakshatra)),
});

export const VTN_YOGAS: VtnYoga[] = [
  // --- Vāra/Tithi, auspicious
  // Nanda on Venus's, Bhadra on Mercury's, Jaya on Mars's, Rikta on Saturn's and Purna on Jupiter's vāra.
  vt('vt-siddha', 'Siddha', 'auspicious', [none, none, JAYA, BHADRA, PURNA, NANDA, RIKTA]),
  // Nanda on Sun's and Mars's, Bhadra on Moon's and Venus's, Jaya on Mercury's, Rikta on Jupiter's, Purna on Saturn's vāra.
  vt('vt-amrita', 'Amrita', 'auspicious', [NANDA, BHADRA, NANDA, JAYA, RIKTA, BHADRA, PURNA]),
  // --- Vāra/Tithi, inauspicious
  // The 6th tithi on Saturn's vāra, the 7th on Venus's and so on in reverse.
  vt('vt-krakacha', 'Krakacha', 'inauspicious', [[12], [11], [10], [9], [8], [7], [6]]),
  vt('vt-dagdha', 'Dagdha', 'inauspicious', [[12], [11], [5], [2, 3], [6], [8], [9]]),
  vt('vt-hutasana', 'Hutasana', 'inauspicious', [[12], [6], [7], [8], [9], [10], [11]]),
  vt('vt-visha', 'Visha', 'inauspicious', [[4], [6], [7], [2], [8], [9], [7]]),
  vt('vt-samvartaka', 'Samvartaka', 'inauspicious', [[7], none, none, [1], none, none, none]),
  // --- Tithi/Nakṣatra, inauspicious
  tn('tn-asubha', 'Asubha', [
    [12, nk('Aslesha')], [1, nk('Uttarashadha')], [2, nk('Anuradha')], [5, nk('Magha')], [3, UTTARAS], [11, nk('Rohini')],
    [13, nk('Svati', 'Chitra')], [7, nk('Hasta', 'Mula')], [9, nk('Krittika')], [8, nk('Purvabhadrapada')], [6, nk('Rohini')],
  ]),
  // Nothing important to be commenced: the ill effects show in ten months.
  tn('tn-ten-months', 'Poor luck in ten months', [
    [2, nk('Anuradha')], [3, UTTARAS], [5, nk('Magha', 'Hasta')], [13, nk('Chitra', 'Svati')], [8, nk('Rohini')],
  ]),
  // --- Vāra/Nakṣatra, auspicious
  vn('vn-sarvartha-siddhi', 'Sarvartha Siddhi', 'auspicious', [
    nk('Asvini', 'Pushya', 'Hasta', 'Uttaraphalguni', 'Mula', 'Uttarashadha', 'Uttarabhadrapada'),
    nk('Rohini', 'Mrigasira', 'Pushya', 'Anuradha', 'Sravana'),
    nk('Asvini', 'Krittika', 'Aslesha', 'Uttarabhadrapada'),
    nk('Krittika', 'Rohini', 'Mrigasira', 'Hasta', 'Anuradha'),
    nk('Asvini', 'Punarvasu', 'Pushya', 'Anuradha', 'Revati'),
    nk('Asvini', 'Punarvasu', 'Anuradha', 'Sravana', 'Revati'),
    nk('Rohini', 'Svati', 'Sravana'),
  ]),
  vn('vn-siddha', 'Siddha', 'auspicious', [
    nk('Uttaraphalguni', 'Hasta', 'Mula', 'Uttarashadha', 'Sravana', 'Uttarabhadrapada', 'Revati'),
    none,
    nk('Asvini', 'Uttaraphalguni', 'Uttarabhadrapada', 'Revati'),
    nk('Krittika', 'Purvaphalguni', 'Uttaraphalguni', 'Anuradha', 'Purvashadha', 'Uttarashadha', 'Purvabhadrapada'),
    none,
    nk('Uttaraphalguni', 'Hasta', 'Chitra', 'Svati', 'Anuradha', 'Purvashadha', 'Uttarashadha', 'Sravana', 'Dhanishtha', 'Satabhisha', 'Purvabhadrapada', 'Uttarabhadrapada'),
    none,
  ]),
  // "Another Siddha Yoga": one nakṣatra to each vāra.
  vn('vn-siddha-2', 'Siddha', 'auspicious', [nk('Mula'), nk('Dhanishtha'), nk('Uttarabhadrapada'), nk('Krittika'), nk('Punarvasu'), nk('Purvaphalguni'), nk('Svati')]),
  vn('vn-amrita', 'Amrita', 'auspicious', [
    none,
    nk('Rohini', 'Mrigasira', 'Punarvasu', 'Svati', 'Sravana'),
    nk('Mrigasira', 'Punarvasu', 'Pushya', 'Aslesha', 'Magha', 'Purvaphalguni', 'Hasta', 'Chitra', 'Svati'),
    nk('Ardra', 'Punarvasu', 'Pushya', 'Aslesha', 'Magha', 'Hasta', 'Chitra', 'Svati', 'Visakha', 'Sravana'),
    nk('Asvini', 'Punarvasu', 'Pushya', 'Magha', 'Svati'),
    nk('Asvini', 'Bharani', 'Purvaphalguni', 'Revati'),
    nk('Krittika', 'Rohini', 'Satabhisha', 'Svati'),
  ]),
  vn('vn-subha', 'Subha', 'auspicious', [
    none, none, none,
    nk('Rohini', 'Jyeshtha', 'Satabhisha', 'Uttarabhadrapada'),
    nk('Bharani', 'Aslesha', 'Visakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purvashadha', 'Uttarashadha', 'Sravana', 'Dhanishtha'),
    none,
    nk('Asvini', 'Bharani', 'Mrigasira', 'Ardra', 'Pushya', 'Magha', 'Visakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Uttaraphalguni', 'Sravana', 'Dhanishtha', 'Purvabhadrapada', 'Uttarabhadrapada'),
  ]),
  vn('vn-subha-madhyam', 'Subha Madhyam', 'auspicious', [
    nk('Bharani', 'Krittika', 'Rohini', 'Mrigasira', 'Ardra', 'Punarvasu', 'Aslesha', 'Purvaphalguni', 'Chitra', 'Svati', 'Purvashadha', 'Dhanishtha', 'Satabhisha', 'Purvabhadrapada'),
    none,
    nk('Bharani', 'Krittika', 'Rohini', 'Jyeshtha', 'Mula', 'Purvashadha', 'Sravana'),
    none,
    nk('Hasta', 'Chitra', 'Purvabhadrapada', 'Uttarabhadrapada'),
    none, none,
  ]),
  vn('vn-shobhana', 'Shobhana', 'auspicious', [
    none,
    nk('Asvini', 'Bharani', 'Krittika', 'Ardra', 'Pushya', 'Aslesha', 'Magha', 'Purvaphalguni', 'Hasta', 'Anuradha', 'Jyeshtha', 'Mula', 'Dhanishtha', 'Satabhisha', 'Purvabhadrapada', 'Revati'),
    none, none, none, none, none,
  ]),
  vn('vn-sri', 'Sri', 'auspicious', [none, none, none, none, none, nk('Bharani', 'Krittika', 'Mrigasira', 'Ardra', 'Punarvasu'), none]),
  // The Yogas that Dispel Difficulties: on tithis other than Rikta.
  vn('vn-dispel', 'Dispelling difficulties', 'auspicious', [
    nk('Bharani', 'Uttaraphalguni', 'Mula', 'Uttarashadha', 'Sravana', 'Revati'),
    nk('Rohini', 'Mrigasira', 'Punarvasu', 'Svati', 'Sravana'),
    nk('Asvini', 'Rohini', 'Uttaraphalguni', 'Hasta', 'Anuradha', 'Uttarabhadrapada'),
    nk('Krittika', 'Mrigasira', 'Purvaphalguni', 'Uttaraphalguni', 'Anuradha', 'Purvashadha', 'Uttarashadha', 'Purvabhadrapada'),
    nk('Asvini', 'Punarvasu', 'Pushya', 'Magha', 'Svati'),
    nk('Asvini', 'Bharani', 'Mula', 'Revati'),
    nk('Krittika', 'Rohini', 'Svati', 'Satabhisha'),
  ], true),
  // --- Vāra/Nakṣatra, inauspicious
  vn('vn-dagdha', 'Dagdha', 'inauspicious', [nk('Bharani'), nk('Chitra'), nk('Uttarashadha'), nk('Dhanishtha'), nk('Uttaraphalguni'), nk('Jyeshtha'), nk('Revati')]),
  vn('vn-dagdha-fatal', 'Dagdha (fatal)', 'inauspicious', [none, none, none, none, nk('Krittika', 'Rohini', 'Mrigasira', 'Ardra', 'Uttaraphalguni', 'Satabhisha'), none, none]),
  vn('vn-yamaghanta', 'Yamaghanta', 'inauspicious', [nk('Magha'), nk('Visakha'), nk('Ardra'), nk('Mula'), nk('Krittika'), nk('Rohini'), nk('Hasta')]),
  vn('vn-utpata', 'Utpata', 'inauspicious', [nk('Visakha'), nk('Purvashadha'), nk('Dhanishtha'), nk('Revati'), nk('Rohini'), nk('Pushya'), nk('Uttaraphalguni')]),
  vn('vn-mrityu', 'Mrityu', 'inauspicious', [nk('Anuradha'), nk('Uttarashadha'), nk('Satabhisha'), nk('Asvini'), nk('Mrigasira'), nk('Aslesha'), nk('Hasta')]),
  vn('vn-mrityu-2', 'Mrityu', 'inauspicious', [nk('Visakha'), nk('Purvashadha'), nk('Dhanishtha'), nk('Anuradha'), nk('Mrigasira'), nk('Svati', 'Rohini'), nk('Sravana')]),
  vn('vn-mrityu-3', 'Mrityu', 'inauspicious', [none, none, none, none, none, none, nk('Punarvasu', 'Aslesha', 'Purvaphalguni', 'Hasta', 'Chitra', 'Purvashadha', 'Uttarashadha', 'Revati')]),
  vn('vn-kana', 'Kana', 'inauspicious', [nk('Jyeshtha'), nk('Sravana'), nk('Purvabhadrapada'), nk('Bharani'), nk('Ardra'), nk('Magha'), nk('Chitra')]),
  vn('vn-nasa', 'Nasa', 'inauspicious', [
    nk('Asvini', 'Magha', 'Visakha', 'Anuradha', 'Jyeshtha'),
    nk('Krittika', 'Uttaraphalguni', 'Chitra', 'Visakha', 'Purvashadha', 'Uttarashadha', 'Uttarabhadrapada'),
    nk('Mrigasira', 'Ardra', 'Visakha', 'Uttarashadha', 'Dhanishtha', 'Satabhisha', 'Purvabhadrapada'),
    nk('Asvini', 'Bharani', 'Mula', 'Dhanishtha', 'Revati'),
    nk('Uttaraphalguni'),
    nk('Rohini', 'Pushya', 'Aslesha', 'Magha', 'Visakha', 'Jyeshtha'),
    nk('Revati'),
  ]),
  // --- Vāra/Tithi/Nakṣatra, auspicious
  vtn('vtn-suta', 'Suta', 'auspicious',
    [[5, 7], [5, 7], [5, 7], [5, 7], [13], [1, 6, 11], [2, 7, 12]],
    [nk('Pushya', 'Hasta', 'Mula'), nk('Mrigasira', 'Svati', 'Sravana'), nk('Asvini', 'Rohini', 'Uttaraphalguni', 'Uttarashadha', 'Purvabhadrapada', 'Uttarabhadrapada'),
      nk('Asvini', 'Purvaphalguni', 'Purvashadha', 'Purvabhadrapada'), nk('Punarvasu', 'Purvashadha', 'Revati'), nk('Uttaraphalguni', 'Svati', 'Satabhisha'), nk('Rohini', 'Svati', 'Dhanishtha')]),
  vtn('vtn-siddha', 'Siddha', 'auspicious',
    [[1, 4, 6, 7, 12], BHADRA, [...NANDA, ...BHADRA], [...BHADRA, ...JAYA], [4, 5, 7, 9, 13, 14], [...NANDA, ...BHADRA], [...BHADRA, ...RIKTA]],
    [nk('Pushya', 'Hasta', 'Uttaraphalguni', 'Mula', 'Uttarashadha', 'Sravana', 'Uttarabhadrapada'),
      nk('Rohini', 'Mrigasira', 'Punarvasu', 'Chitra', 'Sravana', 'Dhanishtha', 'Satabhisha', 'Purvabhadrapada'),
      nk('Asvini', 'Mrigasira', 'Uttaraphalguni', 'Chitra', 'Anuradha', 'Mula', 'Dhanishtha', 'Purvabhadrapada'),
      nk('Rohini', 'Mrigasira', 'Ardra', 'Uttaraphalguni', 'Anuradha', 'Uttarashadha'),
      nk('Asvini', 'Punarvasu', 'Pushya', 'Magha', 'Svati', 'Purvashadha', 'Purvabhadrapada', 'Revati'),
      nk('Asvini', 'Bharani', 'Ardra', 'Uttaraphalguni', 'Chitra', 'Svati', 'Purvashadha', 'Revati'),
      nk('Rohini', 'Svati', 'Visakha', 'Anuradha', 'Dhanishtha', 'Satabhisha')]),
  // --- Vāra/Tithi/Nakṣatra, inauspicious
  vtn('vtn-visha', 'Visha', 'inauspicious',
    [[5], [2], [15], [7], [13], [6], [8]],
    [nk('Krittika'), nk('Chitra'), nk('Rohini'), nk('Bharani'), nk('Anuradha'), nk('Sravana'), nk('Revati')],
    ['', '', 'only', '', '', '', '']),
  vtn('vtn-vinasa', 'Vinasa', 'inauspicious',
    [[3, 4, 8, 9, 13, 14], [6, 7, 11], [1, 2, 7, 8, 10], [2, 3, 8, 9], [6, 8, 9, 12, 13], [2, 3, 6, 8, 10, 11], [3, 7, 9, 11]],
    [nk('Bharani', 'Mrigasira', 'Aslesha', 'Visakha', 'Anuradha', 'Jyeshtha', 'Dhanishtha'),
      nk('Krittika', 'Bharani', 'Magha', 'Anuradha', 'Purvashadha', 'Uttarashadha', 'Uttarabhadrapada'),
      nk('Ardra', 'Punarvasu', 'Purvashadha', 'Uttarashadha', 'Sravana', 'Dhanishtha', 'Satabhisha', 'Jyeshtha'),
      nk('Asvini', 'Bharani', 'Pushya', 'Aslesha', 'Magha', 'Mula', 'Dhanishtha', 'Purvabhadrapada'),
      nk('Krittika', 'Rohini', 'Mrigasira', 'Ardra', 'Uttaraphalguni', 'Anuradha', 'Visakha', 'Satabhisha'),
      nk('Rohini', 'Punarvasu', 'Magha', 'Visakha', 'Anuradha', 'Jyeshtha', 'Sravana', 'Dhanishtha'),
      nk('Bharani', 'Punarvasu', 'Pushya', 'Purvaphalguni', 'Uttaraphalguni', 'Hasta', 'Purvashadha', 'Sravana', 'Uttarashadha')],
    ['', '', 'also', '', '', '', '']),
];
/** The Tripuṣkara and Dvipuṣkara yogas: the vāra of a malefic (Sun, Mars, Saturn) in a Bhadra tithi with a Tripāda or Dvipāda nakṣatra. */
const MALEFIC_VARAS = [0, 2, 6];
const pushkara = (id: string, name: string, nakshatras: number[]): VtnYoga => ({
  id, name, kind: 'VTN', nature: 'repeating', strength: VTN_STRENGTH.VTN,
  holds: (vara, tithi, nakshatra) => MALEFIC_VARAS.includes(vara) && BHADRA.includes(tithiOfHalf(tithi)) && nakshatras.includes(nakshatra),
});
VTN_YOGAS.push(
  pushkara('vtn-tripushkara', 'Tripushkara (repeats three times)', nk('Krittika', 'Punarvasu', 'Uttaraphalguni', 'Visakha', 'Uttarashadha', 'Purvabhadrapada')),
  pushkara('vtn-dvipushkara', 'Dvipushkara (repeats two times)', nk('Mrigasira', 'Chitra', 'Dhanishtha')),
);

/**
 * The Sarvārtha Siddhi yogas that the book calls unfavourable for marriage, travelling and entering a new house: Aśvinī on
 * the vāra of Mars, Puṣya on that of Jupiter and Rohiṇī on that of Saturn.
 */
export const SARVARTHA_EXCEPTIONS: [number, number][] = [[2, 0], [4, 7], [6, 3]];

export interface VtnOptions {
  /** The event is a marriage, a journey or entering a house: the three Sarvārtha Siddhi yogas above do not count. */
  sarvarthaExceptions?: boolean;
}

/** The yogas a moment forms. */
export function vtnYogasAt(vara: number, tithi: number, nakshatra: number, options: VtnOptions = {}): VtnYoga[] {
  return VTN_YOGAS.filter(yoga => {
    if (!yoga.holds(vara, tithi, nakshatra)) return false;
    if (options.sarvarthaExceptions && yoga.id === 'vn-sarvartha-siddhi' && SARVARTHA_EXCEPTIONS.some(([v, n]) => v === vara && n === nakshatra)) return false;
    return true;
  });
}

/**
 * What the yogas of a moment come to. The book: yogas of the same kind that are both present cancel (the auspicious one
 * prevails if the Tara and the others suit), and of different kinds the more powerful kind gives its effects. So the
 * strongest auspicious and the strongest inauspicious are set against each other: `good` where the auspicious one is at
 * least as strong and no inauspicious one is as strong, `mixed` where both are present and equally strong, `bad` where the
 * inauspicious is stronger, `none` where there is neither. The yogas that repeat the event count for nothing.
 */
export type VtnVerdict = 'good' | 'mixed' | 'bad' | 'none';
export function vtnVerdict(yogas: VtnYoga[]): VtnVerdict {
  const strongest = (nature: VtnNature) => yogas.filter(yoga => yoga.nature === nature).reduce((max, yoga) => Math.max(max, yoga.strength), 0);
  const good = strongest('auspicious');
  const bad = strongest('inauspicious');
  if (good === 0 && bad === 0) return 'none';
  if (bad === 0) return 'good';
  if (good === 0) return 'bad';
  if (good > bad) return 'good';
  if (bad > good) return 'bad';
  return 'mixed';
}
