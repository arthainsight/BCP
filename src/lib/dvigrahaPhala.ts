import { navamshaSign } from './birthConditions';
import { SEVEN, aspectors, find, lordOfSign, type SevenGraha, type TopicContext } from './topicCore';

/**
 * Phaladīpikā chapter 18, "Dvigrahayoga-phala" (Mantreśvara), with the Hindi commentary of the edition: the results of two grahas in one sign (verses 1–5, 21 pairs), of the Moon in each sign seen by the other six
 * grahas (6–11, 12 × 6) and of the Moon in the navāṁśa of each graha seen by the other six (12–15, 7 × 6), then how the two are to be weighed (16–17). The verses are printed as the text layer of the edition has them
 * (a scan of the print; a few letters are misread); the summaries are written for the app and the verse decides.
 */
export const DVIGRAHA_VERSES: { verse: number; sanskrit: string[] }[] = [
  { verse: 1, sanskrit: ['तिग्मांशुर्जनयत्युषेशसहितो यन्त्राश्मकारं नरं', 'भौमेनाघरतं बुधेन निपुणं धीकीर्तिसौख्यान्वितम्‌ ।', 'क्रूरं वाक्पतिनान्यकार्यनिरतं शुक्रेण रङ्गायुधै-', 'रविजेन धातुकुशलं भाण्डप्रकारेषु वा ॥१॥'] },
  { verse: 2, sanskrit: ['कूटस्त्र्यासवकुम्भपण्यमशिवं मातुः शशी', 'प्रश्रितवाक्यमर्थनिपुणं सौभाग्यकीर्त्यान्वितम्‌ ।', 'विक्रान्तं कुलमुख्यमस्थिरमतिं वित्तेश्वरं साङ्गिरा', 'वस्त्राणां ससितः क्रियादिकुशलं सार्किः पुनर्भूसुतम्‌ ॥२॥'] },
  { verse: 3, sanskrit: ['मूलादिस्नेहकूटैर्व्यवहरति वणिग्बाहुयोद्धा ससौम्ये', 'पुर्यध्यक्षः सजीवे भवति नरपतिः प्राप्तवित्तो द्विजो वा ।', 'गोपो मल्लोऽथ दक्षः परयुवतिरतो द्यूतकृत्सासुरेज्ये', 'दुःखार्तोऽसत्यसन्धः ससवितृतनये भूमिजे निन्दितश्च ॥३॥'] },
  { verse: 4, sanskrit: ['सौम्ये रङ्गचरो बृहस्पतियुते गीतप्रियो नृत्यविद्', 'वाग्मी भूगणपः सितेन मृदुना मायापटुर्लम्पटः ।', 'सद्विद्यो धनदारवान् बहुगुणः शुक्रेण युक्ते गुरौ', 'ज्ञेयः श्मश्रुकरोऽसितेन घटकृज्जातोऽन्नकारोऽपि वा ॥४॥'] },
  { verse: 5, sanskrit: ['असितसितसमागमेऽल्पचक्षु-', 'र्युवतिसमाश्रयसम्प्रवृद्धवित्तः ।', 'भवति च लिखिपुस्तकचित्रवेत्ता', 'कथितफलैः परतो विकल्पनीयाः ॥५॥'] },
  { verse: 6, sanskrit: ['भूपो विद्वान् भूपतिर्भूपतुल्यश्चन्द्रे मेषे मोषको निर्धनश्च ।', 'निस्स्वः स्तेनो लोकमान्यो महीशः स्वाढ्यः प्रेष्यश्चापि दृष्टे कुजाद्यैः ॥६॥'] },
  { verse: 7, sanskrit: ['युग्मस्थेऽयोजीविभूपज्ञधृष्टाश्चन्द्रे दृष्टे तन्तुवायोऽधनी च ।', 'स्वक्षें योधप्राज्ञसूरिक्षितीशा लोहाजीवो नेत्ररोगी क्रमेण ॥७॥'] },
  { verse: 8, sanskrit: ['राजा ज्योतिर्विद्धनाढ्यो नरेन्द्रः सिंहे चन्द्रे नापितः पार्थिवेन्द्रः ।', 'दक्षो भूपः सैन्यपः कन्यकायां निष्णातः स्याद्भूमिनाथश्च भूपः ॥८॥'] },
  { verse: 9, sanskrit: ['शठो नृपस्तौलिनि रुक्मकारश्चन्द्रे वणिक् स्यात्पिशुनः खलश्च ।', 'कीटे नृपो युग्मपिता महीशः स्याद्रजीवी विकृताङ्गवित्तः ॥९॥'] },
  { verse: 10, sanskrit: ['धूर्तो हयाङ्गे स्वजनं जनेशं नरौघमाश्रित्य शठः सदम्भः ।', 'भूपो नरेशः क्षितिपो विपश्चिद्धनी दरिद्रो मकरे हिमांशौ ॥१०॥'] },
  { verse: 11, sanskrit: ['कुम्भेऽन्यदारनिरतः क्षितिपो नरेन्द्रो', 'वेश्यापतिर्नृपवरो हिमगौ नृमान्यः ।', 'अन्त्येऽघकृत्पटुमतिर्नृपतिश्च विद्वान्', 'दोषैकदृग्दुरितकृच्च कुजादिदृष्टे ॥११॥'] },
  { verse: 12, sanskrit: ['आरक्षको वधरुचिः कुशलश्च युद्धे', 'भूपोऽर्थवान्कलहकृत्क्षितिजांशसंस्थे ।', 'मूर्खोऽन्यदारनिरतः सुकविः सितांशे', 'सत्काव्यकृत्सुखपरोऽन्यकलत्रगश्च ॥१२॥'] },
  { verse: 13, sanskrit: ['बौधे हि रङ्गचरचोरकवीन्द्रमन्त्र-', 'गेयज्ञशिल्पनिपुणः शशिनि स्थितेंऽशे ।', 'स्वांशेऽल्पगात्रधनलुब्धतपस्विमुख्यः', 'स्त्रीप्रेष्यकृत्यनिरतश्च निरीक्ष्यमाणे ॥१३॥'] },
  { verse: 14, sanskrit: ['सक्रोधो नरपतिसम्मतो निधीशः', 'सिंहांशे प्रभुरसुतोऽतिहिंस्रकर्मा ।', 'जीवांशे प्रथितबलो रणोपदेष्टा', 'हास्यज्ञः सचिवविकामवृद्धशीलः ॥१४॥'] },
  { verse: 15, sanskrit: ['अल्पापत्यो दुःखितः सत्यपि स्वे मानासक्तः कर्मणि स्वेऽनुरक्तः ।', 'दुष्टस्त्रीष्टः कोपनश्चार्किभागे चन्द्रे भानौ तद्वदिन्द्वादिदृष्टे ॥१५॥'] },
  { verse: 16, sanskrit: ['सूर्यादितोऽत्रांशफलं प्रदिष्टं ज्ञेयं नवांशस्य फलं तदेव ।', 'राशीक्षणे यत्फलमुक्तमिन्दोस्तद्द्वादशांशस्य फलं हि वाच्यम् ॥१६॥'] },
  { verse: 17, sanskrit: ['वर्गोत्तमस्वपरगेषु शुभं यदुक्तं', 'तत्पुष्टमध्यलघुताऽशुभमुत्क्रमेण ।', 'वीर्यान्वितोंऽशकपतिर्निरुणद्धि पूर्वं', 'राशीक्षणस्य फलमंशफलं ददाति ॥१७॥'] },
];

