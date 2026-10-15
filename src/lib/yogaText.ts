import type { Language } from './i18n';

/**
 * The reasons the yoga engine writes ("Moon in house 4 (Kendra)") are English
 * sentences built from planet names and numbers. Planet and sign names stay as
 * the table shows them; the words around them are translated here, one pattern
 * per sentence shape in yogas.ts.
 */
const ORD = '(\\d+)(?:st|nd|rd|th)';
const SIDE = { Sun: 'Auringosta', Moon: 'Kuusta' } as const;
const QUALITY = { exaltation: 'korotus', 'own sign': 'oma merkki' } as const;

type Rule = [RegExp, (m: RegExpExecArray) => string];

const KIND = { movable: 'liikkuvissa', fixed: 'pysyvissä', dual: 'kaksoisluonteisissa', mixed: 'sekalaisissa' } as const;
const GROUP = { Benefics: 'Hyväntekijät', Malefics: 'Pahantekijät' } as const;
const FROM = { Lagna: 'Lagnasta', Moon: 'Kuusta' } as const;
const LORD = '(Lagna lord|(\\d+)(?:st|nd|rd|th) lord)';
const lordLabel = (label: string, number: string | undefined) => (number ? `${number}. herra` : 'Lagnan herra');
const NONE = (text: string) => (text === 'none' ? 'ei yhtään' : text);

/**
 * The reasons of the yogas in yogasClassical.ts. They come first: a few of them start like a reason a more general
 * pattern below would catch ("Jupiter in 3rd from Moon (not a Kendra)").
 */
