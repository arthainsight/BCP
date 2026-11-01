import { combustionOf } from './combustion';
import { navamshaSign } from './birthConditions';
import { DUSTHANA, at, enemy, fall, hemmed, joined, weak, yes, type Cond } from './topicChildren';
import {
  SEVEN, beneficsSeeingSign, find, grahasInHouse, isBenefic, isMalefic, lordOfHouse, lordOfSign, sees, seesSign, signName, signOf, signOfHouse, together, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Chapter 12 of the Phaladīpikā of Mantreśvara (santāna-cintā, 34 verses): children. The rules are the yogas of children, of their loss and delay, of the adopted son, of the son or the daughter and of the seed and the field.
 * Readings: "malefic" and "benefic" as in the other topics; "well placed" is not in the 6th, 8th or 12th from the lagna; "weak" is a Ṣaḍbala under 1; the 5th from the lagna, the Moon and Jupiter are counted by whole signs.
 * From the Sanskrit, not the commentaries: in 12.3 the loss of sons is when the 5th is a sign of a benefic and a malefic is in it (the Hindi and the English have the benefic in the 5th); in 12.4 the Sun is in a sign of few sons (the commentaries put it in the 5th);
 * in 12.10 the Sun is the fourth graha with the 5th lord, Jupiter and Mars. Māndi and Gulika are not in the chart data, so what asks for them (12.8, 12.22) is tried without them and the rule says so.
 * Not judged: 12.12-13 (conception, the number of children), 12.15-18 (the tithi and its remedies), 12.19-21 (the cause by the graha that afflicts the 5th), 12.23-24 (remedies), 12.25-34 (the time of the son and the conception lagna, which need the daśā, the transits and the lagna of conception).
 */
const rule = (id: string, verses: number[], name: string, effect: string, rows: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p12-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 12, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = rows(c);
    const met = list.some(([, v]) => v === false) ? false : list.some(([, v]) => v === null) ? null : true;
    return { met, lines: [list.map(([label, v]) => `${label}: ${yes(v)}`).join('; ')] };
  },
});
/** An alternative: a rule that holds when any one of its parts holds. */
const either = (id: string, verses: number[], name: string, effect: string, parts: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p12-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 12, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = parts(c);
    const met = list.some(([, v]) => v === true) ? true : list.some(([, v]) => v === null) ? null : false;
    return { met, lines: list.map(([label, v]) => `${label}: ${yes(v)}`) };
  },
});

const L = (c: TopicContext, house: number) => lordOfHouse(c, house);
const fifthOf = (sign: number) => ((sign + 3) % 12) + 1;
const inSign = (c: TopicContext, sign: number) => c.planets.filter(p => p.sign === sign).map(p => p.name);
const beneficsOn = (c: TopicContext, sign: number) => [...new Set([...inSign(c, sign).filter(name => isBenefic(c, name)), ...beneficsSeeingSign(c, sign)])];
const maleficsOn = (c: TopicContext, sign: number) => [...new Set([...inSign(c, sign).filter(name => isMalefic(c, name)), ...SEVEN.filter(name => isMalefic(c, name) && seesSign(c, name, sign))])];
const lagnaSign = (c: TopicContext) => c.ascendantSign;
const sumLongitude = (c: TopicContext, names: string[]): number | null => {
  const planets = names.map(name => find(c, name));
  return planets.some(p => !p) ? null : planets.reduce((total, p) => total + (p?.longitude ?? 0), 0) % 360;
};
const evenOdd = (longitude: number) => ({ sign: Math.floor(longitude / 30) + 1, nav: navamshaSign(longitude) });
const ALPASUTA = [8, 2, 6, 5];
const isCombust = (c: TopicContext, name: string) => { const body = find(c, name); const sun = find(c, 'Sun'); return Boolean(body && sun && name !== 'Sun' && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null); };

const seedField = (id: string, verses: number[], name: string, names: string[], wanted: 'even' | 'odd', mixedToo: boolean, effect: string) => rule(id, verses, name, effect, c => {
  const total = sumLongitude(c, names);
  if (total === null) return [['a graha is missing', null]];
  const { sign, nav } = evenOdd(total);
  const parity = (value: number) => (value % 2 === 0 ? 'even' : 'odd');
  const both = parity(sign) === wanted && parity(nav) === wanted;
  const one = (parity(sign) === wanted) !== (parity(nav) === wanted);
  return [[`the sum of ${names.join(', ')} is in ${signName(sign)} (${parity(sign)}) and its navāṁśa is ${signName(nav)} (${parity(nav)})`, mixedToo ? one : both]];
});

