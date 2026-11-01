import { combustionOf } from './combustion';
import { navamshaSign } from './birthConditions';
import { DEBILITATION, EXALTATION, NATURAL_ENEMIES, NATURAL_FRIENDS, OWN_SIGNS } from './dignity';
import { lordOfSign } from './topicCore';

/**
 * Phaladīpikā chapter 9, "Lagnaphalabheda" (Mantreśvara), with the Hindi commentary of the edition: the lagna by each of the twelve signs (verses 1–12), the same for the Moon sign (13), and the result of a graha by its dignity: exalted (14), in its own
 * sign (15), in a friend's sign (16), in an enemy's sign (17), in its fall (18), combust or in a neutral sign (19), then the retrograde and the vargottama graha (20). The Sanskrit is the text layer of the edition (a scan of the print) with the plain misreadings corrected; the
 * results are short summaries written for the app and the verse decides. The commentary quotes the Jātakābharaṇa and other books after each verse, with the result of each graha by its dignity; those are not used.
 */
export interface LagnaPhalaVerse { verse: number; sanskrit: string[]; gloss: string; note?: string }
export const LAGNA_PHALA_VERSES: LagnaPhalaVerse[] = [
  { verse: 1, sanskrit: ["वृत्तेक्षणो दुर्बलजानुरुग्रो भीरुर्जले स्याल्लघुभुक् सुकामी ।", "सञ्चारशीलश्चपलोऽनृतोक्तिर्व्रणाङ्कितांगः क्रियभे प्रजातः ॥१॥"], gloss: "Round eyes, weak knees, fierce; timid of water, eats little, very amorous, a wanderer, fickle, untruthful, the body marked by wounds." },
  { verse: 2, sanskrit: ["पृथूरुवक्त्रः कृषिकर्मकृत्स्यान्मध्यान्तसौख्यः प्रमदाप्रियश्च ।", "त्यागी क्षमी क्लेशसहश्च गोमान् पृष्ठास्यपार्श्वेऽङ्कयुतो वृषे स्यात् ॥२॥"], gloss: "Broad face and thighs; lives by farming; happy in the middle and end of life; dear to women; generous, forbearing, enduring of hardship; rich in cattle; marks on the back, face and sides." },
  { verse: 3, sanskrit: ["श्यामेक्षणः कुञ्चितमूर्धजः स्त्रीक्रीडानुरक्तश्च परेङ्गितज्ञः ।", "उत्तुङ्गनासः प्रियगीतनृत्तो वसन् सदान्तः सदने च युग्मे ॥३॥"], gloss: "Dark eyes, curly hair; fond of dalliance with women; reads the signs others give; a high nose; loves song and dance; stays at home." },
  { verse: 4, sanskrit: ["स्त्रीनिर्जितः पीनगलः समित्रो बह्वालयस्तुङ्गकटिर्धनाढ्यः ।", "ह्रस्वश्च वक्रो द्रुतगः कुलीरे मेधान्वितस्तोयरतोऽल्पपुत्रः ॥४॥"], gloss: "Overcome by women, a thick neck; many friends and houses; a high waist, wealthy; short, crooked, quick in his walk; intelligent, fond of water; few sons." },
  { verse: 5, sanskrit: ["पिङ्गेक्षणः स्थूलहनुर्विशालवक्त्रोऽभिमानी सपराक्रमः स्यात् ।", "कुप्यत्यकार्ये वनशैलगामी मातुर्विधेयः स्थिरधीर्मृगेन्द्रे ॥५॥"], gloss: "Tawny eyes, a heavy jaw, a large face; proud and brave; angry at what is wrong; roams the forests and the hills; obedient to his mother, steady-minded." },
  { verse: 6, sanskrit: ["स्रस्तांसबाहुः परवित्तगेहैः सम्पूज्यते सत्यरतः प्रियोक्तिः ।", "ब्रीडालसाक्षः सुरतप्रियः स्याच्छास्त्रार्थविच्चाल्पसुतोऽङ्गनायाम् ॥६॥"], gloss: "Drooping shoulders and arms; honoured through the wealth and houses of others; truthful and sweet in speech; shy eyes, fond of love, knows the meaning of the scriptures; few sons." },
  { verse: 7, sanskrit: ["चलत्कृशाङ्गोऽल्पसुतोऽतिभक्तो देवद्विजानामटनो द्विनामा ।", "प्रांशुश्च दक्षः क्रयविक्रयेषु धीरोऽदयस्तौलिनि मध्यवादी ॥७॥"], gloss: "A moving, lean body, few sons; very devout, wanders to the gods and the brahmins; known by two names; tall, skilled in buying and selling; steady, merciless, moderate in speech." },
  { verse: 8, sanskrit: ["वृत्तोरुजङ्घः पृथुनेत्रवक्षा रोगी शिशुत्वे गुरुतातहीनः ।", "क्रूरक्रियो राजकुलाभिमुख्यः कीटेऽब्जरेखाङ्कितपाणिपादः ॥८॥"], gloss: "Round thighs and shanks, broad eyes and chest; sickly as a child, parted from his father and elders; cruel in his acts, turned to the royal family; lotus lines on the hands and feet." },
  { verse: 9, sanskrit: ["दीर्घास्यकण्ठः पृथुकर्णनासः कर्मोद्यतः कुब्जतनुर्नृपेष्टः ।", "प्रागल्भ्यवाक्त्यागयुतोऽरिहन्ता साम्नैकसाध्योऽश्विभवो बलाढ्यः ॥९॥"], gloss: "A long face and neck, large ears and nose; industrious, hunched, dear to kings; mature in speech, generous; conquers his enemies, to be won only by kindness; strong." },
  { verse: 10, sanskrit: ["अधः कृशः सत्त्वयुतो गृहीतवाक्योऽलसोऽगम्यजराङ्गनेष्टः ।", "धर्मध्वजो भाग्ययुतोऽटनश्च वातार्दितो नक्रभवो विलज्जः ॥१०॥"], gloss: "Lean in the lower body but strong in mind; takes in what others say, lazy; fond of older women, even forbidden ones; a show of dharma, fortunate, a wanderer; wind disease, shameless." },
  { verse: 11, sanskrit: ["प्रच्छन्नपापो घटतुल्यदेहो विघातदक्षोऽध्वसहोऽल्पवित्तः ।", "लुब्धः परार्थी क्षयवृद्धियुक्तो घटोद्भवः स्यात्प्रियगन्धपुष्पः ॥११॥"], gloss: "Secretly sinful, a body like a pot; skilled at striking, enduring of journeys; little wealth, greedy, working for others; waxing and waning in fortune; loves scents and flowers." },
  { verse: 12, sanskrit: ["अत्यम्बुपानः समचारुदेहः स्वदारगस्तोयजवित्तभोक्ता ।", "विद्वान्कृतज्ञोऽभिभवत्यमित्रान् शुभेक्षणो भाग्ययुतोऽन्त्यराशौ ॥१२॥"], gloss: "Drinks much water; a well-proportioned, handsome body; keeps to his own wife; enjoys wealth from the products of water; learned, grateful, overcomes his enemies; fine eyes, fortunate." },
  { verse: 13, sanskrit: ["राशेः स्वभावाश्रयरूपवर्णान् ज्ञात्वाऽनुरूपाणि फलानि तस्य ।", "युक्त्या वदेदत्र फलं विलग्ने यच्चन्द्रलग्नेऽपि तदेव वाच्यम् ॥१३॥"], gloss: "The nature, place, form and colour of the sign are to be understood and the results told from them; what is said of the lagna is to be said of the Moon sign too." },
  { verse: 14, sanskrit: ["ग्रहे सति निजोच्चगे भवति रत्नगर्भाधिपो", "महीपतिकृतस्तुतिर्महितसम्पदामालयः ।", "उदारगुणसंयुतो जयति विक्रमार्को यथा", "नये यशसि विक्रमे वितरणे धृतौ कौशले ॥१४॥"], gloss: "A graha in its exaltation sign: a king, honoured by kings with gifts and praise, a home of wealth; generous and virtuous, with a fame like Vikramārka's in policy, renown, valour, giving, firmness and skill." },
  { verse: 15, sanskrit: ["स्वमन्दिरगते ग्रहे प्रभुपरिग्रहादायतिं", "प्रभुत्वमपि वा गृहस्थितिमचञ्चलां प्राप्नुयात् ।", "नवं भुवनमुर्वराक्षितिमुपैति काले स्वके", "जने बहुमतिं पुनः सकलनष्टवस्तून्यपि ॥१५॥"], gloss: "A graha in its own sign: strength from the great or lordship; a stable home, a new house and fertile land; lost things are regained; much honoured." },
  { verse: 16, sanskrit: ["ग्रहः सुहृत्क्षेत्रगतः सुहृद्भिः कार्यस्य सिद्धिं नवसौहृदं च ।", "… धनधान्यभाग्यं ददात्ययं सर्वजनानुकूल्यम् ॥१६॥"], gloss: "A graha in a friend's sign: success in his undertakings through friends, new friends; good sons, wife, grain, wealth and fortune; liked by all.", note: "The first words of the second line were unreadable in the scan." },
  { verse: 17, sanskrit: ["गते ग्रहे शत्रुगृहं निकृष्टतां परान्नवृत्तिं परमन्दिरस्थितिम् ।", "अकिञ्चनत्वं रिपुपीडनं सदा स्निग्धोऽपि तस्यातिरिपुत्वमाप्नुयात् ॥१७॥"], gloss: "A graha in an enemy's sign: low standing, living on the food and in the houses of others, poverty, harassment by enemies; even his friends turn to enemies." },
  { verse: 18, sanskrit: ["नीचे ग्रहेऽधः पतनं स्ववृत्तेर्दैन्यं दुराचारमृणाप्तिमाहुः ।", "नीचाश्रयं कीकटदेशवासं भृत्यत्वमध्वानमनर्थकार्यम् ॥१८॥"], gloss: "A graha in its fall: a fall of his livelihood, wretchedness, evil conduct and debts; dependent on low people, a servant, tired by journeys, doing useless work, living in a despised land." },
  { verse: 19, sanskrit: ["… मौढ्यं प्राप्तो मरणमचिरात् स्त्रीसुतधनैः", "प्रहीणत्वं व्यर्थे कलहमपवादं परिभवम् ।", "समर्क्षस्थः खेटो न कलयति वैशेषिकफलं", "सुखं वा दुःखं वा जनयति यथापूर्वमचलम् ॥१९॥"], gloss: "A combust graha: foolishness, death soon (in its daśā), loss of wife, children and wealth, a quarrel for nothing, slander and humiliation. A graha in a neutral (sama) sign gives nothing special: happiness or sorrow stay as they were.", note: "The first word was unreadable in the scan." },
  { verse: 20, sanskrit: ["वक्रं गतः स्वोच्चफलं विदध्यात् सपत्ननीचर्क्षगतोऽपि खेटः ।", "वर्गोत्तमांशस्थितखेचरोऽपि स्वक्षेत्रगस्योक्तफलानि तद्वत् ॥२०॥"], gloss: "A retrograde graha gives the result of exaltation, even in an enemy's sign or its fall; a graha in a vargottama navāṁśa gives the results told for its own sign." },
];

