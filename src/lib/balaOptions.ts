// The choices of the Ṣaḍbala and the Bhāva Bala where the verses are silent or the sources disagree.
//
// Each is a choice point of docs/shadbala-manual.md (C1 …), with the Sanskrit-text reading as the default.
// The settings are kept in the browser (see balaOptionsStore.ts); they change only how the two views are
// calculated, not the chart.

export type MoonRule = 'dark-half' | 'tithi-8';
export type MercuryRule = 'any-malefic' | 'majority' | 'always-benefic';
export type SaptavargajaScores = 'sanskrit' | 'raman';
export type MulatrikonaRule = 'rasi-only' | 'all-vargas';
export type TemporaryRelationChart = 'rasi' | 'varga';
export type DigPoints = 'angles' | 'equal-houses';
export type LuminaryCheshta = 'in-total' | 'left-out' | 'doubled-in-kala';
export type AyanaMethod = 'table' | 'declination';
export type DrekkanaOrder = 'neuter-second' | 'female-second';
export type DrigMercuryJupiter = 'quarter' | 'full-addon';
export type BhavaHouses = 'whole-sign' | 'sripati' | 'equal-from-lagna';
export type BhavaCancer = 'lagna' | 'midheaven';
export type BhavaMercuryJupiter = 'full-instead' | 'full-addon' | 'quarter';
export type BhavaParts = 'five' | 'three';

export interface BalaOptions {
  moonRule: MoonRule;
  mercuryRule: MercuryRule;
  saptavargajaScores: SaptavargajaScores;
  mulatrikona: MulatrikonaRule;
  temporaryRelation: TemporaryRelationChart;
  digPoints: DigPoints;
  luminaryCheshta: LuminaryCheshta;
  ayana: AyanaMethod;
  drekkana: DrekkanaOrder;
  drigMercuryJupiter: DrigMercuryJupiter;
  bhavaHouses: BhavaHouses;
  bhavaCancer: BhavaCancer;
  bhavaMercuryJupiter: BhavaMercuryJupiter;
  bhavaParts: BhavaParts;
}

/** The reading of the Sanskrit text, with the decisions of the audit (docs/shadbala-sources.md). */
export const DEFAULT_BALA_OPTIONS: BalaOptions = {
  moonRule: 'dark-half',
  mercuryRule: 'any-malefic',
  saptavargajaScores: 'sanskrit',
  mulatrikona: 'rasi-only',
  temporaryRelation: 'rasi',
  digPoints: 'angles',
  luminaryCheshta: 'in-total',
  ayana: 'table',
  drekkana: 'neuter-second',
  drigMercuryJupiter: 'quarter',
  bhavaHouses: 'whole-sign',
  bhavaCancer: 'lagna',
  bhavaMercuryJupiter: 'full-instead',
  bhavaParts: 'five',
};

/** The choices as JHora makes them, for comparing with it (the Sun's and the Moon's Cheṣṭā Bala not in the total). */
export const JHORA_LIKE_BALA_OPTIONS: BalaOptions = {
  ...DEFAULT_BALA_OPTIONS,
  moonRule: 'tithi-8',
  saptavargajaScores: 'raman',
  digPoints: 'equal-houses',
  luminaryCheshta: 'left-out',
};

export interface BalaOptionChoice<V extends string = string> {
  value: V;
  label: string;
}

export interface BalaOptionDefinition {
  key: keyof BalaOptions;
  /** Which view the choice belongs to. */
  view: 'shadbala' | 'bhava';
  /** The choice point of the manual. */
  choicePoint: string;
  label: string;
  note: string;
  choices: BalaOptionChoice[];
}

