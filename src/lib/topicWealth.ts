import { navamshaSign } from './birthConditions';
import { calculateCharaKarakas } from './karakas';
import { EXALTATION, MOOLATRIKONA, OWN_SIGNS } from './dignity';
import {
  SEVEN, aspectsSign, cannot, debilitated, find, grahasInHouse, houseOf, houseOfSign, inEnemySign, isBenefic, isMalefic, isStrong, lordHouse, lordOfHouse, lordOfSign, ordinalEn,
  ownOrExalted, signName, signOf, signOfHouse, together, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Royal yogas, wealth and poverty: Bṛhat Parāśara Horā Śāstra chapter 39 (the rāja yogas, 48 verses), 40 (the minister, 15), 41 (the dhana yogas, 34) and 42 (the daridra yogas, 18).
 * Readings that the text does not settle are named in the rule: the "māraka lord" is the lord of the 2nd or the 7th (chapter 44); the "kāraka" of chapter 40 is the Amātyakāraka of the eight-karaka scheme
 * (ranked by degree in the sign); "joined" is in one sign and "seen" is by the aspects of the topic yogas (whole signs, Rāhu and Ketu do not aspect). Where a verse names several grahas as one thing, "one of them" is read.
 * Not judged: what needs the ārūḍha, the pada or the kāraka of the older reading (39.3–5, 39.8–10, 39.12–16, 39.22–27, 39.29, 39.31–32, 39.40, 40.3, 40.7, 40.11, 42.14–15), what the verse leaves open
 * (39.21's benefics in the kendras, 42.6, 42.12 give no number or no connective), and the divisions of 41.18–34.
 */
const rule = (chapter: number, id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'wealth', chapter, verses, name, effect, evaluate });

const KENDRA = [1, 4, 7, 10]; const TRIKONA = [1, 5, 9]; const TRIKA = [6, 8, 12];
const has = (house: number | null, list: number[]) => house !== null && list.includes(house);
const where = (context: TopicContext, name: string) => { const house = houseOf(context, name); return house === null ? `${name} (missing)` : `${name} in the ${ordinalEn(house)}`; };
const lord = (context: TopicContext, house: number) => lordOfHouse(context, house);
/** Whether `from` aspects the sign of `to` (only the seven grahas aspect). */
const sees = (context: TopicContext, from: string, to: string) => {
  const a = find(context, from); const b = find(context, to);
  return Boolean(a && b && (SEVEN as readonly string[]).includes(from) && from !== to && aspectsSign(from, a.sign, b.sign));
};
const seesSign = (context: TopicContext, from: string, sign: number) => {
  const a = find(context, from);
  return Boolean(a && (SEVEN as readonly string[]).includes(from) && aspectsSign(from, a.sign, sign));
};
const joinedOrSeen = (context: TopicContext, target: string, by: string) => by !== target && (together(context, target, by) || sees(context, by, target));
const ownNavamsha = (context: TopicContext, name: string) => { const body = find(context, name); return Boolean(body && OWN_SIGNS[name]?.includes(navamshaSign(body.longitude))); };
const dignified = (context: TopicContext, name: string) => { const sign = signOf(context, name); return sign !== null && ownOrExalted(name, sign); };
const beneficsSeeing = (context: TopicContext, name: string) => SEVEN.filter(other => other !== name && isBenefic(context, other) && sees(context, other, name));
const mixed = (items: string[]) => (items.length ? items.join(', ') : 'none');
/** The lords of the 2nd and 7th, the māraka lords (chapter 44). */
const marakas = (context: TopicContext): string[] => [...new Set([lord(context, 2), lord(context, 7)])];
const withMaraka = (context: TopicContext, name: string) => marakas(context).filter(maraka => joinedOrSeen(context, name, maraka));
/** The Amātyakāraka and the Ātmakāraka of the eight-karaka scheme. */
const karakas = (context: TopicContext) => {
  const list = calculateCharaKarakas(context.planets, 'degree', 8);
  return { amk: list.find(item => item.karaka === 'AmK')?.planet ?? null, ak: list.find(item => item.karaka === 'AK')?.planet ?? null };
};
const MINISTER_NOTE = 'the Amātyakāraka of the eight-karaka scheme, ranked by degree in the sign';
const benefics = (context: TopicContext) => context.planets.map(planet => planet.name).filter(name => isBenefic(context, name));
const malefics = (context: TopicContext) => context.planets.map(planet => planet.name).filter(name => isMalefic(context, name));
const exaltedNow = (context: TopicContext, name: string) => signOf(context, name) === EXALTATION[name];

// ── chapter 41's tables ───────────────────────────────────────────────────────────────────────────────────────
/** 41.2–8: a 5th house in a sign of X with X in it, and these grahas in the 11th. */
const DHANA_FIFTH: [number, string, string[]][] = [
  [2, 'Venus', ['Mars']], [3, 'Mercury', ['Moon', 'Mars', 'Jupiter']], [4, 'Sun', ['Saturn', 'Moon', 'Jupiter']], [5, 'Saturn', ['Sun', 'Moon']],
  [6, 'Jupiter', ['Mercury']], [7, 'Mars', ['Venus']], [8, 'Moon', ['Saturn']],
];
/** 41.9–15: a lagna in a sign of X with X in it, joined or seen by these grahas. */
const DHANA_LAGNA: [number, string, string[]][] = [
  [9, 'Sun', ['Mars', 'Jupiter']], [10, 'Moon', ['Mercury', 'Jupiter']], [11, 'Mars', ['Mercury', 'Venus', 'Saturn']], [12, 'Mercury', ['Saturn', 'Jupiter']],
  [13, 'Jupiter', ['Mercury', 'Mars']], [14, 'Venus', ['Saturn', 'Mercury']], [15, 'Saturn', ['Mars', 'Jupiter']],
];

export const WEALTH_RULES: TopicYogaRule[] = [
  // ── chapter 39: the rāja yogas ──
  rule(39, 'exchange-1-5', [6], 'The lagna lord in the 5th and the 5th lord in the lagna', 'A royal yoga. (The verse adds the kārakas of children and of the self in the lagna and the 5th; that half is not tested.)', context => {
    const a = lordHouse(context, 1); const b = lordHouse(context, 5);
    return { met: a === 5 && b === 1, lines: [`${where(context, lord(context, 1))}; ${where(context, lord(context, 5))}`] };
  }),
  rule(39, 'maharaja', [6, 7], 'The exchange of the lagna and 5th lords, both exalted or in their own navāṁśa, seen by benefics', 'The Mahārāja yoga: famous and happy.', context => {
    const l1 = lord(context, 1); const l5 = lord(context, 5);
    const exchange = lordHouse(context, 1) === 5 && lordHouse(context, 5) === 1;
    if (!exchange) return { met: false, lines: ['The lagna and 5th lords are not in each other\'s houses (39.6)'] };
    const placed = [l1, l5].map(name => ({ name, strong: dignified(context, name) || ownNavamsha(context, name), seen: beneficsSeeing(context, name) }));
    return { met: placed.every(item => item.strong && item.seen.length > 0), lines: placed.map(item => `${item.name}: ${item.strong ? 'exalted, own sign or own navāṁśa' : 'not exalted nor in own sign or navāṁśa'}; seen by ${mixed(item.seen)}`) };
  }),
  rule(39, 'venus-jupiter-moon', [11], 'Venus in its own navāṁśa or the 5th, joined or seen by Jupiter and the Moon', 'Of the royal class. (The alternative of the lagna and its pada is not tested.)', context => {
    const venus = find(context, 'Venus');
    if (!venus) return cannot('Venus is missing');
    const place = ownNavamsha(context, 'Venus') || houseOf(context, 'Venus') === 5;
    const with_ = ['Jupiter', 'Moon'].filter(name => joinedOrSeen(context, 'Venus', name));
    return { met: place && with_.length === 2, lines: [`${where(context, 'Venus')}${ownNavamsha(context, 'Venus') ? ', in its own navāṁśa' : ''}; joined or seen by ${mixed(with_)}`] };
  }),
  rule(39, 'benefic-lagna-2nd', [17], 'Benefics in the lagna and the 2nd, a malefic in the 3rd, a benefic in the 4th', 'A king, or equal to one. (Read as grahas standing in those houses.)', context => {
    const isIn = (house: number, kind: (name: string) => boolean) => grahasInHouse(context, house).filter(kind);
    const b1 = isIn(1, name => isBenefic(context, name)); const b2 = isIn(2, name => isBenefic(context, name));
    const m3 = isIn(3, name => isMalefic(context, name)); const b4 = isIn(4, name => isBenefic(context, name));
    return { met: b1.length > 0 && b2.length > 0 && m3.length > 0 && b4.length > 0, lines: [`1st: ${mixed(b1)}; 2nd: ${mixed(b2)}; 3rd malefics: ${mixed(m3)}; 4th: ${mixed(b4)}`] };
  }),
  rule(39, 'exalted-in-2nd', [18], 'The Moon, Jupiter, Venus or Mercury exalted in the 2nd', 'Prosperity.', context => {
    const found = ['Moon', 'Jupiter', 'Venus', 'Mercury'].filter(name => houseOf(context, name) === 2 && exaltedNow(context, name));
    return { met: found.length > 0, lines: [found.length ? `${found.join(', ')} exalted in the 2nd` : 'None of them is exalted in the 2nd'] };
  }),
  rule(39, 'debilitated-3-6-8', [19], 'Grahas in debilitation in the 3rd, 6th or 8th, and the lagna lord in its own or exaltation sign aspecting the lagna', 'A royal yoga.', context => {
    const weak = context.planets.filter(planet => debilitated(planet.name, planet.sign) && has(houseOfSign(context, planet.sign), [3, 6, 8])).map(planet => planet.name);
    const l1 = lord(context, 1);
    const ok = dignified(context, l1) && seesSign(context, l1, context.ascendantSign);
    return { met: weak.length > 0 && ok, lines: [`Debilitated in the 3rd, 6th or 8th: ${mixed(weak)}; the lagna lord ${l1} is ${dignified(context, l1) ? 'in its own or exaltation sign' : 'not in its own or exaltation sign'} and ${seesSign(context, l1, context.ascendantSign) ? 'aspects' : 'does not aspect'} the lagna`] };
  }),
  rule(39, 'trika-lords-weak', [20], 'The lords of the 6th, 8th and 12th debilitated or in an enemy sign, the lagna lord in its own or exaltation sign aspecting the lagna', 'Kingship.', context => {
    const lords = [...new Set([6, 8, 12].map(house => lord(context, house)))];
    const rows = lords.map(name => { const sign = signOf(context, name); return { name, weak: sign !== null && (debilitated(name, sign) || inEnemySign(name, sign)) }; });
    const l1 = lord(context, 1);
    const ok = dignified(context, l1) && seesSign(context, l1, context.ascendantSign);
    return { met: rows.every(row => row.weak) && ok, lines: [`${rows.map(row => `${row.name} ${row.weak ? 'weak' : 'not weak'}`).join(', ')}; the lagna lord ${l1} ${ok ? 'is in its own or exaltation sign and aspects the lagna' : 'does not meet that'}`] };
  }),
  rule(39, 'tenth-lord-aspects-lagna', [21], 'The 10th lord in its own or exaltation sign, aspecting the lagna', 'Sovereignty. (The second half, benefics in the kendras, gives no number and is not tested.)', context => {
    const l10 = lord(context, 10);
    return { met: dignified(context, l10) && seesSign(context, l10, context.ascendantSign), lines: [`${where(context, l10)}; ${dignified(context, l10) ? 'own or exaltation sign' : 'not in own or exaltation sign'}; ${seesSign(context, l10, context.ascendantSign) ? 'aspects' : 'does not aspect'} the lagna`] };
  }),
  rule(39, 'debilitated-dusthana-lord', [28], 'A debilitated lord of the 6th, 8th or 12th aspecting the lagna', 'A royal yoga.', context => {
    const found = [...new Set([6, 8, 12].map(house => lord(context, house)))].filter(name => { const sign = signOf(context, name); return sign !== null && debilitated(name, sign) && seesSign(context, name, context.ascendantSign); });
    return { met: found.length > 0, lines: [found.length ? `${found.join(', ')} debilitated and aspecting the lagna` : 'No such lord'] };
  }),
  rule(39, 'debilitated-6-8-or-lagna', [30], 'A debilitated graha in the 6th or 8th, or aspecting the lagna', 'A king, or equal to one.', context => {
    const found = context.planets.filter(planet => debilitated(planet.name, planet.sign) && (has(houseOfSign(context, planet.sign), [6, 8]) || seesSign(context, planet.name, context.ascendantSign))).map(planet => where(context, planet.name));
    return { met: found.length > 0, lines: [found.length ? `Debilitated: ${found.join('; ')}` : 'No debilitated graha in the 6th or 8th or aspecting the lagna'] };
  }),
  rule(39, 'lords-9-5', [33, 34], 'The lords of the 9th and 5th aspect each other, are joined or stand in each other\'s 7th', 'A ruler; one born into a royal line becomes a king.', context => {
    const a = lord(context, 9); const b = lord(context, 5);
    const joined = together(context, a, b); const mutual = sees(context, a, b) && sees(context, b, a);
    return { met: joined || mutual, lines: [`${where(context, a)}; ${where(context, b)}; ${joined ? 'joined' : mutual ? 'aspect each other' : 'neither joined nor aspecting each other'}`] };
  }),
  rule(39, 'exchange-4-10', [35], 'The 4th lord in the 10th and the 10th lord in the 4th, seen by Mercury and the 9th lord', 'A ruler. (Read: one of the two is seen by Mercury and one by the 9th lord.)', context => {
    const a = lord(context, 4); const b = lord(context, 10);
    if (!(lordHouse(context, 4) === 10 && lordHouse(context, 10) === 4)) return { met: false, lines: [`${where(context, a)}; ${where(context, b)}: not in each other's houses`] };
    const ninth = lord(context, 9);
    const mercury = [a, b].some(name => sees(context, 'Mercury', name)); const dharma = [a, b].some(name => sees(context, ninth, name));
    return { met: mercury && dharma, lines: [`Exchange; seen by Mercury: ${mercury ? 'yes' : 'no'}; by the 9th lord ${ninth}: ${dharma ? 'yes' : 'no'}`] };
  }),
  rule(39, 'five-lords-with-ninth', [36], 'The lords of the 5th, 10th, 4th and the lagna with the 9th lord', 'A king, famed in all directions. (The "suhṛd" is read as the 4th, as in 39.37.)', context => {
    const ninth = lord(context, 9);
    const others = [lord(context, 5), lord(context, 10), lord(context, 4), lord(context, 1)];
    const together9 = others.every(name => name === ninth || together(context, name, ninth));
    return { met: together9, lines: [`The 9th lord ${ninth} is in ${signName(signOf(context, ninth) ?? 1)}; ${others.map(name => `${name} ${name === ninth || together(context, name, ninth) ? 'with it' : 'not with it'}`).join(', ')}`] };
  }),
  rule(39, 'lords-4-10-with-5-or-9', [37], 'The lords of the 4th and 10th together with the 5th lord or the 9th lord', 'A ruler.', context => {
    const a = lord(context, 4); const b = lord(context, 10); const five = lord(context, 5); const nine = lord(context, 9);
    const pair = a === b || together(context, a, b);
    const withFive = pair && (five === a || together(context, a, five)); const withNine = pair && (nine === a || together(context, a, nine));
    return { met: withFive || withNine, lines: [`4th lord ${a}, 10th lord ${b}: ${pair ? 'together' : 'not together'}; with the 5th lord ${five}: ${withFive ? 'yes' : 'no'}; with the 9th lord ${nine}: ${withNine ? 'yes' : 'no'}`] };
  }),
  rule(39, 'fifth-lord-9th-lagna', [38], 'The 5th lord with the 9th lord or the lagna lord, standing in the lagna, 4th or 10th', 'A king. (Read as one sentence: the 5th lord is the subject of both halves. The site translation takes the second half as the lagna lord alone.)', context => {
    const five = lord(context, 5); const nine = lord(context, 9); const one = lord(context, 1);
    const with_ = [nine, one].filter(name => name !== five && together(context, five, name));
    const house = houseOf(context, five);
    return { met: with_.length > 0 && has(house, [1, 4, 10]), lines: [`${where(context, five)}; with ${mixed(with_)}`] };
  }),
  rule(39, 'jupiter-9th-own', [39], 'Jupiter in the 9th in its own sign, with Venus or the 5th lord', 'Sovereignty.', context => {
    const jupiter = find(context, 'Jupiter');
    if (!jupiter) return cannot('Jupiter is missing');
    const own = OWN_SIGNS.Jupiter.includes(jupiter.sign);
    const with_ = ['Venus', lord(context, 5)].filter((name, index, all) => name !== 'Jupiter' && all.indexOf(name) === index && together(context, 'Jupiter', name));
    return { met: houseOf(context, 'Jupiter') === 9 && own && with_.length > 0, lines: [`${where(context, 'Jupiter')}${own ? ' in its own sign' : ''}; with ${mixed(with_)}`] };
  }),
  rule(39, 'moon-venus', [41], 'The Moon and Venus in each other\'s 3rd or 11th, or aspecting each other', 'A royal yoga. (The Moon and Venus aspect each other only from the 7th.)', context => {
    const moon = find(context, 'Moon'); const venus = find(context, 'Venus');
    if (!moon || !venus) return cannot('The Moon or Venus is missing');
    const count = ((venus.sign - moon.sign + 12) % 12) + 1;
    return { met: [3, 11, 7].includes(count), lines: [`Venus is in the ${ordinalEn(count)} from the Moon`] };
  }),
  rule(39, 'moon-vargottama', [42], 'The Moon vargottama, strong and aspected by four or more grahas', 'Certainly a king.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const strong = isStrong(context, 'Moon');
    if (strong === null) return cannot('The strength of the Moon is not known');
    const varg = navamshaSign(moon.longitude) === moon.sign;
    const seers = SEVEN.filter(name => name !== 'Moon' && sees(context, name, 'Moon'));
    return { met: varg && strong && seers.length >= 4, lines: [`The Moon is ${varg ? '' : 'not '}vargottama and ${strong ? '' : 'not '}strong; aspected by ${seers.length} (${mixed(seers)})`] };
  }),
  rule(39, 'lagna-vargottama', [43], 'The lagna vargottama and aspected by four or more grahas other than the Moon', 'A lord of the earth.', context => {
    if (context.ascendantLongitude === undefined) return cannot('The longitude of the lagna is not known');
    const varg = navamshaSign(context.ascendantLongitude) === context.ascendantSign;
    const seers = SEVEN.filter(name => name !== 'Moon' && seesSign(context, name, context.ascendantSign));
    return { met: varg && seers.length >= 4, lines: [`The lagna is ${varg ? '' : 'not '}vargottama; aspected by ${seers.length} (${mixed(seers)})`] };
  }),
  rule(39, 'exalted-1-3', [44], 'One to three grahas exalted', 'A king in a royal family; in another family, equal to a king by wealth. ("Three or fewer": none is not counted.)', context => {
    const found = SEVEN.filter(name => exaltedNow(context, name));
    return { met: found.length >= 1 && found.length <= 3, lines: [`Exalted: ${mixed(found)}`] };
  }),
  rule(39, 'exalted-trikona-4-5', [45], 'Four or five grahas in their exaltation or mūlatrikoṇa signs', 'A king even from a humble family.', context => {
    const found = SEVEN.filter(name => { const sign = signOf(context, name); return sign !== null && (sign === EXALTATION[name] || sign === MOOLATRIKONA[name]); });
    return { met: found.length === 4 || found.length === 5, lines: [`In exaltation or mūlatrikoṇa: ${found.length} (${mixed(found)})`] };
  }),
  rule(39, 'exalted-6', [46], 'Six grahas exalted', 'A universal sovereign (cakravartin).', context => {
    const found = SEVEN.filter(name => exaltedNow(context, name));
    return { met: found.length >= 6, lines: [`Exalted: ${found.length} (${mixed(found)})`] };
  }),
  rule(39, 'lone-exalted-benefic', [47], 'Jupiter, Venus or Mercury exalted in a kendra, joined by a benefic', 'A king, or equal to one.', context => {
    const found = ['Jupiter', 'Venus', 'Mercury'].filter(name => exaltedNow(context, name) && has(houseOf(context, name), KENDRA) && benefics(context).some(other => other !== name && together(context, name, other)));
    return { met: found.length > 0, lines: [found.length ? `${found.join(', ')} exalted in a kendra with a benefic` : 'None of them is exalted in a kendra with a benefic'] };
  }),
  rule(39, 'benefics-kendras-malefics-3-6-11', [48], 'All the benefics in the kendras and all the malefics in the 3rd, 6th and 11th', 'A king even from a humble family. (Rāhu and Ketu count as malefics; the Moon is a benefic when waxing.)', context => {
    const b = benefics(context); const m = malefics(context);
    const badB = b.filter(name => !has(houseOf(context, name), KENDRA)); const badM = m.filter(name => !has(houseOf(context, name), [3, 6, 11]));
    return { met: badB.length === 0 && badM.length === 0, lines: [`Benefics outside the kendras: ${mixed(badB)}; malefics outside the 3rd, 6th and 11th: ${mixed(badM)}`] };
  }),
  // ── chapter 40: the minister ──
  rule(40, 'tenth-lord-amk', [1], 'The 10th lord joined or seen by the lord of the 2nd or 5th and by the Amātyakāraka', `Prominence at the court. (The Amātyakāraka is ${MINISTER_NOTE}.)`, context => {
    const { amk } = karakas(context);
    const l10 = lord(context, 10);
    if (!amk) return cannot('The Amātyakāraka cannot be found');
    const first = [lord(context, 2), lord(context, 5)].filter(name => joinedOrSeen(context, l10, name));
    const second = joinedOrSeen(context, l10, amk);
    return { met: first.length > 0 && second, lines: [`The 10th lord ${l10}; the Amātyakāraka is ${amk}; joined or seen by the lord of the 2nd or 5th: ${mixed(first)}; by the Amātyakāraka: ${second ? 'yes' : 'no'}`] };
  }),
  rule(40, 'eleventh-seen-by-lord', [2], 'The 11th seen by its lord and free of malefics', 'Prominence at the court.', context => {
    const sign = signOfHouse(context, 11); const l11 = lord(context, 11);
    const seen = seesSign(context, l11, sign);
    const bad = [...grahasInHouse(context, 11).filter(name => isMalefic(context, name)), ...SEVEN.filter(name => isMalefic(context, name) && seesSign(context, name, sign) && !grahasInHouse(context, 11).includes(name))];
    return { met: seen && bad.length === 0, lines: [`The 11th lord ${l11} ${seen ? 'aspects' : 'does not aspect'} the 11th; malefics in or aspecting it: ${mixed(bad)}`] };
  }),
  rule(40, 'amk-dignity', [4], 'The Amātyakāraka strong and with benefics, or in its own or exaltation sign', 'A king\'s minister.', context => {
    const { amk } = karakas(context);
    if (!amk) return cannot('The Amātyakāraka cannot be found');
    const dig = dignified(context, amk);
    const strong = isStrong(context, amk);
    const with_ = benefics(context).filter(name => name !== amk && together(context, amk, name));
    if (dig) return { met: true, lines: [`The Amātyakāraka is ${amk}, in its own or exaltation sign`] };
    if (strong === null) return cannot(`The Amātyakāraka is ${amk}; its strength is not known`);
    return { met: strong && with_.length > 0, lines: [`The Amātyakāraka is ${amk}, ${strong ? 'strong' : 'not strong'}; with benefics: ${mixed(with_)}`] };
  }),
  rule(40, 'amk-lagna-5-9', [5], 'The Amātyakāraka in the lagna, 5th or 9th', 'A renowned royal minister.', context => {
    const { amk } = karakas(context);
    if (!amk) return cannot('The Amātyakāraka cannot be found');
    return { met: has(houseOf(context, amk), [1, 5, 9]), lines: [`The Amātyakāraka is ${where(context, amk)}`] };
  }),
  rule(40, 'amk-from-ak', [6], 'The Amātyakāraka in a kendra or trikoṇa from the Ātmakāraka', 'Royal favour; dependent on the king and happy.', context => {
    const { amk, ak } = karakas(context);
    const a = amk && find(context, amk); const b = ak && find(context, ak);
    if (!a || !b || !amk || !ak) return cannot('The Amātyakāraka or the Ātmakāraka cannot be found');
    const count = ((a.sign - b.sign + 12) % 12) + 1;
    return { met: [1, 4, 7, 10, 5, 9].includes(count), lines: [`The Ātmakāraka is ${ak}; the Amātyakāraka ${amk} is in the ${ordinalEn(count)} from it`] };
  }),
  rule(40, 'amk-kendra-9th-lord', [8], 'The Amātyakāraka in a kendra, trikoṇa, exaltation or own sign, joined or seen by the 9th lord', 'A royal minister.', context => {
    const { amk } = karakas(context);
    if (!amk) return cannot('The Amātyakāraka cannot be found');
    const ninth = lord(context, 9);
    const place = has(houseOf(context, amk), [1, 4, 7, 10, 5, 9]) || dignified(context, amk);
    return { met: place && joinedOrSeen(context, amk, ninth), lines: [`The Amātyakāraka is ${where(context, amk)}; the 9th lord ${ninth} ${joinedOrSeen(context, amk, ninth) ? 'joins or aspects it' : 'neither joins nor aspects it'}`] };
  }),
  rule(40, 'amk-janma-lord-lagna', [9], 'The Amātyakāraka and the lord of the birth sign in the lagna with a benefic', 'The chief yoga of ministership; it shows in old age.', context => {
    const { amk } = karakas(context);
    const moon = find(context, 'Moon');
    if (!amk || !moon) return cannot('The Amātyakāraka or the Moon cannot be found');
    const birthLord = lordOfSign(moon.sign);
    const inLagna = houseOf(context, amk) === 1 && houseOf(context, birthLord) === 1;
    const with_ = benefics(context).filter(name => name !== amk && name !== birthLord && houseOf(context, name) === 1);
    return { met: inLagna && with_.length > 0, lines: [`The Amātyakāraka ${where(context, amk)}; the lord of the birth sign ${where(context, birthLord)}; benefics in the lagna: ${mixed(with_)}`] };
  }),
  rule(40, 'amk-benefic-5-7-9-10', [10], 'The Amātyakāraka with a benefic in the 5th, 7th, 9th or 10th', 'Wealth from royal patronage.', context => {
    const { amk } = karakas(context);
    if (!amk) return cannot('The Amātyakāraka cannot be found');
    const with_ = benefics(context).filter(name => name !== amk && together(context, amk, name));
    return { met: has(houseOf(context, amk), [5, 7, 9, 10]) && with_.length > 0, lines: [`The Amātyakāraka ${where(context, amk)}; with ${mixed(with_)}`] };
  }),
  rule(40, 'eleventh-lord-in-11th', [12], 'The 11th lord in the 11th without malefic aspect, and the Amātyakāraka with benefics', 'Gain from the court.', context => {
    const { amk } = karakas(context);
    if (!amk) return cannot('The Amātyakāraka cannot be found');
    const l11 = lord(context, 11);
    const seen = SEVEN.filter(name => isMalefic(context, name) && sees(context, name, l11));
    const with_ = benefics(context).filter(name => name !== amk && together(context, amk, name));
    return { met: houseOf(context, l11) === 11 && seen.length === 0 && with_.length > 0, lines: [`The 11th lord ${where(context, l11)}; malefic aspects on it: ${mixed(seen)}; the Amātyakāraka ${amk} is with ${mixed(with_)}`] };
  }),
  rule(40, 'exchange-1-10', [13], 'The lagna lord in the 10th and the 10th lord in the lagna', 'A strong royal connection.', context => {
    return { met: lordHouse(context, 1) === 10 && lordHouse(context, 10) === 1, lines: [`${where(context, lord(context, 1))}; ${where(context, lord(context, 10))}`] };
  }),
  rule(40, 'venus-moon-4th-amk', [14], 'Venus and the Moon in the 4th from the Amātyakāraka', 'Born with royal marks.', context => {
    const { amk } = karakas(context);
    const a = amk && find(context, amk);
    if (!a || !amk) return cannot('The Amātyakāraka cannot be found');
    const fourth = ((a.sign - 1 + 3) % 12) + 1;
    const both = signOf(context, 'Venus') === fourth && signOf(context, 'Moon') === fourth;
    return { met: both, lines: [`The Amātyakāraka ${amk} is in ${signName(a.sign)}; its 4th is ${signName(fourth)}; Venus in ${signName(signOf(context, 'Venus') ?? 1)}, the Moon in ${signName(signOf(context, 'Moon') ?? 1)}`] };
  }),
  rule(40, 'lagna-or-amk-with-5th-lord', [15], 'The lagna lord or the Amātyakāraka with the 5th lord in a kendra or trikoṇa', 'A friend of the king.', context => {
    const { amk } = karakas(context);
    const five = lord(context, 5);
    const subjects = [lord(context, 1), ...(amk ? [amk] : [])];
    const found = subjects.filter(name => name !== five && together(context, name, five) && has(houseOf(context, five), [1, 4, 7, 10, 5, 9]));
    return { met: found.length > 0, lines: [`The 5th lord ${where(context, five)}; with ${mixed(found)}`] };
  }),
  // ── chapter 41: the dhana yogas ──
  ...DHANA_FIFTH.map(([verse, owner, in11]) => rule(41, `dhana-5th-${owner.toLowerCase()}`, [verse], `The 5th a sign of ${owner} with ${owner} in it, and ${in11.join(', ')} in the 11th`, 'Lord of great wealth.', context => {
    const fifth = signOfHouse(context, 5);
    const ownerOk = lordOfSign(fifth) === owner && signOf(context, owner) === fifth;
    const missing = in11.filter(name => houseOf(context, name) !== 11);
    return { met: ownerOk && missing.length === 0, lines: [`The 5th is ${signName(fifth)}, a sign of ${lordOfSign(fifth)}; ${where(context, owner)}; in the 11th: ${mixed(grahasInHouse(context, 11))}`] };
  })),
  ...DHANA_LAGNA.map(([verse, owner, by]) => rule(41, `dhana-lagna-${owner.toLowerCase()}`, [verse], `The lagna a sign of ${owner} with ${owner} in it, and ${by.join(', ')} joined or aspecting it`, 'Wealthy. (Read: each of the named grahas is in the lagna or aspects it.)', context => {
    const ownerOk = lordOfSign(context.ascendantSign) === owner && houseOf(context, owner) === 1;
    const rows = by.map(name => ({ name, ok: houseOf(context, name) === 1 || seesSign(context, name, context.ascendantSign) }));
    return { met: ownerOk && rows.every(row => row.ok), lines: [`The lagna is ${signName(context.ascendantSign)}, a sign of ${lordOfSign(context.ascendantSign)}; ${where(context, owner)}; ${rows.map(row => `${row.name} ${row.ok ? 'joins or aspects' : 'does not'}`).join(', ')}`] };
  })),
  rule(41, 'lords-2-9', [16, 17], 'The lords of the 2nd and 9th, and the grahas joined with them', 'They give wealth in their own daśās. (This is always so; the rule names the grahas.)', context => {
    const two = lord(context, 2); const nine = lord(context, 9);
    const set = new Set<string>([two, nine]);
    for (const name of [two, nine]) for (const planet of context.planets) if (planet.name !== name && together(context, name, planet.name)) set.add(planet.name);
    return { met: true, lines: [`The 2nd lord is ${where(context, two)}, the 9th lord ${where(context, nine)}; with the grahas joined: ${[...set].join(', ')}`] };
  }),
  // ── chapter 42: the daridra yogas ──
  rule(42, 'poor-1-12-exchange', [2], 'The lagna lord in the 12th and the 12th lord in the lagna, joined or seen by a māraka lord', 'Poor. (The māraka lords are the lords of the 2nd and 7th.)', context => {
    const a = lord(context, 1); const b = lord(context, 12);
    const exchange = lordHouse(context, 1) === 12 && lordHouse(context, 12) === 1;
    const by = [...new Set([...withMaraka(context, a), ...withMaraka(context, b)])];
    return { met: exchange && by.length > 0, lines: [`${where(context, a)}; ${where(context, b)}; māraka lords joining or aspecting: ${mixed(by)}`] };
  }),
  rule(42, 'poor-1-6-exchange', [3], 'The lagna lord in the 6th and the 6th lord in the lagna, joined or seen by a māraka lord', 'Without wealth.', context => {
    const a = lord(context, 1); const b = lord(context, 6);
    const exchange = lordHouse(context, 1) === 6 && lordHouse(context, 6) === 1;
    const by = [...new Set([...withMaraka(context, a), ...withMaraka(context, b)])];
    return { met: exchange && by.length > 0, lines: [`${where(context, a)}; ${where(context, b)}; māraka lords joining or aspecting: ${mixed(by)}`] };
  }),
  rule(42, 'poor-ketu-8th', [4], 'The lagna lord and the Moon with Ketu, the lagna lord in the 8th, joined or seen by a māraka lord', 'Poor.', context => {
    const a = lord(context, 1);
    const ketuWith = together(context, a, 'Ketu') && together(context, 'Moon', 'Ketu');
    const by = withMaraka(context, a);
    return { met: ketuWith && lordHouse(context, 1) === 8 && by.length > 0, lines: [`${where(context, a)}; the lagna lord and the Moon ${ketuWith ? 'are' : 'are not'} with Ketu; māraka lords joining or aspecting the lagna lord: ${mixed(by)}`] };
  }),
  rule(42, 'poor-lagna-lord-trika', [5], 'The lagna lord in the 6th, 8th or 12th with a malefic, and the 2nd lord in an enemy sign or debilitated', 'Poor even in a royal line. (Read: "in an enemy sign or debilitated"; the verse has no connective.)', context => {
    const a = lord(context, 1); const two = lord(context, 2);
    const withBad = malefics(context).filter(name => name !== a && together(context, a, name));
    const sign = signOf(context, two);
    const weak = sign !== null && (inEnemySign(two, sign) || debilitated(two, sign));
    return { met: has(lordHouse(context, 1), TRIKA) && withBad.length > 0 && weak, lines: [`${where(context, a)}, with ${mixed(withBad)}; the 2nd lord ${two} is ${weak ? 'in an enemy sign or debilitated' : 'not weak'}`] };
  }),
  rule(42, 'poor-5-6-9-12', [7], 'The 5th lord in the 6th and the 9th lord in the 12th, seen by a māraka lord', 'Poor. (Read: one of the two is seen by a māraka lord.)', context => {
    const five = lord(context, 5); const nine = lord(context, 9);
    const placed = lordHouse(context, 5) === 6 && lordHouse(context, 9) === 12;
    const by = [...new Set([...marakas(context).filter(maraka => sees(context, maraka, five)), ...marakas(context).filter(maraka => sees(context, maraka, nine))])];
    return { met: placed && by.length > 0, lines: [`${where(context, five)}; ${where(context, nine)}; māraka lords aspecting: ${mixed(by)}`] };
  }),
  rule(42, 'poor-malefics-lagna', [8], 'Malefics in the lagna without the 9th or 10th lord there, the lagna joined or seen by a māraka lord', 'Poor.', context => {
    const inLagna = grahasInHouse(context, 1).filter(name => isMalefic(context, name));
    const lords = [lord(context, 9), lord(context, 10)].filter(name => houseOf(context, name) === 1);
    const by = marakas(context).filter(maraka => houseOf(context, maraka) === 1 || seesSign(context, maraka, context.ascendantSign));
    return { met: inLagna.length > 0 && lords.length === 0 && by.length > 0, lines: [`Malefics in the lagna: ${mixed(inLagna)}; the 9th or 10th lord there: ${mixed(lords)}; māraka lords in or aspecting the lagna: ${mixed(by)}`] };
  }),
  rule(42, 'poor-trika-lords-chain', [9], 'A trika lord in a house whose lord is in a trika house, joined or seen by a malefic', 'Afflicted by sorrow and poor.', context => {
    const found: string[] = [];
    for (const name of new Set([6, 8, 12].map(house => lord(context, house)))) {
      const house = houseOf(context, name);
      if (house === null) continue;
      const houseLordIn = lordHouse(context, house);
      const bad = malefics(context).some(other => joinedOrSeen(context, name, other));
      if (has(houseLordIn, TRIKA) && bad) found.push(`${name} in the ${ordinalEn(house)} (its lord in the ${ordinalEn(houseLordIn!)})`);
    }
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : 'No trika lord is placed so'] };
  }),
  rule(42, 'poor-moon-navamsha-lord', [10], 'The lord of the Moon\'s navāṁśa joined with a māraka lord or in the 2nd or 7th', 'Poor.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const navLord = lordOfSign(navamshaSign(moon.longitude));
    const by = marakas(context).filter(maraka => maraka !== navLord && together(context, navLord, maraka));
    return { met: by.length > 0 || has(houseOf(context, navLord), [2, 7]), lines: [`The Moon's navāṁśa is ${signName(navamshaSign(moon.longitude))}, its lord ${where(context, navLord)}; with māraka lords: ${mixed(by)}`] };
  }),
  rule(42, 'poor-lagna-navamsha-lord', [11], 'The lagna lord and the lord of the lagna navāṁśa in the 6th, 8th or 12th, joined or seen by a māraka lord', 'Poor.', context => {
    if (context.ascendantLongitude === undefined) return cannot('The longitude of the lagna is not known');
    const a = lord(context, 1); const b = lordOfSign(navamshaSign(context.ascendantLongitude));
    const placed = has(houseOf(context, a), TRIKA) && has(houseOf(context, b), TRIKA);
    const by = [...new Set([...withMaraka(context, a), ...withMaraka(context, b)])];
    return { met: placed && by.length > 0, lines: [`${where(context, a)}; the lord of the lagna navāṁśa ${where(context, b)}; māraka lords joining or aspecting: ${mixed(by)}`] };
  }),
  rule(42, 'poor-without-trikona-aspect', [13], 'Grahas joined with a trika lord and not aspected by a lord of the 1st, 5th or 9th', 'Loss of wealth in their own daśās.', context => {
    const trika = new Set<string>([6, 8, 12].map(house => lord(context, house)));
    const trikona = [...new Set(TRIKONA.map(house => lord(context, house)))];
    const found = context.planets.filter(planet => ![...trika].includes(planet.name) && [...trika].some(other => together(context, planet.name, other)) && !trikona.some(other => other !== planet.name && sees(context, other, planet.name))).map(planet => planet.name);
    return { met: found.length > 0, lines: [found.length ? `${found.join(', ')}` : 'No such graha'] };
  }),
  rule(42, 'mars-saturn-2nd', [16, 17], 'Mars or Saturn in the 2nd', 'They destroy wealth; if Mercury aspects them, great wealth.', context => {
    const found = ['Mars', 'Saturn'].filter(name => houseOf(context, name) === 2);
    const cancel = found.filter(name => sees(context, 'Mercury', name));
    return { met: found.length > 0, lines: [found.length ? `${found.join(', ')} in the 2nd${cancel.length ? `; Mercury aspects ${cancel.join(', ')}: the verse then gives great wealth` : '; Mercury does not aspect them'}` : 'Neither is in the 2nd'] };
  }),
  rule(42, 'sun-2nd', [17, 18], 'The Sun in the 2nd', 'Aspected by Saturn: poverty; not aspected by Saturn: great wealth and fame. (Saturn aspected by the Sun, 42.18b, is not tested.)', context => {
    if (houseOf(context, 'Sun') !== 2) return { met: false, lines: ['The Sun is not in the 2nd'] };
    const seen = sees(context, 'Saturn', 'Sun');
    return { met: true, lines: [`The Sun is in the 2nd; Saturn ${seen ? 'aspects it: poverty' : 'does not aspect it: great wealth and fame'}`] };
  }),
];