const CLASSICAL_RULES: Rule[] = [
  [/^Planets in (movable|fixed|dual|mixed) signs$/, (m) => `Planeetat ${KIND[m[1] as keyof typeof KIND]} merkeissä`],
  [/^Planets in houses (.+)$/, (m) => `Planeetat taloissa ${m[1]}`],
  [/^Planets in (\d+) signs?$/, (m) => `Planeetat ${m[1]} merkissä`],
  [/^Not counted: a Dala or Akriti yoga holds$/, () => 'Ei lasketa: Dala- tai Akriti-yoga on voimassa'],
  [/^(Benefics|Malefics) in kendra houses (.+)$/, (m) => `${GROUP[m[1] as keyof typeof GROUP]} kendra-taloissa ${NONE(m[2])}`],
  [/^(Benefics|Malefics) in houses (.+)$/, (m) => `${GROUP[m[1] as keyof typeof GROUP]} taloissa ${NONE(m[2])}`],
  [new RegExp(`^Jupiter in ${ORD} from Moon \\(not a Kendra\\)$`), (m) => `Jupiter ${m[1]}. merkissä Kuusta (ei Kendra)`],
  [new RegExp(`^Jupiter in ${ORD} from Moon — no benefic joins or aspects it$`), (m) => `Jupiter ${m[1]}. merkissä Kuusta — mikään hyväntekijä ei ole sen kanssa eikä aspektoi sitä`],
  [new RegExp(`^Jupiter in ${ORD} from Moon — Jupiter is debilitated$`), (m) => `Jupiter ${m[1]}. merkissä Kuusta — Jupiter on heikennetty`],
  [new RegExp(`^Jupiter in ${ORD} from Moon — Jupiter is combust \\((.+)° from Sun\\)$`), (m) => `Jupiter ${m[1]}. merkissä Kuusta — Jupiter on polttunut (${m[2]}° Auringosta)`],
  [new RegExp(`^Jupiter in ${ORD} from Moon — Jupiter is in an enemy sign \\((\\S+)\\)$`), (m) => `Jupiter ${m[1]}. merkissä Kuusta — Jupiter on vihollisen merkissä (${m[2]})`],
  [/^(\S+) with Jupiter$/, (m) => `${m[1]} Jupiterin kanssa`],
  [/^(\S+) aspects Jupiter$/, (m) => `${m[1]} aspektoi Jupiteria`],
  [new RegExp(`^${LORD} (\\S+) in (\\S+), house (\\d+)$`), (m) => `${lordLabel(m[1], m[2])} ${m[3]} merkissä ${m[4]}, talo ${m[5]}`],
  [new RegExp(`^${LORD} (\\S+) not in the chart$`), (m) => `${lordLabel(m[1], m[2])} ${m[3]} puuttuu kartasta`],
  [/^9th lord is not in a Kendra$/, () => '9. herra ei ole kendrassa'],
  [/^9th lord is not in its own or exaltation sign$/, () => '9. herra ei ole omassa eikä korotusmerkissään'],
  [/^Lagna lord is not strong \(not debilitated and in its own, exaltation or friendly sign or in a Kendra or Trikona\)$/, () => 'Lagnan herra ei ole vahva (ei heikennetty, ja omassa, korotus- tai ystävän merkissä tai Kendrassa tai Trikonassa)'],
  [/^Exchange of signs$/, () => 'Merkkien vaihto'],
  [/^No exchange of signs$/, () => 'Ei merkkien vaihtoa'],
  [/^No exchange of signs of this kind$/, () => 'Ei tämän tyyppistä merkkien vaihtoa'],
  [/^Same planet rules both$/, () => 'Sama planeetta hallitsee molempia'],
  [/^Conjunct$/, () => 'Yhtymässä'],
  [/^Mutual aspect$/, () => 'Keskinäinen aspekti'],
  [/^No conjunction, exchange or mutual aspect$/, () => 'Ei yhtymää, merkkien vaihtoa eikä keskinäistä aspektia'],
  [/^(\S+) ⇄ (\S+) \(houses (\d+) and (\d+)\)$/, (m) => `${m[1]} ⇄ ${m[2]} (talot ${m[3]} ja ${m[4]})`],
  [new RegExp(`^${ORD} lord (\\S+) in house (\\d+)$`), (m) => `${m[1]}. herra ${m[2]} talossa ${m[3]}`],
  [/^(\S+) debilitated in (\S+)$/, (m) => `${m[1]} heikennetty merkissä ${m[2]}`],
  [/^No cancellation$/, () => 'Ei kumoutumista'],
  [/^No planet is debilitated$/, () => 'Yksikään planeetta ei ole heikennetty'],
  [/^Lord (\S+) is exalted$/, (m) => `Herra ${m[1]} on korotettu`],
  [/^Lord (\S+) in a Kendra from the (Lagna|Moon)$/, (m) => `Herra ${m[1]} kendrassa ${FROM[m[2] as keyof typeof FROM]}`],
  [/^Lord (\S+) aspects (\S+)$/, (m) => `Herra ${m[1]} aspektoi planeettaa ${m[2]}`],
  [/^Exaltation lord (\S+) in a Kendra from the (Lagna|Moon)$/, (m) => `Korotusmerkin herra ${m[1]} kendrassa ${FROM[m[2] as keyof typeof FROM]}`],
  [/^(\S+) exalted in the same sign$/, (m) => `${m[1]} korotettu samassa merkissä`],
  [/^(\S+) \(exalted here\) in a Kendra from the (Lagna|Moon)$/, (m) => `${m[1]} (korotettu tässä) kendrassa ${FROM[m[2] as keyof typeof FROM]}`],
  [/^Lagna lord is not in a Kendra or Trikona$/, () => 'Lagnan herra ei ole kendrassa eikä trikonassa'],
  [/^Lagna is not a fixed sign$/, () => 'Lagna ei ole pysyvä merkki'],
  [/^Venus is not in a Kendra$/, () => 'Venus ei ole kendrassa'],
  [/^Moon is not in a Trikona with a benefic$/, () => 'Moon ei ole trikonassa hyväntekijän kanssa'],
  [/^Saturn is not in the 10th house$/, () => 'Saturn ei ole 10. talossa'],
  [/^Fixed Lagna, Venus in a Kendra, Moon with a benefic in a Trikona, Saturn in the 10th$/, () => 'Pysyvä Lagna, Venus kendrassa, Moon hyväntekijän kanssa trikonassa, Saturn 10. talossa'],
  [new RegExp(`^No (benefic|malefic) in the ${ORD} house$`), (m) => `Ei ${m[1] === 'benefic' ? 'hyväntekijää' : 'pahantekijää'} ${m[2]}. talossa`],
  [/^No benefic and malefic together in the 5th house$/, () => 'Ei hyväntekijää ja pahantekijää yhdessä 5. talossa'],
];