/** The seven grahas the chapter speaks of (Rāhu and Ketu are not in it). */
export const DIGNITY_GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
export type DignityGraha = (typeof DIGNITY_GRAHAS)[number];
/** The dignity of 14–19, and the verse that gives its result. */
export type Dignity = 'exalted' | 'own' | 'friend' | 'enemy' | 'debilitated' | 'neutral';
export const DIGNITY_VERSE: Record<Dignity, number> = { exalted: 14, own: 15, friend: 16, enemy: 17, debilitated: 18, neutral: 19 };

export interface LagnaPhalaReading {
  /** 1–12: the verse of the lagna sign, and the same for the Moon sign (13). */
  lagnaVerse: number;
  moonVerse: number | null;
  grahas: { graha: DignityGraha; sign: number; dignity: Dignity; verse: number; combust: boolean; retrograde: boolean; vargottama: boolean }[];
}

export interface LagnaPhalaChart {
  ascendantSign: number;
  planets: { name: string; sign: number; longitude: number; isRetrograde?: boolean }[];
}

/**
 * The dignity of a graha in a sign: its exaltation or fall, its own sign, the sign of a natural friend or of a natural enemy of it, or else a neutral one. (The text says "friend" and "enemy"; the natural friendship is used.)
 * A graha that is exalted or in its fall is told by that, whatever the friendship.
 */