/** 18.1–5: two grahas in one sign. The key is the two names in the order Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn. */
export const PAIR_RESULTS: Record<string, { verse: number; gloss: string }> = {
  'Sun+Moon': { verse: 1, gloss: 'A mechanic or a stone craftsman.' },
  'Sun+Mars': { verse: 1, gloss: 'Given to sinful deeds.' },
  'Sun+Mercury': { verse: 1, gloss: 'Clever, intelligent, famous and happy.' },
  'Sun+Jupiter': { verse: 1, gloss: 'Cruel-minded, doing the work of others, helpful to them.' },
  'Sun+Venus': { verse: 1, gloss: 'Earns by the arts of the stage and the handling of weapons.' },
  'Sun+Saturn': { verse: 1, gloss: 'Skilled in metal work and in making vessels.' },
  'Moon+Mars': { verse: 2, gloss: 'A dealer in coarse tools, women, liquor and pots; slights the mother.' },
  'Moon+Mercury': { verse: 2, gloss: 'Sweet-spoken, a skilled expounder, fortunate and of good fame.' },
  'Moon+Jupiter': { verse: 2, gloss: 'Conquers enemies, head of his family, fickle, wealthy.' },
  'Moon+Venus': { verse: 2, gloss: 'Skilled in sewing, weaving and dyeing of cloth.' },
  'Moon+Saturn': { verse: 2, gloss: 'The son of a remarried widow.' },
  'Mars+Mercury': { verse: 3, gloss: 'Trades in herbs, oils and medicines; a wrestler.' },
  'Mars+Jupiter': { verse: 3, gloss: 'The head of a city, a king, or a wealthy brahmin.' },
  'Mars+Venus': { verse: 3, gloss: 'A cowherd, a wrestler, after others\' wives, a gambler.' },
  'Mars+Saturn': { verse: 3, gloss: 'Unhappy, untruthful and despised.' },
  'Mercury+Jupiter': { verse: 4, gloss: 'A stage performer, skilled in song and dance.' },
  'Mercury+Venus': { verse: 4, gloss: 'A lord of land or head of a troop.' },
  'Mercury+Saturn': { verse: 4, gloss: 'Deceitful and sensual.' },
  'Jupiter+Venus': { verse: 4, gloss: 'Learned, with wealth and a wife, of many virtues.' },
  'Jupiter+Saturn': { verse: 4, gloss: 'A barber, a potter or a cook.' },
  'Venus+Saturn': { verse: 5, gloss: 'Short-sighted, wealth through women, a writer or painter.' },
};

