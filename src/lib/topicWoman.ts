import { navamshaSign } from './birthConditions';
import { NATURAL_ENEMIES } from './dignity';
import {
  SEVEN, beneficsIn, beneficsSeeing, cannot, find, grahasInHouse, has, hemmedBy, houseOf, isBenefic, isMalefic, isStrong, lordOfHouse, lordOfSign, maleficsIn, maleficsSeeing,
  mixed, signName, signOf, sees, seesSign, where, withMalefics, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * The woman's chart: Bṛhat Parāśara Horā Śāstra chapter 80 ("strījātaka", 55 verses). The text says that the results told for men hold for women (80.2) and then what is special: the body from the lagna, children from the 5th, the husband\'s luck from the 7th,
 * widowhood from the 8th. The rules here are read for a woman\'s chart; the app does not ask whether a chart is a woman\'s, so they stand as rules for a chart read so.
 * Readings: "malefic" and "benefic" as in the other topics; "strong" is a Ṣaḍbala of 1 or more; the nodes count as malefics.
 * Not judged: the trimshāṁśa table of 80.8-16 (given in the Phaladīpikā 11 beside it, which is built; the BPHS verses are garbled in the print and in the English), 80.17 (Saturn "weak" in the 7th is not clear),
 * 80.35, 80.38, 80.40 (conditions that cannot be met together), 80.43 (needs the weekday and the tithi), 80.48-49 (the husband\'s chart), 80.55 (equal strength has no measure).
 */
const rule = (id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'woman', chapter: 80, verses, name, effect, evaluate });

const lord = (context: TopicContext, house: number) => lordOfHouse(context, house);
const EIGHTH: Record<string, string> = {
  Sun: 'sorrow and poverty, a wounded body, turned from dharma',
  Moon: 'unlucky, ill-formed breasts, poor sight, without clothes and ornaments, sickly, despised',
  Mars: 'thin, ill, a widow, without beauty, sorrowing',
  Mercury: 'without dharma, fearful, without honour and wealth, quarrelsome',
  Jupiter: 'ill-mannered, few children, argumentative, abandoned by her husband, a glutton',
  Venus: 'careless, without wealth, merciless, without dharma, impure and deceitful',
  Saturn: 'ill-natured, a thief, a cheat, without happiness from her husband',
  Rahu: 'ugly, abandoned by her husband, hard-hearted, diseased and unchaste',
};
const HUSBAND: Record<string, string> = {
  Mars: 'fond of women and wrathful', Mercury: 'learned, skilled in arts and wise', Jupiter: 'of all good qualities, master of his senses', Venus: 'fortunate, loving, dear to women',
  Saturn: 'old and foolish', Sun: 'harsh and over-active', Moon: 'charming, passionate and gentle',
};

export const WOMAN_RULES: TopicYogaRule[] = [
  rule('w80-even-signs', [5, 6], 'The lagna and the Moon in even signs, seen by benefics', 'Of a natural, maidenly, virtuous character with auspicious marks; beautiful and comfortable in the body.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const ben = [...new Set([...beneficsSeeing(context, 'Moon'), ...SEVEN.filter(name => isBenefic(context, name) && seesSign(context, name, context.ascendantSign))])];
    const even = context.ascendantSign % 2 === 0 && moon.sign % 2 === 0;
    return { met: even, lines: [`The lagna is ${signName(context.ascendantSign)}, the Moon sign ${signName(moon.sign)}${even ? '' : ' (not both even)'}; benefics seeing them: ${mixed(ben)}${even && ben.length ? ' (80.6: beautiful and always comfortable)' : ''}`] };
  }),
  rule('w80-odd-signs', [6, 7], 'The lagna and the Moon in odd signs, seen by malefics', 'Of a masculine form and bad conduct; strongly afflicted: without good qualities.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const mal = [...new Set([...maleficsSeeing(context, 'Moon'), ...withMalefics(context, 'Moon'), ...maleficsIn(context, 1), ...SEVEN.filter(name => isMalefic(context, name) && seesSign(context, name, context.ascendantSign))])];
    return { met: context.ascendantSign % 2 === 1 && moon.sign % 2 === 1 && mal.length > 0, lines: [`The lagna is ${signName(context.ascendantSign)}, the Moon sign ${signName(moon.sign)}; malefics joining or seeing: ${mixed(mal)}`] };
  }),
  rule('w80-7th-sun-mars', [18], 'The Sun, or Mars, in the 7th', 'The Sun: abandoned by her husband. Mars: a widow in childhood.', context => {
    const found = ['Sun', 'Mars'].filter(name => houseOf(context, name) === 7);
    return { met: found.length > 0, lines: [found.length ? `${found.join(' and ')} in the 7th` : `${where(context, 'Sun')}; ${where(context, 'Mars')}`] };
  }),
  rule('w80-7th-occupants', [19], 'Malefics, benefics or both in the 7th', 'Malefics: a widow. Benefics: chaste, with her husband. Both: a remarried woman.', context => {
    const m = maleficsIn(context, 7); const b = beneficsIn(context, 7);
    const kind = m.length && b.length ? 'both: she marries again' : m.length ? 'malefics: a widow' : b.length ? 'benefics: chaste, with her husband' : 'none';
    return { met: m.length > 0 || b.length > 0, lines: [`In the 7th: malefics ${mixed(m)}, benefics ${mixed(b)} (${kind})`] };
  }),
  rule('w80-venus-mars-exchange', [20], 'Venus and Mars each in the other\'s navāṁśa', 'Attached to another man.', context => {
    const venus = find(context, 'Venus'); const mars = find(context, 'Mars');
    if (!venus || !mars) return cannot('Venus or Mars is missing');
    return { met: lordOfSign(navamshaSign(venus.longitude)) === 'Mars' && lordOfSign(navamshaSign(mars.longitude)) === 'Venus', lines: [`Venus in the navāṁśa of ${lordOfSign(navamshaSign(venus.longitude))}, Mars in the navāṁśa of ${lordOfSign(navamshaSign(mars.longitude))}`] };
  }),
  rule('w80-moon-7th', [20], 'The Moon in the 7th', 'With her husband\'s leave.', context => ({ met: houseOf(context, 'Moon') === 7, lines: [where(context, 'Moon')] })),
  rule('w80-lagna-venus-saturn', [21], 'The lagna a sign of Venus or Saturn, or the Moon and Venus together in the lagna', 'Unchaste, with her mother.', context => {
    const byLagna = ['Venus', 'Saturn'].includes(lordOfSign(context.ascendantSign));
    const together_ = houseOf(context, 'Moon') === 1 && houseOf(context, 'Venus') === 1;
    return { met: byLagna || together_, lines: [`The lagna is ${signName(context.ascendantSign)}, a sign of ${lordOfSign(context.ascendantSign)}; the Moon and Venus in the lagna: ${together_ ? 'yes' : 'no'}`] };
  }),
  rule('w80-7th-husband', [22, 23, 24, 25], 'The 7th by the lord of its sign (and its navāṁśa)', 'The husband: Mars fond of women and wrathful; Mercury learned and skilled; Jupiter of all good qualities; Venus fortunate and loving; Saturn old and foolish; the Sun harsh; Cancer charming, passionate and gentle. (The verses name the sign and the navāṁśa; here the sign is read, and the navāṁśa of the 7th cusp when the lagna longitude is known.)', context => {
    const sign = signOfHouse7(context);
    const own = lordOfSign(sign);
    const lines = [`The 7th is ${signName(sign)}, a sign of ${own}: the husband is ${HUSBAND[own] ?? 'not told'}`];
    if (context.ascendantLongitude !== undefined) { const nav = navamshaSign((context.ascendantLongitude + 180) % 360); lines.push(`Its navāṁśa is ${signName(nav)}, of ${lordOfSign(nav)}: ${HUSBAND[lordOfSign(nav)] ?? 'not told'}`); }
    return { met: true, lines };
  }),
  rule('w80-8th-graha', [26, 27, 28, 29, 30, 31, 32, 33], 'A graha in the 8th', 'The Sun: sorrow and poverty; the Moon: unlucky and sickly; Mars: thin, ill, a widow; Mercury: without dharma, quarrelsome; Jupiter: ill-mannered, few children; Venus: careless and deceitful; Saturn: ill-natured; Rāhu: ugly, abandoned, unchaste.', context => {
    const found = Object.keys(EIGHTH).filter(name => houseOf(context, name) === 8);
    return { met: found.length > 0, lines: found.length ? found.map(name => `${name} in the 8th: ${EIGHTH[name]}`) : ['No graha in the 8th'] };
  }),
  rule('w80-barren-lagna', [34, 39], 'The Moon and Venus in the lagna with Saturn and Mars, or the lagna a sign of Saturn or Mars with them, and the lagna or the 5th seen by malefics', 'Barren.', context => {
    const four = ['Moon', 'Venus', 'Saturn', 'Mars'].every(name => houseOf(context, name) === 1);
    const signOk = ['Saturn', 'Mars'].includes(lordOfSign(context.ascendantSign)) && houseOf(context, 'Moon') === 1 && houseOf(context, 'Venus') === 1;
    const fifth = SEVEN.filter(name => isMalefic(context, name) && seesSign(context, name, ((context.ascendantSign + 3) % 12) + 1));
    const lagnaSeers = SEVEN.filter(name => isMalefic(context, name) && seesSign(context, name, context.ascendantSign));
    return { met: (four && fifth.length > 0) || (signOk && lagnaSeers.length > 0), lines: [`Moon, Venus, Saturn and Mars all in the lagna: ${four ? 'yes' : 'no'}; the lagna a sign of Saturn or Mars with the Moon and Venus: ${signOk ? 'yes' : 'no'}; malefics seeing the 5th: ${mixed(fifth)}, the lagna: ${mixed(lagnaSeers)}`] };
  }),
  rule('w80-mercury-lagna-5th', [36], 'The lagna a sign of Mercury and the 5th with the Moon and Venus', 'Happy in her father\'s house.', context => ({
    met: ['Mercury'].includes(lordOfSign(context.ascendantSign)) && houseOf(context, 'Moon') === 5 && houseOf(context, 'Venus') === 5, lines: [`The lagna is ${signName(context.ascendantSign)}; ${where(context, 'Moon')}; ${where(context, 'Venus')}`],
  })),
  rule('w80-moon-mercury-venus-lagna', [37], 'The Moon, Mercury and Venus in the lagna (with Jupiter too)', 'Many pleasures and good qualities; with Jupiter: exceedingly wealthy, with children and happiness.', context => {
    const three = ['Moon', 'Mercury', 'Venus'].every(name => houseOf(context, name) === 1);
    return { met: three, lines: [`${where(context, 'Moon')}; ${where(context, 'Mercury')}; ${where(context, 'Venus')}${three ? `; Jupiter ${houseOf(context, 'Jupiter') === 1 ? 'is there too' : 'is not there'}` : ''}`] };
  }),
  rule('w80-miscarriage', [41], 'Venus and Jupiter in the 8th, or Mars in the 7th seen by Saturn', 'Miscarriages.', context => {
    const first = houseOf(context, 'Venus') === 8 && houseOf(context, 'Jupiter') === 8;
    const second = houseOf(context, 'Mars') === 7 && sees(context, 'Saturn', 'Mars');
    return { met: first || second, lines: [`Venus and Jupiter in the 8th: ${first ? 'yes' : 'no'}; Mars in the 7th seen by Saturn: ${second ? 'yes' : 'no'}`] };
  }),
  rule('w80-moon-hemmed', [42], 'The Moon in the lagna between malefics', 'She destroys her father\'s line and her husband\'s.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    return { met: houseOf(context, 'Moon') === 1 && hemmedBy(context, moon.sign, name => isMalefic(context, name), 'Moon'), lines: [`${where(context, 'Moon')}; between malefics: ${hemmedBy(context, moon.sign, name => isMalefic(context, name), 'Moon') ? 'yes' : 'no'}`] };
  }),
  rule('w80-visha-kanya', [44], 'A malefic with two benefics in the lagna and two malefics in enemy signs', 'A poisonous girl (viṣa-kanyā): unfortunate, her children die, without clothes and ornaments, grieving (80.45).', context => {
    const m = maleficsIn(context, 1); const b = beneficsIn(context, 1);
    const enemy = context.planets.filter(planet => isMalefic(context, planet.name) && (NATURAL_ENEMIES[planet.name] ?? []).includes(lordOfSign(planet.sign))).map(planet => planet.name);
    return { met: m.length >= 1 && b.length >= 2 && enemy.length >= 2, lines: [`In the lagna: malefics ${mixed(m)}, benefics ${mixed(b)}; malefics in enemy signs: ${mixed(enemy)}`] };
  }),
  rule('w80-visha-cancelled', [46], 'A benefic 7th lord, or a benefic in the 7th from the lagna or the Moon', 'It destroys the viṣa-yoga.', context => {
    const l7 = lord(context, 7); const moon = find(context, 'Moon');
    const fromMoon = moon ? ((moon.sign + 5) % 12) + 1 : null;
    const inMoon7 = fromMoon === null ? [] : context.planets.filter(planet => planet.sign === fromMoon && isBenefic(context, planet.name)).map(planet => planet.name);
    const found = [isBenefic(context, l7) ? `the 7th lord ${l7} is a benefic` : '', beneficsIn(context, 7).length ? `benefics in the 7th ${beneficsIn(context, 7).join(', ')}` : '', inMoon7.length ? `benefics in the 7th from the Moon ${inMoon7.join(', ')}` : ''].filter(Boolean);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : 'None'] };
  }),
  rule('w80-mars-kills-husband', [47], 'Mars in the lagna, 4th, 7th, 8th or 12th without a benefic aspect or conjunction', 'She kills her husband. (The kuja-doṣa; a benefic joined to Mars or seeing it cancels it.)', context => {
    const house = houseOf(context, 'Mars');
    const ben = [...beneficsSeeing(context, 'Mars'), ...beneficsIn(context, house ?? 0).filter(name => name !== 'Mars')];
    return { met: has(house, [1, 4, 7, 8, 12]) && ben.length === 0, lines: [`${where(context, 'Mars')}; benefics joining or seeing it: ${mixed([...new Set(ben)])}`] };
  }),
  rule('w80-venus-saturn', [50], 'Venus and Saturn in aspect, the lagna Taurus or Libra', 'A blazing passion. (Read: the two in opposition, as the aspect they have of each other; the navāṁśa and the ghaṭa division of the verse are not tried.)', context => ({
    met: [2, 7].includes(context.ascendantSign) && sees(context, 'Saturn', 'Venus') && sees(context, 'Venus', 'Saturn'), lines: [`The lagna is ${signName(context.ascendantSign)}; Venus in ${signName(signOf(context, 'Venus') ?? 1)}, Saturn in ${signName(signOf(context, 'Saturn') ?? 1)}`],
  })),
  rule('w80-learned', [52], 'Mars, Mercury, Jupiter and Venus strong and the lagna an even sign', 'Skilled in many sciences, a speaker of Brahman.', context => {
    const rows = ['Mars', 'Mercury', 'Jupiter', 'Venus'].map(name => ({ name, strong: isStrong(context, name) }));
    if (rows.some(row => row.strong === null)) return cannot('A strength is not known');
    return { met: context.ascendantSign % 2 === 0 && rows.every(row => row.strong === true), lines: [`The lagna is ${signName(context.ascendantSign)}; ${rows.map(row => `${row.name} ${row.strong ? 'strong' : 'not strong'}`).join(', ')}`] };
  }),
  rule('w80-renunciation', [53], 'A malefic in the 7th and a graha in the 9th', 'She takes renunciation born of malefics.', context => ({
    met: maleficsIn(context, 7).length > 0 && grahasInHouse(context, 9).length > 0, lines: [`Malefics in the 7th: ${mixed(maleficsIn(context, 7))}; in the 9th: ${mixed(grahasInHouse(context, 9))}`],
  })),
  rule('w80-mercury-8th', [54], 'Mercury in the 8th without a malefic aspect or conjunction', 'An early death.', context => {
    const mal = [...withMalefics(context, 'Mercury'), ...maleficsSeeing(context, 'Mercury')];
    return { met: houseOf(context, 'Mercury') === 8 && mal.length === 0, lines: [`${where(context, 'Mercury')}; malefics joining or seeing: ${mixed([...new Set(mal)])}`] };
  }),
];

function signOfHouse7(context: TopicContext) { return ((context.ascendantSign + 5) % 12) + 1; }