export const PHALA_CHILDREN_RULES: TopicYogaRule[] = [
  rule('children-yoga', [1], 'The 5th lords and Jupiter well placed, the 5ths with benefics, the lagna lord and the 5th lord connected', 'Children are gained.', c => {
    const moon = find(c, 'Moon');
    if (!moon) return [['the Moon is missing', null]];
    const fifthLagna = fifthOf(lagnaSign(c)); const fifthMoon = fifthOf(moon.sign);
    const lord1 = L(c, 1); const lord5 = lordOfSign(fifthLagna); const lord5m = lordOfSign(fifthMoon);
    const wellPlaced = [lord5, lord5m, 'Jupiter'].every(name => !at(c, name, DUSTHANA));
    const connected = joined(c, lord1, lord5) || sees(c, lord1, lord5) || sees(c, lord5, lord1) || (signOf(c, lord1) === fifthLagna && signOf(c, lord5) === lagnaSign(c));
    return [
      [`the 5th lords from the lagna (${lord5}) and the Moon (${lord5m}) and Jupiter not in the 6th, 8th or 12th`, wellPlaced],
      ['benefics joined to or seeing the 5th from the lagna', beneficsOn(c, fifthLagna).length > 0], ['and the 5th from the Moon', beneficsOn(c, fifthMoon).length > 0],
      ['the lagna lord and the 5th lord joined, in aspect or exchanging', connected],
    ];
  }),
  rule('no-children', [2], 'The 5ths from the lagna, the Moon and Jupiter afflicted, between malefics, their lords in the 6th, 8th or 12th', 'No children.', c => {
    const moon = find(c, 'Moon'); const jupiter = find(c, 'Jupiter');
    if (!moon || !jupiter) return [['the Moon or Jupiter is missing', null]];
    const signs = [lagnaSign(c), moon.sign, jupiter.sign].map(fifthOf);
    return [
      ['malefics in or seeing each of the three 5ths', signs.every(s => maleficsOn(c, s).length > 0)], ['no benefic in or seeing them', signs.every(s => beneficsOn(c, s).length === 0)],
      ['each between malefics', signs.every(s => hemmed(c, s))], ['their lords in the 6th, 8th or 12th', signs.every(s => has6812(c, lordOfSign(s)))],
    ];
  }),
  rule('malefic-own-5th', [3], 'A malefic in its own sign in the 5th', 'Children; with another malefic in it, many sons.', c => {
    const found = grahasInHouse(c, 5).filter(name => isMalefic(c, name) && SEVEN.includes(name as (typeof SEVEN)[number]) && lordOfSign(signOfHouse(c, 5)) === name);
    return [[`a malefic in its own sign in the 5th: ${found.join(', ') || 'none'}${found.length && grahasInHouse(c, 5).some(n => n !== found[0] && isMalefic(c, n)) ? ' (with another malefic: many sons)' : ''}`, found.length > 0]];
  }),
  rule('benefic-sign-malefic', [3], 'The 5th a sign of a benefic with a malefic in it', 'Loss of sons. (From the Sanskrit; the Hindi and the English put the benefic in the 5th.)', c => [
    ['the 5th is a sign of a benefic', isBenefic(c, lordOfSign(signOfHouse(c, 5)))], ['a malefic in the 5th', grahasInHouse(c, 5).some(name => isMalefic(c, name))],
  ]),
  rule('alpasuta-5th', [3], 'The 5th Scorpio, Taurus, Virgo or Leo', 'Few sons, and late.', c => [[`the 5th is ${signName(signOfHouse(c, 5))}`, ALPASUTA.includes(signOfHouse(c, 5))]]),
  either('late-children', [4], 'Three yogas of children late and by effort', 'Children after a long time and by effort.', c => {
    const sun = signOf(c, 'Sun'); const jupiter = signOf(c, 'Jupiter');
    return [
      ['the Sun in a sign of few sons, Saturn in the 8th, Mars in the lagna', sun !== null && ALPASUTA.includes(sun) && at(c, 'Saturn', [8]) && at(c, 'Mars', [1])],
      ['Saturn in the lagna, Jupiter in the 8th, Mars in the 12th, the 5th a sign of few sons', at(c, 'Saturn', [1]) && at(c, 'Jupiter', [8]) && at(c, 'Mars', [12]) && ALPASUTA.includes(signOfHouse(c, 5))],
      ['the Moon in the 11th, a malefic in the 5th from Jupiter, three or more grahas in the lagna', at(c, 'Moon', [11]) && jupiter !== null && maleficsOn(c, fifthOf(jupiter)).length > 0 && grahasInHouse(c, 1).length >= 3],
    ];
  }),
  rule('cancer-5th', [5], 'The 5th Cancer with a graha in it', 'The Sun alone, Mars or Venus: children by a second wife; Saturn: many sons; the Moon or Mercury: few; Jupiter: many daughters.', c => {
    const here = grahasInHouse(c, 5).filter(name => SEVEN.includes(name as (typeof SEVEN)[number]));
    const result = [here.length === 1 && here[0] === 'Sun' ? 'the Sun alone: a second wife' : '', ['Mars', 'Venus'].filter(n => here.includes(n)).map(n => `${n}: a second wife`).join(', '), here.includes('Saturn') ? 'Saturn: many sons' : '', ['Moon', 'Mercury'].filter(n => here.includes(n)).map(n => `${n}: few`).join(', '), here.includes('Jupiter') ? 'Jupiter: many daughters' : ''].filter(Boolean);
    return [[`the 5th is Cancer: ${yes(signOfHouse(c, 5) === 4)}; ${result.join('; ') || 'no graha that the verse names'}`, signOfHouse(c, 5) === 4 && result.length > 0]];
  }),
  either('lineage-ends', [6], 'Four yogas of the end of the line', 'The family line is cut off.', c => [
    ['a malefic in the 4th, Venus in the 7th, the Moon in the 10th', maleficsIn4(c) && at(c, 'Venus', [7]) && at(c, 'Moon', [10])],
    ['malefics in the 12th, 8th, 5th and lagna', [12, 8, 5, 1].every(house => grahasInHouse(c, house).some(name => isMalefic(c, name)))],
    ['Venus and Mercury in the 7th, Jupiter in the 5th, the 4th afflicted', at(c, 'Venus', [7]) && at(c, 'Mercury', [7]) && at(c, 'Jupiter', [5]) && maleficsOn(c, signOfHouse(c, 4)).length > 0],
    ['the Moon in the 5th, malefics in the 8th, 12th and lagna', at(c, 'Moon', [5]) && [8, 12, 1].every(house => grahasInHouse(c, house).some(name => isMalefic(c, name)))],
  ]),
  rule('sonless', [7], 'A malefic in the lagna, the lagna lord in the 5th, the 5th lord in the 3rd, the Moon in the 4th', 'Without sons.', c => [
    ['a malefic in the lagna', grahasInHouse(c, 1).some(name => isMalefic(c, name))], ['the lagna lord in the 5th', at(c, L(c, 1), [5])], ['the 5th lord in the 3rd', at(c, L(c, 5), [3])], ['the Moon in the 4th', at(c, 'Moon', [4])],
  ]),
  rule('moon-odd-navamsha', [7], 'The Moon in the 5th in the navāṁśa of an odd sign, seen by the Sun', 'Sorrow through a son.', c => {
    const moon = find(c, 'Moon');
    return [['the Moon in the 5th', at(c, 'Moon', [5])], ['in the navāṁśa of an odd sign', moon !== undefined && navamshaSign(moon.longitude) % 2 === 1], ['seen by the Sun', sees(c, 'Sun', 'Moon')]];
  }),
  either('adopted-son', [8], 'The 5th a sign of Saturn or Mercury with Saturn, or the 5th lord weak and unconnected', 'An adopted son.', c => {
    const lord1 = L(c, 1); const lord5 = L(c, 5); const lord7 = L(c, 7);
    const connected = (a: string, b: string) => a === b || joined(c, a, b) || sees(c, a, b) || sees(c, b, a);
    return [
      ['the 5th is Gemini, Virgo, Capricorn or Aquarius with Saturn in it or seeing it (Māndi is not tried)', [3, 6, 10, 11].includes(signOfHouse(c, 5)) && (at(c, 'Saturn', [5]) || seesSign(c, 'Saturn', signOfHouse(c, 5)))],
      ['the 5th lord weak and unconnected with the lords of the lagna and the 7th', weak(c, lord5) === null ? null : weak(c, lord5) === true && !connected(lord5, lord1) && !connected(lord5, lord7)],
    ];
  }),
  either('5th-lord-lost', [9], 'The 5th lord fallen, in an enemy sign, combust, or with the lords of the 6th, 8th or 12th; or alone in the 5th', 'Loss of the son.', c => {
    const lord5 = L(c, 5);
    const benefic = SEVEN.some(name => isBenefic(c, name) && name !== lord5 && sees(c, name, lord5));
    return [
      ['the 5th lord in its fall, in an enemy sign or combust', fall(c, lord5) || enemy(c, lord5) || isCombust(c, lord5)],
      ['the 5th lord with the lord of the 6th, 8th or 12th', [6, 8, 12].some(house => joined(c, lord5, L(c, house)))],
      ['the 5th lord in the 5th and no benefic seeing it', at(c, lord5, [5]) && !benefic],
    ];
  }),
  rule('many-sons', [10], 'The 5th lord, Jupiter, Mars and the Sun all in the navāṁśa of an odd sign', 'Many sons; good sons by the strength of the 5th lord.', c => {
    const odd = (name: string) => { const planet = find(c, name); return planet !== undefined && navamshaSign(planet.longitude) % 2 === 1; };
    return [[`the 5th lord ${L(c, 5)}, Jupiter, Mars and the Sun in odd navāṁśas`, [L(c, 5), 'Jupiter', 'Mars', 'Sun'].every(odd)]];
  }),
  rule('son', [11], 'The 5th lord in a male sign and navāṁśa, joined or seen by male grahas', 'A son is born.', c => {
    const lord5 = L(c, 5); const planet = find(c, lord5);
    const male = ['Sun', 'Mars', 'Jupiter'].filter(name => name !== lord5 && (together(c, lord5, name) || sees(c, name, lord5)));
    return [[`the 5th lord ${lord5} in an odd sign and an odd navāṁśa`, planet !== undefined && planet.sign % 2 === 1 && navamshaSign(planet.longitude) % 2 === 1], [`joined or seen by ${male.join(', ') || 'no male graha'}`, male.length > 0]];
  }),
  rule('daughter', [11], 'The 5th lord in a female sign and navāṁśa, joined or seen by female grahas', 'A daughter is born.', c => {
    const lord5 = L(c, 5); const planet = find(c, lord5);
    const female = ['Venus', 'Moon'].filter(name => name !== lord5 && (together(c, lord5, name) || sees(c, name, lord5)));
    return [[`the 5th lord ${lord5} in an even sign and an even navāṁśa`, planet !== undefined && planet.sign % 2 === 0 && navamshaSign(planet.longitude) % 2 === 0], [`joined or seen by ${female.join(', ') || 'no female graha'}`, female.length > 0]];
  }),
  seedField('field-woman', [14], 'The sum of Jupiter, the Moon and Mars in an even sign and navāṁśa (a woman)', ['Jupiter', 'Moon', 'Mars'], 'even', false, 'The strength of the field: she bears children. (The verse speaks of a woman\'s chart.)'),
  seedField('field-woman-effort', [14], 'The sum of Jupiter, the Moon and Mars in a sign and navāṁśa of mixed kind (a woman)', ['Jupiter', 'Moon', 'Mars'], 'even', true, 'The fruit by effort. (The verse speaks of a woman\'s chart.)'),
  seedField('seed-man', [14], 'The sum of the Sun, Venus and Jupiter in an odd sign and navāṁśa (a man)', ['Sun', 'Venus', 'Jupiter'], 'odd', false, 'The strength of the seed: he begets children. (The verse speaks of a man\'s chart.)'),
  seedField('seed-man-effort', [14], 'The sum of the Sun, Venus and Jupiter in a sign and navāṁśa of mixed kind (a man)', ['Sun', 'Venus', 'Jupiter'], 'odd', true, 'The fruit by effort. (The verse speaks of a man\'s chart.)'),
  rule('serpent-curse', [22], 'Rāhu in the 5th with the 5th lord', 'The curse of a serpent is behind the want of sons.', c => [['Rāhu in the 5th', at(c, 'Rahu', [5])], ['with the 5th lord', joined(c, 'Rahu', L(c, 5))]]),
  rule('brahmin-curse', [22], 'Ketu in the 5th', 'The curse of a Brahmin is behind the want of sons.', c => [['Ketu in the 5th', at(c, 'Ketu', [5])]]),
];

function has6812(c: TopicContext, name: string) { return at(c, name, DUSTHANA); }
function maleficsIn4(c: TopicContext) { return grahasInHouse(c, 4).some(name => isMalefic(c, name)); }