const LORD_OF = (label: string, number: string | undefined) => (number ? `${number}. herran` : 'Lagnan herran');

/** The reasons of the yogas in yogasBphs.ts that would be caught by a more general pattern if they came after it. */
const BPHS_RULES_FIRST: Rule[] = [
  [/^Benefics in houses 1 and 9, benefic and malefic in the 5th, malefics in houses 4 and 8$/, () => 'Hyväntekijät taloissa 1 ja 9, hyväntekijä ja pahantekijä 5. talossa, pahantekijät taloissa 4 ja 8'],
  [/^Benefics in houses 7, 8 and no malefic joining or aspecting them$/, () => 'Hyväntekijät taloissa 7 ja 8, eikä pahantekijää niiden kanssa tai aspektoimassa niitä'],
  [new RegExp(`^Benefics in houses (.+) from the sign of the (Lagna lord|(\\d+)(?:st|nd|rd|th) lord)$`), (m) => `Hyväntekijät taloissa ${m[1]} ${LORD_OF(m[2], m[3])} merkistä lukien`],
  [new RegExp(`^No benefic in the ${ORD} from the sign of the (Lagna lord|(\\d+)(?:st|nd|rd|th) lord)$`), (m) => `Ei hyväntekijää ${m[1]}. merkissä ${LORD_OF(m[2], m[3])} merkistä lukien`],
  [new RegExp(`^Moon in ${ORD} from Sun \\((Kendra|Panaphara|Apoklima)\\)$`), (m) => `Moon ${m[1]}. merkissä Auringosta (${m[2]})`],
];

