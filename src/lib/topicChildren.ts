import { navamshaSign } from './birthConditions';
import {
  SEVEN, debilitated, find, has, hemmedBy, houseOf, inEnemySign, isBenefic, isMalefic, isStrong, lordOfHouse, lordOfSign, maleficsIn, maleficsSeeing,
  signOf, signOfHouse, sees, seesSign, together, withMalefics, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Loss of children and its causes: Bṛhat Parāśara Horā Śāstra chapter 83 (111 verses). The chapter names eight causes of childlessness (the curse of a serpent, the father, the mother, a brother, a maternal uncle, a Brahmin, the wife, a departed spirit)
 * and gives for each a list of yogas and then the remedy. Each rule here is one yoga; the verses of its remedy are shown with it. The verses are the yogas of the text; they say that the loss of children is "from the curse", which a chart cannot show: the rules show only that the yoga is in the chart.
 * Readings: "malefic" and "benefic" as in the other topics (the nodes are malefics); "without strength" (bala-hīna) is a Ṣaḍbala under 1; "ill-placed" (duḥstha) is the 6th, 8th or 12th; "house of destruction" (nāśa) is the 8th or the 12th; "a malefic sign" is a sign of the Sun, Mars or Saturn;
 * "afflicted" is a malefic in the house or a malefic seeing it; the 6th is read as the house of kin (jñāti) and of the maternal uncle. In 83.8 "the Sun, Mars, Rāhu and Saturn strong in the 5th" is read as some of them there and those that have a measure strong.
 * Not judged: 83.1-6 (the questions), 83.13 and 83.104 (need Māndi), the remedies of 83.109-111 by graha, and the closing verses.
 */
type Cond = [string, boolean | null];
const L = (c: TopicContext, house: number) => lordOfHouse(c, house);
const at = (c: TopicContext, name: string, houses: number[]): boolean => has(houseOf(c, name), houses);
const DUSTHANA = [6, 8, 12];
const NASHA = [8, 12];
const weak = (c: TopicContext, name: string): boolean | null => { const strong = isStrong(c, name); return strong === null ? null : !strong; };
const fall = (c: TopicContext, name: string) => { const sign = signOf(c, name); return sign !== null && debilitated(name, sign); };
const malSign = (c: TopicContext, name: string) => { const sign = signOf(c, name); return sign !== null && ['Sun', 'Mars', 'Saturn'].includes(lordOfSign(sign)); };
const enemy = (c: TopicContext, name: string) => { const sign = signOf(c, name); return sign !== null && inEnemySign(name, sign); };
const navLord = (c: TopicContext, name: string) => { const planet = find(c, name); return planet ? lordOfSign(navamshaSign(planet.longitude)) : null; };
const afflicted = (c: TopicContext, house: number) => maleficsIn(c, house).length > 0 || SEVEN.some(name => isMalefic(c, name) && seesSign(c, name, signOfHouse(c, house)));
const hemmed = (c: TopicContext, sign: number | null) => sign !== null && hemmedBy(c, sign, name => isMalefic(c, name));
const joined = (c: TopicContext, a: string, b: string) => a !== b && together(c, a, b);
const withMal = (c: TopicContext, name: string) => withMalefics(c, name).length > 0;
const yes = (value: boolean | null) => value === null ? '?' : value ? 'yes' : 'no';

const SARPA = 'Loss of children from a serpent\'s curse. Remedy: the worship of the Nāga (a golden serpent, consecrated), and the gift of cows, land, sesame and gold.';
const PITRI = 'Loss of children from the father\'s curse. Remedy: the Gayā śrāddha, feeding Brahmins, the gift of a maiden and of a cow.';
const MATRI = 'Loss of children from the mother\'s curse. Remedy: a bath at Setu, a lakh of Gāyatrī, living on milk, silver gifts to the grahas, feeding Brahmins, circling the aśvattha 1008 times.';
const BHRATRI = 'Loss of children from the brother\'s curse. Remedy: hearing the tales of Hari, the Cāndrāyaṇa on the Kāverī, planting an aśvattha, ten cows and land.';
const MATULA = 'Loss of children from the maternal uncle\'s curse. Remedy: installing Viṣṇu, digging wells and tanks, honouring children and kin.';
const BRAHMA = 'Loss of sons from a Brahmin\'s curse. Remedy: the Cāndrāyaṇa, three Brahmakṛcchra, a bow with dakṣiṇā, five jewels with gold, feeding Brahmins.';
const PATNI = 'Loss of children from the wife\'s curse. Remedy: the gift of a maiden in marriage, or an image of Viṣṇu with Lakṣmī, a golden bed with ten cows to a Brahmin couple.';
const PRETA = 'Loss of children from the curse of a departed spirit. Remedy: the śrāddha at Gayā, a Rudrābhiṣeka, an image of Brahmā, a cow, a silver vessel and a sapphire.';

const yoga = (id: string, verses: number[], name: string, effect: string, rows: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `c83-${id}`, topic: 'children', chapter: 83, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = rows(c);
    const met = list.some(([, v]) => v === false) ? false : list.some(([, v]) => v === null) ? null : true;
    return { met, lines: [list.map(([label, v]) => `${label}: ${yes(v)}`).join('; ')] };
  },
});
const ritual = [17, 18, 19]; const father = [31, 32, 33]; const mother = [47, 48, 49, 50]; const brother = [62, 63, 64]; const uncle = [69, 70]; const brahmin = [79, 80, 81]; const wife = [93, 94, 95]; const preta = [106, 107, 108];