export const ASPECTING_IN_SIGNS: SevenGraha[] = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun'];
export const ASPECTING_IN_NAVAMSHA: SevenGraha[] = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/** 18.6–11: the Moon in each sign (1–12) seen by Mars, Mercury, Jupiter, Venus, Saturn and the Sun, in that order. */
const SIGN_ROWS: { verse: number; results: string[] }[] = [
  { verse: 6, results: ['a king', 'learned', 'a king', 'like a king', 'a thief', 'poor'] },
  { verse: 6, results: ['without wealth', 'a thief', 'respected by people', 'a king', 'wealthy', 'a servant'] },
  { verse: 7, results: ['an iron-worker', 'a king', 'learned', 'bold and impudent', 'a weaver', 'poor'] },
  { verse: 7, results: ['a warrior', 'wise', 'learned', 'a king', 'an iron-worker', 'eye disease'] },
  { verse: 8, results: ['a king', 'an astrologer', 'wealthy', 'a king', 'a barber', 'a king'] },
  { verse: 8, results: ['skilful', 'a king', 'an army commander', 'accomplished in all works', 'a lord of land', 'a king'] },
  { verse: 9, results: ['a rogue', 'a king', 'a goldsmith', 'a merchant', 'a slanderer', 'wicked'] },
  { verse: 9, results: ['a king', 'the father of twins', 'a king', 'a dealer in cloth', 'deformed', 'poor'] },
  { verse: 10, results: ['cunning', 'chief among his kin', 'a protector of the multitude', 'a refuge of the multitude', 'wicked', 'hypocritical'] },
  { verse: 10, results: ['a king', 'a ruler of men', 'an owner of land', 'a scholar', 'wealthy', 'poor'] },
  { verse: 11, results: ['after others\' wives', 'an owner of land', 'a king', 'consorting with prostitutes', 'the best of kings', 'honoured by the multitude'] },
  { verse: 11, results: ['a doer of sin', 'clever', 'a king', 'learned', 'a fault-finder', 'evil-souled'] },
];
export function moonInSignResult(sign: number, aspecting: SevenGraha): { verse: number; gloss: string } | null {
  const row = SIGN_ROWS[sign - 1]; const index = ASPECTING_IN_SIGNS.indexOf(aspecting);
  return row && index >= 0 ? { verse: row.verse, gloss: row.results[index] } : null;
}