export function dignityOf(graha: DignityGraha, sign: number): Dignity {
  if (EXALTATION[graha] === sign) return 'exalted';
  if (DEBILITATION[graha] === sign) return 'debilitated';
  if (OWN_SIGNS[graha]?.includes(sign)) return 'own';
  const lord = lordOfSign(sign);
  if ((NATURAL_FRIENDS[graha] ?? []).includes(lord)) return 'friend';
  if ((NATURAL_ENEMIES[graha] ?? []).includes(lord)) return 'enemy';
  return 'neutral';
}

export function lagnaPhalaReading(chart: LagnaPhalaChart): LagnaPhalaReading {
  const sun = chart.planets.find(planet => planet.name === 'Sun');
  const moon = chart.planets.find(planet => planet.name === 'Moon');
  const grahas = DIGNITY_GRAHAS.flatMap(graha => {
    const body = chart.planets.find(planet => planet.name === graha);
    if (!body) return [];
    const dignity = dignityOf(graha, body.sign);
    return [{
      graha, sign: body.sign, dignity, verse: DIGNITY_VERSE[dignity],
      combust: Boolean(sun && graha !== 'Sun' && combustionOf(graha, body.longitude, sun.longitude, body.isRetrograde === true) !== null),
      retrograde: graha !== 'Sun' && graha !== 'Moon' && body.isRetrograde === true,
      vargottama: navamshaSign(body.longitude) === body.sign,
    }];
  });
  return { lagnaVerse: chart.ascendantSign, moonVerse: moon ? moon.sign : null, grahas };
}