/** The reasons of the yogas in yogasBphs.ts, and of Kemadruma and its cancellation. */
const BPHS_RULES: Rule[] = [
  [/^Moon unattended — no planet with it or in the 2nd or 12th from it, none in a Kendra from the Lagna or the Moon$/, () => 'Kuu ilman seuralaisia — ei planeettaa sen kanssa eikä 2. tai 12. merkissä siitä, ei yhtään Kendrassa Lagnasta eikä Kuusta'],
  [/^Moon is joined by: (.+)$/, (m) => `Kuun kanssa: ${m[1]}`],
  [/^Kemadruma cancelled by a planet in a Kendra: (.+)$/, (m) => `Kemadruma kumoutuu Kendrassa olevalla planeetalla: ${m[1]}`],
  [/^No Kemadruma to cancel$/, () => 'Ei Kemadrumaa kumottavaksi'],
  [/^No (benefic|malefic) in the 1st house, none in both the 12th and the 2nd$/, (m) => `Ei ${m[1] === 'benefic' ? 'hyväntekijää' : 'pahantekijää'} 1. talossa, ei myöskään sekä 12. että 2. talossa`],
  [/^(benefics|malefics) in houses 12, 2$/, (m) => `${m[1] === 'benefics' ? 'hyväntekijät' : 'pahantekijät'} taloissa 12 ja 2`],
  [/^(.+) in a Kendra from the (Lagna|Moon)$/, (m) => `${m[1]} Kendrassa ${FROM[m[2] as keyof typeof FROM]}`],
  [/^(\d) of the 3 benefics in the Upachayas from the Moon(?: \((.+)\))?$/, (m) => `${m[1]}/3 hyväntekijää Kuun Upachaya-taloissa${m[2] ? ` (${m[2]})` : ''}`],
  [/^Not a benefic in a Kendra: (.+)$/, (m) => `Kendrassa ei-hyväntekijä: ${m[1]}`],
  [/^Not a benefic in the 8th house: (.+)$/, (m) => `8. talossa ei-hyväntekijä: ${m[1]}`],
  [/^Only benefics in the Kendras: (.+)$/, (m) => `Kendroissa vain hyväntekijöitä: ${m[1]}`],
  [/^No planet in the Kendras$/, () => 'Ei planeettoja Kendroissa'],
  [/^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) in (\S+), house (\d+)$/, (m) => `${m[1]} merkissä ${m[2]}, talo ${m[3]}`],
  [/^No form of the yoga holds$/, () => 'Yoga ei toteudu missään muodossaan'],
  [/^Mutual Kendras$/, () => 'Keskinäiset Kendrat'],
  [new RegExp(`^No (benefic|malefic) in the ${ORD} house in the right sign$`), (m) => `Ei ${m[1] === 'benefic' ? 'hyväntekijää' : 'pahantekijää'} ${m[2]}. talossa oikeassa merkissä`],
  [/^Jupiter is not in the 2nd or 5th house$/, () => 'Jupiter ei ole 2. eikä 5. talossa'],
  [/^Mercury and Venus join or aspect Jupiter$/, () => 'Mercury ja Venus ovat Jupiterin kanssa tai aspektoivat sitä'],
  [/^Mercury and Venus do not both join or aspect Jupiter$/, () => 'Mercury ja Venus eivät molemmat ole Jupiterin kanssa tai aspektoi sitä'],
  [/^Chain: (.+)$/, (m) => `Ketju: ${m[1]}`],
  [/^(\S+) is not in a Kendra, Trikona or exaltation$/, (m) => `${m[1]} ei ole Kendrassa, Trikonassa eikä korotuksessa`],
  [/^all in Kendras, Trikonas or exaltation$/, () => 'kaikki Kendroissa, Trikonoissa tai korotuksessa'],
  [/^a dispositor is not in a Kendra or Trikona$/, () => 'dispositori ei ole Kendrassa eikä Trikonassa'],
  [/^the two dispositors are in Kendras or Trikonas$/, () => 'molemmat dispositorit ovat Kendroissa tai Trikonoissa'],
  [/^In its own or exaltation sign, with the 10th lord$/, () => 'Omassa tai korotusmerkissään, 10. herran kanssa'],
  [/^Lagna lord and 10th lord together in a movable sign$/, () => 'Lagnan herra ja 10. herra yhdessä liikkuvassa merkissä'],
  [/^Malefic in or aspecting the 7th or 8th house: (.+)$/, (m) => `Pahantekijä 7. tai 8. talossa tai aspektoimassa niitä: ${m[1]}`],
  [/^Jupiter or Mercury in a Trikona from the Moon$/, () => 'Jupiter tai Mercury Trikonassa Kuusta'],
  [/^Two benefics in house (\d+): (.+)$/, (m) => `Kaksi hyväntekijää talossa ${m[1]}: ${m[2]}`],
  [/^Houses 12, 1, 2 and 7 are occupied$/, () => 'Talot 12, 1, 2 ja 7 on miehitetty'],
  [/^Venus, Jupiter and the Lagna lord are in Kendras$/, () => 'Venus, Jupiter ja Lagnan herra ovat Kendroissa'],
  [/^Exalted in a Kendra and aspected by Jupiter$/, () => 'Korotettu Kendrassa ja Jupiterin aspektoima'],
  [/^The 7th lord is in the 10th house, the 10th lord is exalted and with the 9th lord$/, () => '7. herra on 10. talossa, 10. herra on korotettu ja 9. herran kanssa'],
  [/^Dignified benefics in houses 5, 6 and 7 and malefics in houses 1, 3 and 11$/, () => 'Arvokkaat hyväntekijät taloissa 5, 6 ja 7 ja pahantekijät taloissa 1, 3 ja 11'],
  [/^9th lord is not strong \(not debilitated and in its own, exaltation or friendly sign or in a Kendra or Trikona\)$/, () => '9. herra ei ole vahva (ei heikennetty, ja omassa, korotus- tai ystävän merkissä tai Kendrassa tai Trikonassa)'],
];