/** 18.12–15: the Moon in the navāṁśa of Mars, Venus, Mercury, the Moon, the Sun, Jupiter and Saturn, seen by the Sun, Mars, Mercury, Jupiter, Venus and Saturn, in that order. */
const NAVAMSHA_ROWS: Record<string, { verse: number; results: string[] }> = {
  Mars: { verse: 12, results: ['a guard of the city', 'bent on killing', 'a wrestler skilled in war', 'a king', 'wealthy', 'quarrelsome'] },
  Venus: { verse: 12, results: ['foolish', 'after others\' wives', 'a poet', 'a writer of good verse', 'bent on comfort', 'after others\' wives'] },
  Mercury: { verse: 13, results: ['a stage performer', 'a thief', 'the foremost of poets', 'a king\'s minister', 'a musician', 'a craftsman'] },
  Moon: { verse: 13, results: ['lean-bodied', 'greedy for wealth', 'the foremost of ascetics', 'renowned', 'a slave of women', 'devoted to work'] },
  Sun: { verse: 14, results: ['wrathful', 'a friend of the king', 'a lord of treasure', 'a lord of a company', 'childless', 'violent'] },
  Jupiter: { verse: 14, results: ['a renowned fighter', 'skilled in war', 'cheerful', 'a king\'s minister', 'without sexual desire', 'behaving like an old man'] },
  Saturn: { verse: 15, results: ['with few children', 'unhappy though he has wealth', 'attached to honour', 'devoted to his own work', 'longing for a wicked woman', 'wrathful'] },
};
export function moonInNavamshaResult(navamshaLord: string, aspecting: SevenGraha): { verse: number; gloss: string } | null {
  const row = NAVAMSHA_ROWS[navamshaLord]; const index = ASPECTING_IN_NAVAMSHA.indexOf(aspecting);
  return row && index >= 0 ? { verse: row.verse, gloss: row.results[index] } : null;
}

export interface DvigrahaReading {
  pairs: { pair: string; sign: number; verse: number; gloss: string }[];
  /** More than two grahas in a sign: the pairs are combined (18.5). */
  crowdedSigns: number[];
  moon: {
    sign: number;
    seenBy: { graha: SevenGraha; verse: number; gloss: string }[];
    navamshaSign: number;
    navamshaLord: string;
    seenInNavamsha: { graha: SevenGraha; verse: number; gloss: string }[];
    /** 18.17: the Moon in a vargottama, own or another's navāṁśa: the good results are the most, the middle, the least (the bad ones the other way). */
    placement: 'vargottama' | 'own' | 'other';
  } | null;
}

export function dvigrahaReading(context: TopicContext): DvigrahaReading {
  const pairs: DvigrahaReading['pairs'] = [];
  const crowdedSigns: number[] = [];
  for (let sign = 1; sign <= 12; sign++) {
    const here = SEVEN.filter(name => find(context, name)?.sign === sign);
    if (here.length > 2) crowdedSigns.push(sign);
    for (let a = 0; a < here.length; a++) for (let b = a + 1; b < here.length; b++) {
      const key = `${here[a]}+${here[b]}`;
      const found = PAIR_RESULTS[key];
      if (found) pairs.push({ pair: key, sign, ...found });
    }
  }
  const moon = find(context, 'Moon');
  if (!moon) return { pairs, crowdedSigns, moon: null };
  const seers = aspectors(context, moon.sign, 'Moon');
  const nSign = navamshaSign(moon.longitude);
  const nLord = lordOfSign(nSign);
  return {
    pairs, crowdedSigns,
    moon: {
      sign: moon.sign,
      seenBy: seers.map(graha => ({ graha, ...moonInSignResult(moon.sign, graha)! })),
      navamshaSign: nSign, navamshaLord: nLord,
      seenInNavamsha: seers.map(graha => ({ graha, ...(moonInNavamshaResult(nLord, graha) ?? { verse: 0, gloss: '' }) })).filter(item => item.verse > 0),
      placement: nSign === moon.sign ? 'vargottama' : nLord === 'Moon' ? 'own' : 'other',
    },
  };
}
