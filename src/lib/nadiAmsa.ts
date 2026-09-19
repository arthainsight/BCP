import { getDegreesInSign, getSignIndex, isDualSign, isFixedSign, normalizeLongitude } from './varga/utils';

export const NADI_AMSA_COUNT = 150;
export const NADI_AMSA_SIZE_DEGREES = 30 / NADI_AMSA_COUNT;
export const NADI_HALF_SIZE_DEGREES = NADI_AMSA_SIZE_DEGREES / 2;

// Deva Keralam / Chandra Kala Nadi names in their canonical movable-sign order.
// Transliteration variants exist; these spellings are kept stable for lookup/export.
export const DEVA_KERALAM_NADI_NAMES = [
  'Vasudhā', 'Vaiṣṇavī', 'Brāhmī', 'Kālakūṭa', 'Śāṅkarī', 'Sudhākarī', 'Samā', 'Saumyā', 'Surā', 'Māyā',
  'Manoharā', 'Mādhavī', 'Mañjusvanā', 'Ghorā', 'Kumbhinī', 'Kuṭilā', 'Prabhā', 'Parā', 'Payasvinī', 'Mālā',
  'Jagatī', 'Jarjharā', 'Dhruvā', 'Musalā', 'Mudgarā', 'Pāśā', 'Campakā', 'Dāminī', 'Mahī', 'Kaluṣā',
  'Kamalā', 'Kāntā', 'Kālā', 'Karikarā', 'Kṣamā', 'Durdharā', 'Durbhagā', 'Viśvā', 'Viśīrṇā', 'Vikaṭā',
  'Āvilā', 'Vibhramā', 'Sukhadā', 'Snigdhā', 'Sodarā', 'Surasundarī', 'Amṛtaplāvinī', 'Karālā', 'Kāmadhuk', 'Karavīraṇī',
  'Gahvarā', 'Kuṇḍinī', 'Raudrā', 'Viśākhyā', 'Viṣanāśinī', 'Narmadā', 'Śītalā', 'Nimnā', 'Prītā', 'Priyavardhinī',
  'Mānaghnā', 'Durbhagā', 'Citrā', 'Citriṇī', 'Cirañjīvinī', 'Bhūpā', 'Gadāharā', 'Nālā', 'Nalinī', 'Nirmalā',
  'Nadī', 'Sudhāmṛtāṁśu', 'Kālikā', 'Kaluṣāṅkurā', 'Trailokyamohanakarī', 'Mahāmārī', 'Suśītalā', 'Sukhadā', 'Suprabhā', 'Śobhā',
  'Śobhanā', 'Śivadā', 'Śivā', 'Bālā', 'Jvālā', 'Gadā', 'Gāḍhā', 'Nūtanā', 'Sumanoharā', 'Somavallī',
  'Somalatā', 'Maṅgalā', 'Mudrikā', 'Kṣudhā', 'Mokṣāpavargā', 'Valayā', 'Navanītā', 'Niśācarī', 'Nirṛti', 'Nigaḍā',
  'Sārā', 'Saṅgītā', 'Samadā', 'Samā', 'Viśvambharā', 'Kumārī', 'Kokilā', 'Kuñjarākṛti', 'Aindrā', 'Svāhā',
  'Svarā', 'Vahni', 'Prītā', 'Rakṣajalāplavā', 'Vāruṇī', 'Madirā', 'Maitrī', 'Hāriṇī', 'Hariṇī', 'Marut',
  'Dhanañjayā', 'Dhanakarī', 'Dhanadā', 'Kacchapāmbujā', 'Māṁsānī', 'Śūlinī', 'Raudrī', 'Śivā', 'Śivakarī', 'Kalā',
  'Kuṇḍā', 'Mukundā', 'Bharatā', 'Haritā', 'Kadalī', 'Smarā', 'Kandalā', 'Kokilā', 'Pāpā', 'Kāminī',
  'Kalaśodbhavā', 'Vīraprasū', 'Saṅgarā', 'Śatayajñā', 'Śatāvarī', 'Prahvī', 'Pāṭalinī', 'Nāgā', 'Paṅkajā', 'Parameśvarī',
] as const;

export type NadiHalf = 'purva' | 'para';

export interface DevaKeralamNadiAmsa {
  system: 'deva-keralam';
  rawDivision: number;
  nadiNumber: number;
  nadiName: string;
  modality: 'movable' | 'fixed' | 'dual';
  offsetDegrees: number;
}