const RULES: Rule[] = [
  ...BPHS_RULES_FIRST,
  ...CLASSICAL_RULES,
  ...BPHS_RULES,
  [new RegExp(`^No eligible planets in ${ORD} from (Sun|Moon)$`), (m) => `Ei kelpaavia planeettoja ${m[1]}. merkissä ${SIDE[m[2] as 'Sun' | 'Moon']}`],
  [new RegExp(`^No benefic in ${ORD} from Moon \\((.+)\\)$`), (m) => `Ei hyväntekijää ${m[1]}. merkissä Kuusta (${m[2]})`],
  [new RegExp(`^No benefic in ${ORD} house from Lagna$`), (m) => `Ei hyväntekijää ${m[1]}. talossa lagnasta`],
  [/^No benefic in (.+) from Moon$/, (m) => `Ei hyväntekijää Kuusta ${m[1].replace(/(\d+)(?:st|nd|rd|th)/g, '$1.')} merkissä`],
  [new RegExp(`^(.+) in ${ORD} from (Sun|Moon)$`), (m) => `${m[1]} ${m[2]}. merkissä ${SIDE[m[3] as 'Sun' | 'Moon']}`],
  [new RegExp(`^(.+) in ${ORD} from Moon \\((.+)\\)$`), (m) => `${m[1]} ${m[2]}. merkissä Kuusta (${m[3]})`],
  [new RegExp(`^(.+) in ${ORD} from Lagna$`), (m) => `${m[1]} ${m[2]}. talossa lagnasta`],
  [new RegExp(`^${ORD}: (.*)$`), (m) => `${m[1]}.: ${m[2]}`],
  [/^Not both flanks of (Sun|Moon) are occupied$/, (m) => `Planeettoja ei ole ${m[1] === 'Sun' ? 'Auringon' : 'Kuun'} molemmilla puolilla`],
  [/^Moon unattended — no eligible planets in 2nd or 12th$/, () => 'Kuu ilman seuralaisia — ei kelpaavia planeettoja 2. tai 12. merkissä'],
  [/^Moon flanked by: (.+)$/, (m) => `Kuun vierusmerkeissä: ${m[1]}`],
  [/^Jupiter in house (\d+) \(Kendra\), Moon in house (\d+) \(Trikona\)$/, (m) => `Jupiter talossa ${m[1]} (Kendra), Moon talossa ${m[2]} (Trikona)`],
  [/^Jupiter in Kendra but Moon in house (\d+) \(not Trikona\)$/, (m) => `Jupiter on Kendrassa, mutta Moon talossa ${m[1]} (ei Trikona)`],
  [/^Jupiter in house (\d+) \(not Kendra\)$/, (m) => `Jupiter talossa ${m[1]} (ei Kendra)`],
  [/^(\S+) \+ (\S+) in (\S+)$/, (m) => `${m[1]} + ${m[2]} merkissä ${m[3]}`],
  [/^No Kendra lord and Trikona lord are in the same sign$/, () => 'Kendra-herra ja Trikona-herra eivät ole samassa merkissä'],
  [/^(\S+) rules both 2nd and 11th — concentrated in (\S+)$/, (m) => `${m[1]} hallitsee sekä 2. että 11. taloa — keskittynyt merkkiin ${m[2]}`],
  [/^(\S+) rules both 2nd and 11th but not found in chart$/, (m) => `${m[1]} hallitsee sekä 2. että 11. taloa, mutta sitä ei löydy kartasta`],
  [/^(\S+) \(2nd lord\) and (\S+) \(11th lord\) conjunct in (\S+)$/, (m) => `${m[1]} (2. herra) ja ${m[2]} (11. herra) yhtymässä merkissä ${m[3]}`],
  [/^(\S+) \(2nd lord\) in (\S+), (\S+) \(11th lord\) in (\S+)$/, (m) => `${m[1]} (2. herra) merkissä ${m[2]}, ${m[3]} (11. herra) merkissä ${m[4]}`],
  [new RegExp(`^Moon is in the ${ORD} sign from Jupiter$`), (m) => `Moon on Jupiterista lukien ${m[1]}. merkissä`],
  [new RegExp(`^Moon is in the ${ORD} sign from Jupiter \\(not 6th or 8th\\)$`), (m) => `Moon on Jupiterista lukien ${m[1]}. merkissä (ei 6. eikä 8.)`],
  [/^Moon in house (\d+) \(Kendra\)$/, (m) => `Moon talossa ${m[1]} (Kendra)`],
  [/^Moon in house (\d+) \(not a Kendra\)$/, (m) => `Moon talossa ${m[1]} (ei Kendra)`],
  [/^Exalted: (\d+), Debilitated: (\d+) — not equal$/, (m) => `Korotettuja: ${m[1]}, heikennettyjä: ${m[2]} — ei yhtä paljon`],
  [/^Exalted: (.+)$/, (m) => `Korotettu: ${m[1]}`],
  [/^Debilitated: (.+)$/, (m) => `Heikennetty: ${m[1]}`],
  [/^(\d+) exalted planets? — need 3\+$/, (m) => `Korotettuja planeettoja: ${m[1]} — tarvitaan 3+`],
  [/^(\d+) debilitated planets? — need 3\+$/, (m) => `Heikennettyjä planeettoja: ${m[1]} — tarvitaan 3+`],
  [/^(\d+) exalted \((.*)\), (\d+) debilitated \((.*)\)$/, (m) => `${m[1]} korotettua (${m[2]}), ${m[3]} heikennettyä (${m[4]})`],
  [/^(\S+) in (\S+) \((exaltation|own sign)\), house (\d+)$/, (m) => `${m[1]} merkissä ${m[2]} (${QUALITY[m[3] as keyof typeof QUALITY]}), talo ${m[4]}`],
  [/^(\S+) in (\S+) — not own or exaltation sign$/, (m) => `${m[1]} merkissä ${m[2]} — ei oma- eikä korotusmerkki`],
  [/^(\S+) in (\S+) \((exaltation|own sign)\) but in house (\d+) — not Kendra$/, (m) => `${m[1]} merkissä ${m[2]} (${QUALITY[m[3] as keyof typeof QUALITY]}), mutta talossa ${m[4]} — ei Kendra`],
  [/^Moon and Mars conjunct in (\S+)$/, (m) => `Moon ja Mars yhtymässä merkissä ${m[1]}`],
  [/^Moon \((\S+)\) and Mars \((\S+)\) mutually aspect$/, (m) => `Moon (${m[1]}) ja Mars (${m[2]}) aspektoivat toisiaan`],
  [/^Moon \((\S+)\) and Mars \((\S+)\) — no conjunction or mutual aspect$/, (m) => `Moon (${m[1]}) ja Mars (${m[2]}) — ei yhtymää eikä keskinäistä aspektia`],
  [/^Sun and Mercury in (\S+)(?: — Mercury combust \((.+)° from Sun\))?$/, (m) => `Sun ja Mercury merkissä ${m[1]}${m[2] ? ` — Mercury polttunut (${m[2]}° Auringosta)` : ''}`],
  [/^Sun in (\S+), Mercury in (\S+) — not conjunct$/, (m) => `Sun merkissä ${m[1]}, Mercury merkissä ${m[2]} — ei yhtymässä`],
  [/^(.+) in Lagna$/, (m) => `${m[1]} lagnassa`],
  [/^(.+) aspecting Lagna$/, (m) => `${m[1]} aspektoi lagnaa`],
  [/^No benefic occupies or aspects Lagna$/, () => 'Mikään hyväntekijä ei ole lagnassa eikä aspektoi sitä'],
  [/^Definition pending — exact rule required$/, () => 'Määritelmä kesken — tarkka sääntö puuttuu'],
];

function translateSegment(segment: string): string {
  for (const [pattern, build] of RULES) {
    const match = pattern.exec(segment);
    if (match) return build(match);
  }
  return segment;
}

/** The yoga engine's reason text in the interface language; English passes through. */
export function translateYogaText(text: string, language: Language): string {
  if (language !== 'fi') return text;
  return text.split('; ').map(translateSegment).join('; ');
}
