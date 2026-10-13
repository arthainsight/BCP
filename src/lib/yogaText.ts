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

const RULES: Rule[] = [
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
