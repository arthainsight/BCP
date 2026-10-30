import assert from 'node:assert/strict';
import { VTN_STRENGTH, VTN_YOGAS, tithiOfHalf, vtnVerdict, vtnYogasAt } from './vtnYogas';

const all = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);
const yoga = (id: string) => VTN_YOGAS.find(entry => entry.id === id)!;
/** The nakṣatras (numbered 1 to 27 as in the tables of the book) that form a yoga on a vāra, on some tithi. */
const nakshatrasOf = (id: string, vara: number) => all(27).filter(n => all(30, 1).some(tithi => yoga(id).holds(vara, tithi, n))).map(n => n + 1);
/** The tithis of a half that form a yoga on a vāra, with any nakṣatra. */
const tithisOf = (id: string, vara: number) => all(15, 1).filter(day => yoga(id).holds(vara, day, 0));

assert.equal(new Set(VTN_YOGAS.map(entry => entry.id)).size, VTN_YOGAS.length);
assert.deepEqual([tithiOfHalf(1), tithiOfHalf(15), tithiOfHalf(16), tithiOfHalf(30)], [1, 15, 1, 15], 'the tithi of its half');
assert.deepEqual(VTN_STRENGTH, { TN: 1, VT: 2, VN: 6, VTN: 18 }, 'Vara/Nakshatra three times Vara/Tithi, Vara/Tithi/Nakshatra three times that, Tithi/Nakshatra the least');

// ---------------------------------------------------------------------------
// The tables of the book (the Nakṣatras numbered 1 to 27 from Aśvinī), against the yogas written from its text
// ---------------------------------------------------------------------------
{
  // Vāra/Tithi: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn.
  const tithis: Record<string, number[][]> = {
    'vt-siddha': [[], [], [3, 8, 13], [2, 7, 12], [5, 10, 15], [1, 6, 11], [4, 9, 14]],
    'vt-amrita': [[1, 6, 11], [2, 7, 12], [1, 6, 11], [3, 8, 13], [4, 9, 14], [2, 7, 12], [5, 10, 15]],
    'vt-dagdha': [[12], [11], [5], [2, 3], [6], [8], [9]],
    'vt-visha': [[4], [6], [7], [2], [8], [9], [7]],
    'vt-hutasana': [[12], [6], [7], [8], [9], [10], [11]],
    'vt-krakacha': [[12], [11], [10], [9], [8], [7], [6]],
    'vt-samvartaka': [[7], [], [], [1], [], [], []],
  };
  for (const [id, perVara] of Object.entries(tithis)) {
    perVara.forEach((expected, vara) => assert.deepEqual(tithisOf(id, vara), expected, `${id} on vāra ${vara}`));
  }

  const nakshatras: Record<string, number[][]> = {
    'vn-sarvartha-siddhi': [[1, 8, 12, 13, 19, 21, 26], [4, 5, 8, 17, 22], [1, 3, 9, 26], [3, 4, 5, 13, 17], [1, 7, 8, 17, 27], [1, 7, 17, 22, 27], [4, 15, 22]],
    'vn-siddha-2': [[19], [23], [26], [3], [7], [11], [15]],
    'vn-amrita': [[], [4, 5, 7, 15, 22], [5, 7, 8, 9, 10, 11, 13, 14, 15], [6, 7, 8, 9, 10, 13, 14, 15, 16, 22], [1, 7, 8, 10, 15], [1, 2, 11, 27], [3, 4, 15, 24]],
    'vn-subha-madhyam': [[2, 3, 4, 5, 6, 7, 9, 11, 14, 15, 20, 23, 24, 25], [], [2, 3, 4, 18, 19, 20, 22], [], [13, 14, 25, 26], [], []],
    'vn-sri': [[], [], [], [], [], [2, 3, 5, 6, 7], []],
    'vn-dispel': [[2, 12, 19, 21, 22, 27], [4, 5, 7, 15, 22], [1, 4, 12, 13, 17, 26], [3, 5, 11, 12, 17, 20, 21, 25], [1, 7, 8, 10, 15], [1, 2, 19, 27], [3, 4, 15, 24]],
    'vn-dagdha': [[2], [14], [21], [23], [12], [18], [27]],
    'vn-dagdha-fatal': [[], [], [], [], [3, 4, 5, 6, 12, 24], [], []],
    'vn-yamaghanta': [[10], [16], [6], [19], [3], [4], [13]],
    'vn-utpata': [[16], [20], [23], [27], [4], [8], [12]],
    'vn-mrityu': [[17], [21], [24], [1], [5], [9], [13]],
    'vn-mrityu-3': [[], [], [], [], [], [], [7, 9, 11, 13, 14, 20, 21, 27]],
    'vn-kana': [[18], [22], [25], [2], [6], [10], [14]],
    'vn-nasa': [[1, 10, 16, 17, 18], [3, 12, 14, 16, 20, 21, 26], [5, 6, 16, 21, 23, 24, 25], [1, 2, 19, 23, 27], [12], [4, 8, 9, 10, 16, 18], [27]],
    'vtn-suta': [[8, 13, 19], [5, 15, 22], [1, 4, 12, 21, 25, 26], [1, 11, 20, 25], [7, 20, 27], [12, 15, 24], [4, 15, 23]],
    'vtn-siddha': [[8, 12, 13, 19, 21, 22, 26], [4, 5, 7, 14, 22, 23, 24, 25], [1, 5, 12, 14, 17, 19, 23, 25], [4, 5, 6, 12, 17, 21], [1, 7, 8, 10, 15, 20, 25, 27], [1, 2, 6, 12, 14, 15, 20, 27], [4, 15, 16, 17, 23, 24]],
    'vtn-visha': [[3], [14], [4], [2], [17], [22], [27]],
    'vtn-vinasa': [[2, 5, 9, 16, 17, 18, 23], [2, 3, 10, 17, 20, 21, 26], [6, 7, 18, 20, 21, 22, 23, 24], [1, 2, 8, 9, 10, 19, 23, 25], [3, 4, 5, 6, 12, 16, 17, 24], [4, 7, 10, 16, 17, 18, 22, 23], [2, 7, 8, 11, 12, 13, 20, 21, 22]],
  };
  for (const [id, perVara] of Object.entries(nakshatras)) {
    perVara.forEach((expected, vara) => assert.deepEqual(nakshatrasOf(id, vara), expected, `${id} on vāra ${vara}`));
  }
  assert.deepEqual([0, 2, 6].map(vara => nakshatrasOf('vtn-tripushkara', vara)), [[3, 7, 12, 16, 21, 25], [3, 7, 12, 16, 21, 25], [3, 7, 12, 16, 21, 25]]);
  assert.deepEqual([0, 2, 6].map(vara => nakshatrasOf('vtn-dvipushkara', vara)), [[5, 14, 23], [5, 14, 23], [5, 14, 23]]);
  assert.deepEqual(nakshatrasOf('vtn-tripushkara', 1), [], 'only the vāra of a malefic');
}