// The texts are English and are translated by the interface (src/lib/i18n.ts) when shown.
export const BALA_OPTION_DEFINITIONS: readonly BalaOptionDefinition[] = [
  {
    key: 'moonRule', view: 'shadbala', choicePoint: 'C1', label: 'The Moon as a benefic or a malefic',
    note: 'BPHS 3.11 says that the waning Moon is a malefic, but not when it begins to wane. Used in Dṛg Bala.',
    choices: [
      { value: 'dark-half', label: 'A malefic in the dark half, after the full Moon (Santhanam)' },
      { value: 'tithi-8', label: 'A malefic from the 8th tithi of the dark half to the 8th of the bright half (B. V. Raman, JHora)' },
    ],
  },
  {
    key: 'mercuryRule', view: 'shadbala', choicePoint: 'C2', label: 'Mercury as a benefic or a malefic',
    note: 'BPHS 3.11: Mercury is a malefic in the company of a malefic. The text gives no orb; the sign is taken as the company.',
    choices: [
      { value: 'any-malefic', label: 'A malefic when a malefic stands in its sign' },
      { value: 'majority', label: 'A malefic when a malefic stands in its sign and the benefics there do not outnumber the malefics (P. V. R. Narasimha Rao)' },
      { value: 'always-benefic', label: 'Always a benefic' },
    ],
  },
  {
    key: 'saptavargajaScores', view: 'shadbala', choicePoint: 'C3', label: 'Saptavargaja Bala: the scores',
    note: 'Own mūlatrikoṇa 45, own sign 30, then by the compound relation of the sign\'s lord.',
    choices: [
      { value: 'sanskrit', label: 'The verse: 20 / 15 / 10 / 4 / 2 (adhimitra, mitra, sama, śatru, adhiśatru)' },
      { value: 'raman', label: 'B. V. Raman, JHora: 22.5 / 15 / 7.5 / 3.75 / 1.875' },
    ],
  },
  {
    key: 'mulatrikona', view: 'shadbala', choicePoint: 'C3', label: 'Saptavargaja Bala: the mūlatrikoṇa',
    note: 'Whether the 45 of the mūlatrikoṇa is given in the divisional charts too.',
    choices: [
      { value: 'rasi-only', label: 'In the rāśi only, within its degrees (B. V. Raman)' },
      { value: 'all-vargas', label: 'In every varga whose sign is the mūlatrikoṇa sign (Santhanam)' },
    ],
  },
  {
    key: 'temporaryRelation', view: 'shadbala', choicePoint: 'C3', label: 'Saptavargaja Bala: the temporary friendship',
    note: 'Where the 2nd, 3rd, 4th, 10th, 11th and 12th places are counted from.',
    choices: [
      { value: 'rasi', label: 'From the rāśi chart in every varga (Santhanam, Raman)' },
      { value: 'varga', label: 'From the chart of each varga' },
    ],
  },
  {
    key: 'digPoints', view: 'shadbala', choicePoint: 'C4', label: 'Dig Bala: the points',
    note: 'The verse names the 1st, 4th, 7th and 10th house without saying how the houses are divided.',
    choices: [
      { value: 'angles', label: 'The four angles: ascendant, descendant, midheaven, nadir (Santhanam, Raman)' },
      { value: 'equal-houses', label: 'Equal houses from the degree of the Lagna (JHora)' },
    ],
  },
  {
    key: 'luminaryCheshta', view: 'shadbala', choicePoint: 'C5', label: 'Cheṣṭā Bala of the Sun and the Moon',
    note: 'BPHS 27.18 makes the Sun\'s Cheṣṭā Bala its Ayana Bala and the Moon\'s its Pakṣa Bala; 27.25 counts Cheṣṭā among the six.',
    choices: [
      { value: 'in-total', label: 'Both in Kāla and in Cheṣṭā, so twice in the total (the verses)' },
      { value: 'left-out', label: 'Not in the total, the Cheṣṭā column empty (JHora, Raman\'s example)' },
      { value: 'doubled-in-kala', label: 'Ayana of the Sun and Pakṣa of the Moon doubled in Kāla, the Cheṣṭā column empty (Raman, Santhanam)' },
    ],
  },
  {
    key: 'ayana', view: 'shadbala', choicePoint: 'C6', label: 'Ayana Bala: the declination',
    note: 'The verse reads the declination from the longitude by a table; the books also use the real declination.',
    choices: [
      { value: 'table', label: 'From the longitude by the table of the verse (45 : 33 : 12)' },
      { value: 'declination', label: 'The real declination of the graha (Santhanam)' },
    ],
  },
  {
    key: 'drekkana', view: 'shadbala', choicePoint: 'C14', label: 'Drekkana Bala: the order of the decanates',
    note: 'The editions differ: the text read for the audit has the neuters second; the translations of Santhanam and Sharma the females.',
    choices: [
      { value: 'neuter-second', label: 'Males, neuters (Mercury, Saturn), females (Moon, Venus) — the Sanskrit text, Raman' },
      { value: 'female-second', label: 'Males, females, neuters — Santhanam, Sharma' },
    ],
  },
  {
    key: 'drigMercuryJupiter', view: 'shadbala', choicePoint: 'C8', label: 'Dṛg Bala: the aspects of Mercury and Jupiter',
    note: 'BPHS 27.19 says "joined with the aspect of Mercury and Jupiter".',
    choices: [
      { value: 'quarter', label: 'Only the quarter, like the others (Raman, JHora)' },
      { value: 'full-addon', label: 'The quarter, and their aspects in full on top (Santhanam, Sharma)' },
    ],
  },
  {
    key: 'bhavaHouses', view: 'bhava', choicePoint: 'C9', label: 'The houses',
    note: 'The verses do not say how the houses are divided. The middle point of the house is what the aspects and the Dig Bala go by.',
    choices: [
      { value: 'whole-sign', label: 'Whole signs from the Lagna sign, the middle point at 15° (LagnaOne)' },
      { value: 'sripati', label: 'Śrīpati (Porphyry) middle points, the lord of the sign of the middle point (Raman)' },
      { value: 'equal-from-lagna', label: 'Equal houses of 30° from the degree of the Lagna' },
    ],
  },
  {
    key: 'bhavaCancer', view: 'bhava', choicePoint: 'C10', label: 'Bhāva Dig Bala: the angle of Cancer',
    note: 'BPHS 27.27 and the translations pair Cancer with Scorpio; B. V. Raman pairs it with Pisces.',
    choices: [
      { value: 'lagna', label: 'The ascendant, with Scorpio (the verse, Santhanam, Sharma)' },
      { value: 'midheaven', label: 'The midheaven, with Pisces and the second half of Capricorn (Raman, Śrīpati)' },
    ],
  },
  {
    key: 'bhavaMercuryJupiter', view: 'bhava', choicePoint: 'C8', label: 'Bhāva Dṛṣṭi Bala: the aspects of Mercury and Jupiter',
    note: 'BPHS 27.29 says "joined with the aspect of Mercury and Jupiter".',
    choices: [
      { value: 'full-instead', label: 'In full instead of the quarter (B. V. Raman)' },
      { value: 'full-addon', label: 'The quarter, and in full on top (read literally)' },
      { value: 'quarter', label: 'Only the quarter, like the others' },
    ],
  },
  {
    key: 'bhavaParts', view: 'bhava', choicePoint: 'C11', label: 'The parts of Bhāva Bala',
    note: 'B. V. Raman leaves out the occupants and the Kāla Bala that BPHS 27.30–31 give.',
    choices: [
      { value: 'five', label: 'Five parts: lord, Dig, Dṛṣṭi, occupants, Kāla (BPHS 27.26–31)' },
      { value: 'three', label: 'Three parts: lord, Dig, Dṛṣṭi (B. V. Raman)' },
    ],
  },
];

/** A stored value read back as a choice that exists, the default for anything else. */
export function readBalaOptions(raw: unknown): BalaOptions {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const result: BalaOptions = { ...DEFAULT_BALA_OPTIONS };
  for (const definition of BALA_OPTION_DEFINITIONS) {
    const value = source[definition.key];
    if (typeof value === 'string' && definition.choices.some((choice) => choice.value === value)) {
      (result as unknown as Record<string, string>)[definition.key] = value;
    }
  }
  return result;
}

/** Whether any choice differs from the default. */
export function balaOptionsAreCustom(options: BalaOptions): boolean {
  return BALA_OPTION_DEFINITIONS.some((definition) => options[definition.key] !== DEFAULT_BALA_OPTIONS[definition.key]);
}