export interface NadiD150 {
  system: 'nadi-d150';
  rawDivision: number;
  signIndex: number;
  half: NadiHalf;
  halfNumber: number;
  offsetDegrees: number;
}

function getRawDivision(longitude: number): number {
  const degrees = getDegreesInSign(longitude);
  // The epsilon keeps exact decimal boundaries (for example 0.2°) from
  // falling into the previous division because of binary floating point.
  return Math.min(NADI_AMSA_COUNT - 1, Math.floor((degrees + 1e-10) / NADI_AMSA_SIZE_DEGREES));
}

/**
 * Deva Keralam / Chandra Kala Nadi equal-division indexing.
 *
 * Each sign has 150 equal 0°12′ divisions. Names/numbers run forward in
 * movable signs, backward in fixed signs, and 76..150 then 1..75 in dual signs.
 */
export function calculateDevaKeralamNadiAmsa(longitude: number): DevaKeralamNadiAmsa {
  const normalized = normalizeLongitude(longitude);
  const signIndex = getSignIndex(normalized);
  const rawDivision = getRawDivision(normalized);
  const degrees = getDegreesInSign(normalized);

  if (isFixedSign(signIndex)) {
    return {
      system: 'deva-keralam',
      rawDivision: rawDivision + 1,
      nadiNumber: NADI_AMSA_COUNT - rawDivision,
      nadiName: DEVA_KERALAM_NADI_NAMES[NADI_AMSA_COUNT - rawDivision - 1],
      modality: 'fixed',
      offsetDegrees: degrees - rawDivision * NADI_AMSA_SIZE_DEGREES,
    };
  }

  if (isDualSign(signIndex)) {
    return {
      system: 'deva-keralam',
      rawDivision: rawDivision + 1,
      nadiNumber: rawDivision < 75 ? rawDivision + 76 : rawDivision - 74,
      nadiName: DEVA_KERALAM_NADI_NAMES[(rawDivision < 75 ? rawDivision + 76 : rawDivision - 74) - 1],
      modality: 'dual',
      offsetDegrees: degrees - rawDivision * NADI_AMSA_SIZE_DEGREES,
    };
  }

  return {
    system: 'deva-keralam',
    rawDivision: rawDivision + 1,
    nadiNumber: rawDivision + 1,
    nadiName: DEVA_KERALAM_NADI_NAMES[rawDivision],
    modality: 'movable',
    offsetDegrees: degrees - rawDivision * NADI_AMSA_SIZE_DEGREES,
  };
}

/**
 * Nāḍī D150 placement by rāśi modality.
 *
 * Movable: count forward from the natal sign.
 * Fixed: count backward from the fifth sign from the natal sign.
 * Dual divisions 1–75: count forward from the next sign.
 * Dual divisions 76–150: count forward from the eleventh sign using n − 76.
 *
 * Counting is inclusive, matching the supplied worked examples. Every 0°12′
 * division is also exposed as its 0°06′ pūrva/para half (300 half-nāḍīs).
 */
export function calculateNadiD150(longitude: number): NadiD150 {
  const normalized = normalizeLongitude(longitude);
  const signIndex = getSignIndex(normalized);
  const degrees = getDegreesInSign(normalized);
  const rawDivision = getRawDivision(normalized);
  const nadiNumber = rawDivision + 1;
  const offsetDegrees = degrees - rawDivision * NADI_AMSA_SIZE_DEGREES;
  const halfIndex = offsetDegrees + 1e-10 >= NADI_HALF_SIZE_DEGREES ? 1 : 0;

  let d150SignIndex: number;
  if (isFixedSign(signIndex)) {
    const fifthSign = (signIndex + 4) % 12;
    d150SignIndex = (fifthSign - (nadiNumber - 1) + 1200) % 12;
  } else if (isDualSign(signIndex)) {
    if (nadiNumber <= 75) {
      const nextSign = (signIndex + 1) % 12;
      d150SignIndex = (nextSign + (nadiNumber - 1)) % 12;
    } else {
      const eleventhSign = (signIndex + 10) % 12;
      const count = nadiNumber - 76;
      d150SignIndex = (eleventhSign + (count - 1) + 1200) % 12;
    }
  } else {
    d150SignIndex = (signIndex + (nadiNumber - 1)) % 12;
  }

  return {
    system: 'nadi-d150',
    rawDivision: nadiNumber,
    signIndex: d150SignIndex,
    half: halfIndex === 0 ? 'purva' : 'para',
    halfNumber: rawDivision * 2 + halfIndex + 1,
    offsetDegrees,
  };
}