// ---------------------------------------------------------------------------
// Moments (worked by hand), the nakṣatras from 0
// ---------------------------------------------------------------------------
const names = (vara: number, tithi: number, nakshatra: number) => vtnYogasAt(vara, tithi, nakshatra).map(entry => entry.id);
{
  // Friday (5), the 6th tithi (a Nanda), Hasta (12): Siddha of Vāra/Tithi, nothing else of the lists with Hasta.
  assert.deepEqual(names(5, 6, 12), ['vt-siddha', 'vn-siddha']);
  // The full Moon on a Sunday in Chitra: Sunday and 15 is no VT yoga, Chitra on Sunday is Subha Madhyam.
  assert.deepEqual(names(0, 15, 13), ['vn-subha-madhyam']);
  // Tithi 12 on a Sunday is Dagdha, Hutasana and Krakacha at once, all three inauspicious Vāra/Tithi yogas.
  assert.deepEqual(vtnYogasAt(0, 12, 0).map(entry => entry.id).filter(id => id.startsWith('vt-')).sort(), ['vt-dagdha', 'vt-hutasana', 'vt-krakacha']);
  // The dark half counts the same: the 27th tithi is the 12th of the dark half.
  assert.equal(yoga('vt-dagdha').holds(0, 27, 0), true);
  assert.equal(yoga('vt-dagdha').holds(0, 12, 0), true);
  // Mars's Visha needs the full Moon itself, not the 15th of the dark half; Mars's Vinasa has it among its tithis.
  assert.equal(yoga('vtn-visha').holds(2, 15, 3), true, 'Tuesday, Purnima, Rohiṇī');
  assert.equal(yoga('vtn-visha').holds(2, 30, 3), false, 'Amāvasyā is not Purnima');
  assert.equal(yoga('vtn-vinasa').holds(2, 15, 5), true, 'Tuesday, Purnima, Punarvasu');
  assert.equal(yoga('vtn-vinasa').holds(2, 30, 5), false, 'Tuesday, Amāvasyā, Ardra: the 15th of the dark half is not among the tithis');
}

// ---------------------------------------------------------------------------
// The judgement: the strongest auspicious against the strongest inauspicious yoga
// ---------------------------------------------------------------------------
{
  const verdict = (vara: number, tithi: number, nakshatra: number) => vtnVerdict(vtnYogasAt(vara, tithi, nakshatra));
  // Tuesday (2), the 4th tithi (Rikta), Anuradha (16): the Yoga that dispels difficulties of Mars holds Anuradha, but not on a Rikta tithi; nothing else forms.
  assert.equal(verdict(2, 4, 16), 'none');
  // The same on the 5th tithi: the dispelling yoga (VN) is there, and the Dagdha of the 5th on Mars's vāra (VT) is the weaker kind: good.
  assert.deepEqual(vtnYogasAt(2, 5, 16).map(yoga => yoga.id).sort(), ['vn-dispel', 'vt-dagdha']);
  assert.equal(verdict(2, 5, 16), 'good');
  assert.equal(verdict(5, 6, 12), 'good', 'Friday, the 6th tithi, Hasta: Siddha (VT) and Siddha (VN)');
  // Tuesday (2), the 3rd tithi (a Jaya: Siddha VT), Mrigasira (4): Amrita (VN, auspicious) and Nasa (VN, inauspicious) of Mars: equally strong.
  assert.equal(verdict(2, 3, 4), 'mixed');
  // Saturday, the 6th tithi (Krakacha), Revati (26): Dagdha, Mṛtyu and Nāśa of Saturn with Revatī: only inauspicious yogas.
  assert.equal(verdict(6, 6, 26), 'bad');
  // The stronger kind prevails: Sunday and the 12th tithi are Dagdha, Hutasana, Krakacha (VT, 2); Sunday with Uttaraphalguni (11) is a Sarvartha Siddhi (VN, 6): good.
  assert.equal(verdict(0, 12, 11), 'good', 'with the VTN Siddha too');
  assert.equal(vtnVerdict([]), 'none');
}