export const CHILDREN_RULES: TopicYogaRule[] = [
  yoga('general-weak', [7], 'Jupiter, the lagna lord, the 7th lord and the 5th lord all without strength', 'Childlessness is to be declared.', c => [
    ['Jupiter', weak(c, 'Jupiter')], [`the lagna lord ${L(c, 1)}`, weak(c, L(c, 1))], [`the 7th lord ${L(c, 7)}`, weak(c, L(c, 7))], [`the 5th lord ${L(c, 5)}`, weak(c, L(c, 5))],
  ]),
  yoga('general-strong-malefics', [8], 'The Sun, Mars, Rāhu or Saturn in the 5th (strong) and Jupiter without strength', 'Childlessness. (Read: some of the four in the 5th, those with a measure strong; the kāraka of children is Jupiter.)', c => {
    const there = ['Sun', 'Mars', 'Rahu', 'Saturn'].filter(name => at(c, name, [5]));
    const strongAll = there.filter(name => name !== 'Rahu').every(name => isStrong(c, name) === true);
    return [[`in the 5th: ${there.join(', ') || 'none'}`, there.length > 0], ['those with a measure strong', there.length === 0 ? false : strongAll], ['Jupiter without strength', weak(c, 'Jupiter')]];
  }),

  // ── the serpent's curse, 83.9-16 ──
  yoga('sarpa-9', [9, ...ritual], 'Rāhu in the 5th seen by Mars, or Rāhu in a sign of Mars', SARPA, c => [
    ['Rāhu in the 5th seen by Mars, or Rāhu in a sign of Mars', (at(c, 'Rahu', [5]) && sees(c, 'Mars', 'Rahu')) || (signOf(c, 'Rahu') !== null && lordOfSign(signOf(c, 'Rahu') ?? 1) === 'Mars')],
  ]),
  yoga('sarpa-10', [10, ...ritual], 'The 5th lord with Rāhu, Saturn in the 5th joined or seen by the Moon', SARPA, c => [
    ['the 5th lord with Rāhu', joined(c, L(c, 5), 'Rahu')], ['Saturn in the 5th', at(c, 'Saturn', [5])], ['the Moon with or seeing Saturn', together(c, 'Moon', 'Saturn') || sees(c, 'Moon', 'Saturn')],
  ]),
  yoga('sarpa-11', [11, ...ritual], 'Jupiter with Rāhu, the 5th lord without strength, the lagna lord with Mars', SARPA, c => [
    ['Jupiter with Rāhu', together(c, 'Jupiter', 'Rahu')], ['the 5th lord without strength', weak(c, L(c, 5))], ['the lagna lord with Mars', joined(c, L(c, 1), 'Mars')],
  ]),
  yoga('sarpa-12', [12, ...ritual], 'Jupiter with Mars, Rāhu in the lagna, the 5th lord ill-placed', SARPA, c => [
    ['Jupiter with Mars', together(c, 'Jupiter', 'Mars')], ['Rāhu in the lagna', at(c, 'Rahu', [1])], ['the 5th lord in the 6th, 8th or 12th', at(c, L(c, 5), DUSTHANA)],
  ]),
  yoga('sarpa-14', [14, ...ritual], 'The 5th a sign of Mars and its lord with Rāhu', SARPA + ' (Even with benefics seeing or joined.)', c => [
    ['the 5th a sign of Mars', lordOfSign(signOfHouse(c, 5)) === 'Mars'], ['the 5th lord with Rāhu', joined(c, L(c, 5), 'Rahu')],
  ]),
  yoga('sarpa-15', [15, ...ritual], 'The Sun and Saturn in the 5th, or the 5th lord the Sun, Mercury or Jupiter, with the 5th and lagna lords weak', SARPA, c => [
    ['the Sun and Saturn in the 5th, or the 5th lord the Sun, Mercury or Jupiter', (at(c, 'Sun', [5]) && at(c, 'Saturn', [5])) || ['Sun', 'Mercury', 'Jupiter'].includes(L(c, 5))],
    ['the 5th lord without strength', weak(c, L(c, 5))], ['the lagna lord without strength', weak(c, L(c, 1))],
  ]),
  yoga('sarpa-16', [16, ...ritual], 'The lagna lord with Rāhu and the 5th lord with Mars, or Jupiter with Rāhu', SARPA, c => {
    const first = joined(c, L(c, 1), 'Rahu') && joined(c, L(c, 5), 'Mars');
    return [['the lagna lord with Rāhu and the 5th lord with Mars, or Jupiter with Rāhu', first || together(c, 'Jupiter', 'Rahu')]];
  }),

  // ── the father's curse, 83.20-30 ──
  yoga('pitri-20', [20, ...father], 'The Sun in the 5th in its fall, in Saturn\'s navāṁśa, malefics on both sides', PITRI, c => [
    ['the Sun in the 5th', at(c, 'Sun', [5])], ['in its fall', fall(c, 'Sun')], ['in the navāṁśa of Saturn', navLord(c, 'Saturn') !== null && navLord(c, 'Sun') === 'Saturn'],
    ['malefics on both sides', hemmed(c, signOf(c, 'Sun'))],
  ]),
  yoga('pitri-21', [21, ...father], 'The 5th lord the Sun in a trine, with malefics, between malefics and seen by malefics', PITRI, c => [
    ['the 5th lord is the Sun', L(c, 5) === 'Sun'], ['in a trine (1st, 5th, 9th)', at(c, 'Sun', [1, 5, 9])], ['with malefics', withMal(c, 'Sun')], ['between malefics', hemmed(c, signOf(c, 'Sun'))], ['seen by malefics', maleficsSeeing(c, 'Sun').length > 0],
  ]),
  yoga('pitri-22', [22, ...father], 'Jupiter in a sign of the Sun, the 5th lord with the Sun, the 5th and the lagna afflicted', PITRI, c => [
    ['Jupiter in Leo', signOf(c, 'Jupiter') === 5], ['the 5th lord with the Sun', joined(c, L(c, 5), 'Sun')], ['the 5th afflicted', afflicted(c, 5)], ['the lagna afflicted', afflicted(c, 1)],
  ]),
  yoga('pitri-23', [23, ...father], 'The lagna lord weak in the 5th, the 5th lord with the Sun, malefics in the lagna and the 5th', PITRI, c => [
    ['the lagna lord weak in the 5th', at(c, L(c, 1), [5]) && weak(c, L(c, 1)) !== false], ['the 5th lord with the Sun', joined(c, L(c, 5), 'Sun')], ['malefics in the lagna', maleficsIn(c, 1).length > 0], ['malefics in the 5th', maleficsIn(c, 5).length > 0],
  ]),
  yoga('pitri-24', [24, ...father], 'The 9th lord in the 5th, or the 5th lord in the 10th, with the 5th and lagna afflicted', PITRI, c => [
    ['the 9th lord in the 5th or the 5th lord in the 10th', at(c, L(c, 9), [5]) || at(c, L(c, 5), [10])], ['the 5th afflicted', afflicted(c, 5)], ['the lagna afflicted', afflicted(c, 1)],
  ]),
  yoga('pitri-25', [25, ...father], 'Mars the 9th lord with the 5th lord, the lagna, 5th and 9th afflicted', PITRI, c => [
    ['the 9th lord is Mars', L(c, 9) === 'Mars'], ['with the 5th lord', joined(c, 'Mars', L(c, 5))], ['the lagna afflicted', afflicted(c, 1)], ['the 5th afflicted', afflicted(c, 5)], ['the 9th afflicted', afflicted(c, 9)],
  ]),
  yoga('pitri-26', [26, ...father], 'The 9th lord ill-placed, Jupiter in a malefic sign, the 5th and lagna lords with malefics', PITRI, c => [
    ['the 9th lord in the 6th, 8th or 12th', at(c, L(c, 9), DUSTHANA)], ['Jupiter in a sign of the Sun, Mars or Saturn', malSign(c, 'Jupiter')], ['the 5th lord with malefics', withMal(c, L(c, 5))], ['the lagna lord with malefics', withMal(c, L(c, 1))],
  ]),
  yoga('pitri-27', [27, ...father], 'The Sun, Mars and Saturn in the lagna and the 5th, Rāhu and Jupiter in the 8th and 12th', PITRI, c => [
    ['the Sun, Mars and Saturn in the 1st or 5th', ['Sun', 'Mars', 'Saturn'].every(name => at(c, name, [1, 5]))], ['Rāhu and Jupiter in the 8th and the 12th', (at(c, 'Rahu', [8]) && at(c, 'Jupiter', [12])) || (at(c, 'Rahu', [12]) && at(c, 'Jupiter', [8]))],
  ]),
  yoga('pitri-28', [28, ...father], 'The Sun in the 8th, Saturn in the 5th, the 5th lord with Rāhu, a malefic in the lagna', PITRI, c => [
    ['the Sun in the 8th', at(c, 'Sun', [8])], ['Saturn in the 5th', at(c, 'Saturn', [5])], ['the 5th lord with Rāhu', joined(c, L(c, 5), 'Rahu')], ['a malefic in the lagna', maleficsIn(c, 1).length > 0],
  ]),
  yoga('pitri-29', [29, ...father], 'The 12th lord in the lagna, the 8th lord in the 5th, the 9th lord in the 8th', PITRI, c => [
    ['the 12th lord in the lagna', at(c, L(c, 12), [1])], ['the 8th lord in the 5th', at(c, L(c, 8), [5])], ['the 9th lord in the 8th', at(c, L(c, 9), [8])],
  ]),
  yoga('pitri-30', [30, ...father], 'The 6th lord in the 5th, the 9th lord in an enemy sign, Jupiter with Rāhu', PITRI, c => [
    ['the 6th lord in the 5th', at(c, L(c, 6), [5])], ['the 9th lord in an enemy sign', enemy(c, L(c, 9))], ['Jupiter with Rāhu', together(c, 'Jupiter', 'Rahu')],
  ]),

  // ── the mother's curse, 83.34-46 ──
  yoga('matri-34', [34, ...mother], 'The Moon the 5th lord in its fall or between malefics, a malefic in the 4th or 5th', MATRI, c => [
    ['the 5th lord is the Moon', L(c, 5) === 'Moon'], ['in its fall or between malefics', fall(c, 'Moon') || hemmed(c, signOf(c, 'Moon'))], ['a malefic in the 4th or 5th', maleficsIn(c, 4).length + maleficsIn(c, 5).length > 0],
  ]),
  yoga('matri-35', [35, ...mother], 'Saturn in the 11th, a non-benefic in the 4th, the Moon in its fall in the 5th', MATRI, c => [
    ['Saturn in the 11th', at(c, 'Saturn', [11])], ['a non-benefic in the 4th', maleficsIn(c, 4).length > 0], ['the Moon in its fall in the 5th', fall(c, 'Moon') && at(c, 'Moon', [5])],
  ]),
  yoga('matri-36', [36, ...mother], 'The 5th lord ill-placed, the lagna lord in its fall, the Moon with a malefic', MATRI, c => [
    ['the 5th lord in the 6th, 8th or 12th', at(c, L(c, 5), DUSTHANA)], ['the lagna lord in its fall', fall(c, L(c, 1))], ['the Moon with a malefic', withMal(c, 'Moon')],
  ]),
  yoga('matri-37', [37, ...mother], 'The 5th lord in the 8th, 6th or 12th, the Moon in a malefic navāṁśa, the lagna and the 5th full of malefics', MATRI, c => [
    ['the 5th lord in the 8th, 6th or 12th', at(c, L(c, 5), DUSTHANA)], ['the Moon in the navāṁśa of the Sun, Mars or Saturn', ['Sun', 'Mars', 'Saturn'].includes(navLord(c, 'Moon') ?? '')], ['malefics in the lagna', maleficsIn(c, 1).length > 0], ['malefics in the 5th', maleficsIn(c, 5).length > 0],
  ]),
  yoga('matri-38', [38, ...mother], 'The Moon the 5th lord with Saturn, Rāhu and Mars in the 9th or the 5th', MATRI, c => [
    ['the 5th lord is the Moon', L(c, 5) === 'Moon'], ['with Saturn, Rāhu and Mars', ['Saturn', 'Rahu', 'Mars'].every(name => together(c, 'Moon', name))], ['in the 9th or 5th', at(c, 'Moon', [5, 9])],
  ]),
  yoga('matri-39', [39, ...mother], 'Mars the 4th lord with Saturn, Rāhu, the Moon and the Sun in the 5th or the lagna', MATRI, c => [
    ['the 4th lord is Mars', L(c, 4) === 'Mars'], ['with Saturn, Rāhu, the Moon and the Sun', ['Saturn', 'Rahu', 'Moon', 'Sun'].every(name => together(c, 'Mars', name))], ['in the 5th or the lagna', at(c, 'Mars', [1, 5])],
  ]),
  yoga('matri-40', [40, ...mother], 'The lagna and 5th lords in enemy signs, the 4th lord in the 8th, the 9th lord and a lord of destruction in the lagna', MATRI, c => [
    ['the lagna lord in an enemy sign', enemy(c, L(c, 1))], ['the 5th lord in an enemy sign', enemy(c, L(c, 5))], ['the 4th lord in the 8th', at(c, L(c, 4), [8])],
    ['the 9th lord in the lagna', at(c, L(c, 9), [1])], ['the 8th or 12th lord in the lagna', at(c, L(c, 8), [1]) || at(c, L(c, 12), [1])],
  ]),
  yoga('matri-41', [41, ...mother], 'The 6th and 8th lords in the lagna, the 4th lord in the 12th, the Moon and Jupiter with malefics in the 5th', MATRI, c => [
    ['the 6th and 8th lords in the lagna', at(c, L(c, 6), [1]) && at(c, L(c, 8), [1])], ['the 4th lord in the 12th', at(c, L(c, 4), [12])], ['the Moon and Jupiter in the 5th', at(c, 'Moon', [5]) && at(c, 'Jupiter', [5])], ['with a malefic', maleficsIn(c, 5).length > 0],
  ]),
  yoga('matri-42', [42, ...mother], 'The lagna between malefics, a waning Moon in the 7th, Rāhu and Saturn in the 4th and 5th', MATRI, c => [
    ['the lagna between malefics', hemmed(c, c.ascendantSign)], ['the Moon waning, in the 7th', !isBenefic(c, 'Moon') && at(c, 'Moon', [7])], ['Rāhu and Saturn in the 4th and the 5th', (at(c, 'Rahu', [4]) && at(c, 'Saturn', [5])) || (at(c, 'Rahu', [5]) && at(c, 'Saturn', [4]))],
  ]),
  yoga('matri-43', [43, ...mother], 'A lord of the 6th, 8th or 12th in the 5th, the 5th lord ill-placed, the Moon ill-placed', MATRI, c => [
    ['a lord of the 6th, 8th or 12th in the 5th', [6, 8, 12].some(house => at(c, L(c, house), [5]))], ['the 5th lord in the 8th or 12th', at(c, L(c, 5), NASHA)], ['the Moon in the 6th, 8th or 12th', at(c, 'Moon', DUSTHANA)],
  ]),
  yoga('matri-44', [44, ...mother], 'The lagna Cancer with Mars and Rāhu, the Moon and Saturn in the 5th', MATRI, c => [
    ['the lagna Cancer', c.ascendantSign === 4], ['Mars and Rāhu in the lagna', at(c, 'Mars', [1]) && at(c, 'Rahu', [1])], ['the Moon and Saturn in the 5th', at(c, 'Moon', [5]) && at(c, 'Saturn', [5])],
  ]),
  yoga('matri-45', [45, ...mother], 'Mars in the lagna, Rāhu in the 5th, the Sun in the 8th, Saturn in the 12th, the 4th and lagna lords ill-placed', MATRI, c => [
    ['Mars in the lagna', at(c, 'Mars', [1])], ['Rāhu in the 5th', at(c, 'Rahu', [5])], ['the Sun in the 8th', at(c, 'Sun', [8])], ['Saturn in the 12th', at(c, 'Saturn', [12])],
    ['the 4th lord ill-placed', at(c, L(c, 4), DUSTHANA)], ['the lagna lord ill-placed', at(c, L(c, 1), DUSTHANA)],
  ]),
  yoga('matri-46', [46, ...mother], 'Jupiter in the 8th or 12th with Mars and Rāhu, Saturn and the Moon in the 5th', MATRI, c => [
    ['Jupiter in the 8th or 12th', at(c, 'Jupiter', NASHA)], ['with Mars and Rāhu', together(c, 'Jupiter', 'Mars') && together(c, 'Jupiter', 'Rahu')], ['Saturn and the Moon in the 5th', at(c, 'Saturn', [5]) && at(c, 'Moon', [5])],
  ]),

  // ── the brother's curse, 83.52-61 ──
  yoga('bhratri-52', [52, ...brother], 'The 3rd lord in the 5th with Mars and Rāhu, the 5th and lagna lords in the 8th', BHRATRI, c => [
    ['the 3rd lord in the 5th', at(c, L(c, 3), [5])], ['with Mars and Rāhu', joined(c, L(c, 3), 'Mars') && joined(c, L(c, 3), 'Rahu')], ['the 5th and lagna lords in the 8th', at(c, L(c, 5), [8]) && at(c, L(c, 1), [8])],
  ]),
  yoga('bhratri-53', [53, ...brother], 'Mars in the lagna, Saturn in the 5th, the 3rd lord in the 9th, Jupiter in the 8th', BHRATRI, c => [
    ['Mars in the lagna', at(c, 'Mars', [1])], ['Saturn in the 5th', at(c, 'Saturn', [5])], ['the 3rd lord in the 9th', at(c, L(c, 3), [9])], ['Jupiter in the 8th', at(c, 'Jupiter', [8])],
  ]),
  yoga('bhratri-54', [54, ...brother], 'Jupiter in its fall in the 3rd, Saturn in the 5th, the Moon and Mars in the 12th', BHRATRI, c => [
    ['Jupiter in its fall in the 3rd', fall(c, 'Jupiter') && at(c, 'Jupiter', [3])], ['Saturn in the 5th', at(c, 'Saturn', [5])], ['the Moon and Mars in the 12th', at(c, 'Moon', [12]) && at(c, 'Mars', [12])],
  ]),
  yoga('bhratri-55', [55, ...brother], 'The lagna lord in the 12th, Mars in the 5th, the 5th lord with a malefic in the 8th', BHRATRI, c => [
    ['the lagna lord in the 12th', at(c, L(c, 1), [12])], ['Mars in the 5th', at(c, 'Mars', [5])], ['the 5th lord with a malefic in the 8th', at(c, L(c, 5), [8]) && withMal(c, L(c, 5))],
  ]),
  yoga('bhratri-56', [56, ...brother], 'The lagna and the 5th each between malefics, their lords ill-placed', BHRATRI, c => [
    ['the lagna between malefics', hemmed(c, c.ascendantSign)], ['the 5th between malefics', hemmed(c, signOfHouse(c, 5))], ['the lagna lord ill-placed', at(c, L(c, 1), DUSTHANA)], ['the 5th lord ill-placed', at(c, L(c, 5), DUSTHANA)],
  ]),
  yoga('bhratri-57', [57, ...brother], 'The 10th lord with a malefic in the 3rd, a benefic in the 5th with Mars', BHRATRI, c => [
    ['the 10th lord with a malefic in the 3rd', at(c, L(c, 10), [3]) && withMal(c, L(c, 10))], ['a benefic in the 5th with Mars', beneficIn5WithMars(c)],
  ]),
  yoga('bhratri-58', [58, ...brother], 'The 5th a sign of Mercury with Saturn and Rāhu in it, two malefics in the 12th', BHRATRI, c => [
    ['the 5th a sign of Mercury', lordOfSign(signOfHouse(c, 5)) === 'Mercury'], ['Saturn and Rāhu in the 5th', at(c, 'Saturn', [5]) && at(c, 'Rahu', [5])], ['two malefics in the 12th', maleficsIn(c, 12).length >= 2],
  ]),
  yoga('bhratri-59', [59, ...brother], 'The lagna lord in the 3rd, the 3rd lord in the 5th, a malefic in the lagna, 3rd or 5th', BHRATRI, c => [
    ['the lagna lord in the 3rd', at(c, L(c, 1), [3])], ['the 3rd lord in the 5th', at(c, L(c, 3), [5])], ['a malefic in the lagna, 3rd or 5th', [1, 3, 5].some(house => maleficsIn(c, house).length > 0)],
  ]),
  yoga('bhratri-60', [60, ...brother], 'The 3rd lord in the 8th, Jupiter in the 5th with Rāhu and Saturn and seen by malefics', BHRATRI, c => [
    ['the 3rd lord in the 8th', at(c, L(c, 3), [8])], ['Jupiter in the 5th with Rāhu and Saturn', at(c, 'Jupiter', [5]) && together(c, 'Jupiter', 'Rahu') && together(c, 'Jupiter', 'Saturn')], ['seen by malefics', maleficsSeeing(c, 'Jupiter').length > 0],
  ]),
  yoga('bhratri-61', [61, ...brother], 'The 12th lord in the 5th with the 3rd lord, the 8th with Mars and the Sun', BHRATRI, c => [
    ['the 12th lord in the 5th with the 3rd lord', at(c, L(c, 12), [5]) && joined(c, L(c, 12), L(c, 3))], ['Mars and the Sun in the 8th', at(c, 'Mars', [8]) && at(c, 'Sun', [8])],
  ]),

  // ── the maternal uncle's curse, 83.65-68 ──
  yoga('matula-65', [65, ...uncle], 'Mercury and Jupiter in the 5th with Mars and Rāhu, Saturn in the lagna', MATULA, c => [
    ['Mercury and Jupiter in the 5th', at(c, 'Mercury', [5]) && at(c, 'Jupiter', [5])], ['with Mars and Rāhu', at(c, 'Mars', [5]) && at(c, 'Rahu', [5])], ['Saturn in the lagna', at(c, 'Saturn', [1])],
  ]),
  yoga('matula-66', [66, ...uncle], 'The lagna and 5th lords in the 5th with Mercury, Mars and Saturn', MATULA, c => [
    ['the lagna lord in the 5th', at(c, L(c, 1), [5])], ['the 5th lord in the 5th', at(c, L(c, 5), [5])], ['Mercury, Mars and Saturn in the 5th', ['Mercury', 'Mars', 'Saturn'].every(name => at(c, name, [5]))],
  ]),
  yoga('matula-67', [67, ...uncle], 'The 5th lord lost in the lagna, Saturn in the 7th, the lagna lord with Mercury', 'Loss of children. (Read: "lost" as without strength.)', c => [
    ['the 5th lord in the lagna', at(c, L(c, 5), [1])], ['without strength', weak(c, L(c, 5))], ['Saturn in the 7th', at(c, 'Saturn', [7])], ['the lagna lord with Mercury', joined(c, L(c, 1), 'Mercury')],
  ]),
  yoga('matula-68', [68, ...uncle], 'The lord of the house of kin in the lagna with the 12th lord, the Moon, Mercury and Mars in the 5th', 'Loss of children. (Read: the house of kin as the 6th.)', c => [
    ['the 6th lord in the lagna with the 12th lord', at(c, L(c, 6), [1]) && joined(c, L(c, 6), L(c, 12))], ['the Moon, Mercury and Mars in the 5th', ['Moon', 'Mercury', 'Mars'].every(name => at(c, name, [5]))],
  ]),

  // ── the Brahmin's curse, 83.72-78 ──
  yoga('brahma-72', [72, ...brahmin], 'Rāhu in a sign of Jupiter, Jupiter, Mars and Saturn in the 5th, the 9th lord in the 8th or 12th', BRAHMA, c => [
    ['Rāhu in Sagittarius or Pisces', [9, 12].includes(signOf(c, 'Rahu') ?? 0)], ['Jupiter, Mars and Saturn in the 5th', ['Jupiter', 'Mars', 'Saturn'].every(name => at(c, name, [5]))], ['the 9th lord in the 8th or 12th', at(c, L(c, 9), NASHA)],
  ]),
  yoga('brahma-73', [73, ...brahmin], 'The 9th lord in the 5th, the 5th lord in the 8th or 12th with Jupiter, Mars and Rāhu', BRAHMA, c => [
    ['the 9th lord in the 5th', at(c, L(c, 9), [5])], ['the 5th lord in the 8th or 12th', at(c, L(c, 5), NASHA)], ['with Jupiter, Mars and Rāhu', ['Jupiter', 'Mars', 'Rahu'].every(name => joined(c, L(c, 5), name) || L(c, 5) === name)],
  ]),
  yoga('brahma-74', [74, ...brahmin], 'The 9th lord in its fall, the 12th lord in the 5th joined or seen by Rāhu', BRAHMA, c => [
    ['the 9th lord in its fall', fall(c, L(c, 9))], ['the 12th lord in the 5th', at(c, L(c, 12), [5])], ['with Rāhu', joined(c, L(c, 12), 'Rahu')],
  ]),
  yoga('brahma-75', [75, ...brahmin], 'Jupiter in its fall, Rāhu in the lagna or the 5th, the 5th lord ill-placed', BRAHMA, c => [
    ['Jupiter in its fall', fall(c, 'Jupiter')], ['Rāhu in the lagna or the 5th', at(c, 'Rahu', [1, 5])], ['the 5th lord ill-placed', at(c, L(c, 5), DUSTHANA)],
  ]),
  yoga('brahma-76', [76, ...brahmin], 'Jupiter the 5th lord in the 8th with a malefic, or the 5th lord with the Sun and Moon', BRAHMA, c => [
    ['Jupiter the 5th lord in the 8th with a malefic, or the 5th lord with the Sun and Moon', (L(c, 5) === 'Jupiter' && at(c, 'Jupiter', [8]) && withMal(c, 'Jupiter')) || (joined(c, L(c, 5), 'Sun') && joined(c, L(c, 5), 'Moon'))],
  ]),
  yoga('brahma-77', [77, ...brahmin], 'Jupiter in Saturn\'s navāṁśa with Saturn and Mars, the 5th lord in the 12th', BRAHMA, c => [
    ['Jupiter in the navāṁśa of Saturn', navLord(c, 'Jupiter') === 'Saturn'], ['with Saturn and Mars', together(c, 'Jupiter', 'Saturn') && together(c, 'Jupiter', 'Mars')], ['the 5th lord in the 12th', at(c, L(c, 5), [12])],
  ]),
  yoga('brahma-78', [78, ...brahmin], 'Saturn with Jupiter in the lagna, or with Rāhu in the 9th, or with Jupiter in the 12th', BRAHMA, c => [
    ['Saturn with Jupiter in the lagna or the 12th, or with Rāhu in the 9th', (at(c, 'Saturn', [1, 12]) && together(c, 'Saturn', 'Jupiter')) || (at(c, 'Saturn', [9]) && together(c, 'Saturn', 'Rahu'))],
  ]),

  // ── the wife's curse, 83.82-92 ──
  yoga('patni-82', [82, ...wife], 'The 7th lord in the 5th, Saturn lord of its navāṁśa, the 5th lord in the 8th or 12th', PATNI, c => [
    ['the 7th lord in the 5th', at(c, L(c, 7), [5])], ['Saturn lord of the navāṁśa of the 7th lord', navLord(c, L(c, 7)) === 'Saturn'], ['the 5th lord in the 8th or 12th', at(c, L(c, 5), NASHA)],
  ]),
  yoga('patni-83', [83, ...wife], 'The 7th and 5th lords in the 12th (or the 8th), the kāraka with a malefic', PATNI, c => [
    ['the 7th lord in the 8th or 12th', at(c, L(c, 7), NASHA)], ['the 5th lord in the 8th or 12th', at(c, L(c, 5), NASHA)], ['Jupiter with a malefic', withMal(c, 'Jupiter')],
  ]),
  yoga('patni-84', [84, ...wife], 'Venus in the 5th, the 7th lord in the 8th, Jupiter with a malefic', PATNI, c => [
    ['Venus in the 5th', at(c, 'Venus', [5])], ['the 7th lord in the 8th', at(c, L(c, 7), [8])], ['Jupiter with a malefic', withMal(c, 'Jupiter')],
  ]),
  yoga('patni-85', [85, ...wife], 'The 2nd with a malefic, the 7th lord in the 12th, the 5th with malefics', PATNI, c => [
    ['a malefic in the 2nd', maleficsIn(c, 2).length > 0], ['the 7th lord in the 12th', at(c, L(c, 7), [12])], ['malefics in the 5th', maleficsIn(c, 5).length > 0],
  ]),
  yoga('patni-86', [86, ...wife], 'Venus in the 9th, the 7th lord in the 8th or 12th, the lagna and the 5th afflicted', PATNI, c => [
    ['Venus in the 9th', at(c, 'Venus', [9])], ['the 7th lord in the 8th or 12th', at(c, L(c, 7), NASHA)], ['the lagna afflicted', afflicted(c, 1)], ['the 5th afflicted', afflicted(c, 5)],
  ]),
  yoga('patni-87', [87, ...wife], 'Venus the 9th lord, the 5th lord in an enemy sign, Jupiter, the lagna lord and the 7th lord ill-placed', PATNI, c => [
    ['the 9th lord is Venus', L(c, 9) === 'Venus'], ['the 5th lord in an enemy sign', enemy(c, L(c, 5))], ['Jupiter ill-placed', at(c, 'Jupiter', DUSTHANA)], ['the lagna lord ill-placed', at(c, L(c, 1), DUSTHANA)], ['the 7th lord ill-placed', at(c, L(c, 7), DUSTHANA)],
  ]),
  yoga('patni-88', [88, ...wife], 'The 5th a sign of Venus with Rāhu and the Moon, malefics in the 12th, the lagna and the 2nd', PATNI, c => [
    ['the 5th a sign of Venus', lordOfSign(signOfHouse(c, 5)) === 'Venus'], ['Rāhu and the Moon in the 5th', at(c, 'Rahu', [5]) && at(c, 'Moon', [5])], ['malefics in the 12th, the lagna and the 2nd', [12, 1, 2].every(house => maleficsIn(c, house).length > 0)],
  ]),
  yoga('patni-89', [89, ...wife], 'Saturn and Venus in the 7th, the 8th lord in the 5th with the Sun, Rāhu in the lagna', PATNI, c => [
    ['Saturn and Venus in the 7th', at(c, 'Saturn', [7]) && at(c, 'Venus', [7])], ['the 8th lord in the 5th with the Sun', at(c, L(c, 8), [5]) && joined(c, L(c, 8), 'Sun')], ['Rāhu in the lagna', at(c, 'Rahu', [1])],
  ]),
  yoga('patni-90', [90, ...wife], 'Mars in the 2nd, Jupiter in the 12th, Venus in the 5th with Saturn and Rāhu or seen by them', PATNI, c => [
    ['Mars in the 2nd', at(c, 'Mars', [2])], ['Jupiter in the 12th', at(c, 'Jupiter', [12])], ['Venus in the 5th', at(c, 'Venus', [5])], ['with or seen by Saturn and Rāhu', (together(c, 'Venus', 'Saturn') && together(c, 'Venus', 'Rahu')) || sees(c, 'Saturn', 'Venus')],
  ]),
  yoga('patni-91', [91, ...wife], 'The 2nd and 7th lords in the 12th, Mars in the 5th, Saturn in the lagna, Jupiter with malefics', PATNI, c => [
    ['the 2nd and 7th lords in the 12th', at(c, L(c, 2), [12]) && at(c, L(c, 7), [12])], ['Mars in the 5th', at(c, 'Mars', [5])], ['Saturn in the lagna', at(c, 'Saturn', [1])], ['Jupiter with malefics', withMal(c, 'Jupiter')],
  ]),
  yoga('patni-92', [92, ...wife], 'Rāhu in the lagna, Saturn in the 5th, Mars in the 9th, the 5th and 7th lords in the 8th', PATNI, c => [
    ['Rāhu in the lagna', at(c, 'Rahu', [1])], ['Saturn in the 5th', at(c, 'Saturn', [5])], ['Mars in the 9th', at(c, 'Mars', [9])], ['the 5th and 7th lords in the 8th', at(c, L(c, 5), [8]) && at(c, L(c, 7), [8])],
  ]),

  // ── the departed spirit's curse, 83.97-105 ──
  yoga('preta-97', [97, ...preta], 'Saturn and the Sun in the 5th, a weak Moon in the 7th, Rāhu in the lagna, Jupiter in the 12th', PRETA, c => [
    ['Saturn and the Sun in the 5th', at(c, 'Saturn', [5]) && at(c, 'Sun', [5])], ['a waning Moon in the 7th', !isBenefic(c, 'Moon') && at(c, 'Moon', [7])], ['Rāhu in the lagna', at(c, 'Rahu', [1])], ['Jupiter in the 12th', at(c, 'Jupiter', [12])],
  ]),
  yoga('preta-98', [98, ...preta], 'Saturn the 5th lord in the 8th or 12th, Mars in the lagna, Jupiter in the 8th or 12th', PRETA, c => [
    ['the 5th lord is Saturn', L(c, 5) === 'Saturn'], ['in the 8th or 12th', at(c, 'Saturn', NASHA)], ['Mars in the lagna', at(c, 'Mars', [1])], ['Jupiter in the 8th or 12th', at(c, 'Jupiter', NASHA)],
  ]),
  yoga('preta-99', [99, ...preta], 'A malefic in the lagna, the Sun in the 12th, Mars, Saturn and Mercury in the 5th, the 5th lord in the 8th', PRETA, c => [
    ['a malefic in the lagna', maleficsIn(c, 1).length > 0], ['the Sun in the 12th', at(c, 'Sun', [12])], ['Mars, Saturn and Mercury in the 5th', ['Mars', 'Saturn', 'Mercury'].every(name => at(c, name, [5]))], ['the 5th lord in the 8th', at(c, L(c, 5), [8])],
  ]),
  yoga('preta-100', [100, ...preta], 'Rāhu in the lagna, Saturn in the 5th, Jupiter in the 8th or 12th', PRETA, c => [
    ['Rāhu in the lagna', at(c, 'Rahu', [1])], ['Saturn in the 5th', at(c, 'Saturn', [5])], ['Jupiter in the 8th or 12th', at(c, 'Jupiter', NASHA)],
  ]),
  yoga('preta-101', [101, ...preta], 'Rāhu in the lagna, the Moon with Venus, Jupiter and Saturn, the lagna lord in the 8th', PRETA, c => [
    ['Rāhu in the lagna', at(c, 'Rahu', [1])], ['the Moon with Venus, Jupiter and Saturn', ['Venus', 'Jupiter', 'Saturn'].every(name => together(c, 'Moon', name))], ['the lagna lord in the 8th', at(c, L(c, 1), [8])],
  ]),
  yoga('preta-102', [102, ...preta], 'The 5th lord and Jupiter in their fall, seen by a planet in its fall', PRETA, c => [
    ['the 5th lord in its fall', fall(c, L(c, 5))], ['Jupiter in its fall', fall(c, 'Jupiter')], ['seen by a planet in its fall', SEVEN.some(name => name !== 'Jupiter' && fall(c, name) && sees(c, name, 'Jupiter'))],
  ]),
  yoga('preta-103', [103, ...preta], 'Saturn in the lagna, Rāhu in the 5th, a planet in the 8th with the Sun, one in the 12th with Mars', PRETA, c => [
    ['Saturn in the lagna', at(c, 'Saturn', [1])], ['Rāhu in the 5th', at(c, 'Rahu', [5])], ['a planet in the 8th with the Sun', c.planets.some(p => p.name !== 'Sun' && at(c, p.name, [8]) && at(c, 'Sun', [8]))],
    ['a planet in the 12th with Mars', c.planets.some(p => p.name !== 'Mars' && at(c, p.name, [12]) && at(c, 'Mars', [12]))],
  ]),
  yoga('preta-105', [105, ...preta], 'The 8th lord in the 5th, the 5th with Saturn and Venus, Jupiter in the 8th or 12th', PRETA, c => [
    ['the 8th lord in the 5th', at(c, L(c, 8), [5])], ['Saturn and Venus in the 5th', at(c, 'Saturn', [5]) && at(c, 'Venus', [5])], ['Jupiter in the 8th or 12th', at(c, 'Jupiter', NASHA)],
  ]),
];

function beneficIn5WithMars(c: TopicContext) {
  return at(c, 'Mars', [5]) && c.planets.some(p => p.name !== 'Mars' && at(c, p.name, [5]) && isBenefic(c, p.name));
}
