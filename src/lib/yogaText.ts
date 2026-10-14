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
  [/^Lagna lord is not strong \(own or exaltation sign, Kendra or Trikona\)$/, () => 'Lagnan herra ei ole vahva (oma- tai korotusmerkki, Kendra tai Trikona)'],
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
  [/^Benefics in houses 1 and 9, benefic and malefic in the 5th, malefics in houses 4 and 8$/, () => 'Hyväntekijät taloissa 1 ja 9, hyväntekijä ja pahantekijä 5. talossa, pahantekijät taloissa 4 ja 8'],
];

const RULES: Rule[] = [
  ...CLASSICAL_RULES,
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
