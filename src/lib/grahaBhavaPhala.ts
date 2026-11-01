/**
 * Phaladīpikā chapter 8, "Grahabhāvaphalabheda" (Mantreśvara), with the Hindi commentary of the edition: the results of each graha, Rāhu and Ketu in the twelve houses from the lagna (verses 1–33), then how near the middle of the house a graha must be
 * to give the whole result (34–35). Rāhu and Ketu stand in the same text as the seven (25–33). The Sanskrit is printed as the text layer of the edition has it (a scan of the print) with the obvious misreadings corrected; where letters could not be read (26, the first words of 15)
 * the verse says so. The results are short summaries written for the app from the Sanskrit and the commentary, and the verse decides. The commentary also quotes the Sārāvalī and the Jātakābharaṇa; those are not used.
 */
export type BhavaGraha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';
export const BHAVA_GRAHAS: readonly BhavaGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export interface GrahaBhavaVerse { verse: number; graha: BhavaGraha | null; houses: number[]; sanskrit: string[]; note?: string }
export const GRAHA_BHAVA_VERSES: GrahaBhavaVerse[] = [
  { verse: 1, graha: "Sun", houses: [1], sanskrit: ["लग्नेऽर्केऽल्पकचः क्रियालसतमः क्रोधी प्रचण्डोन्नतो", "मानी लोचनरूक्षकः कृशतनुः शूरोऽक्षमो निर्घृणः ।", "स्फोटाक्षः शशिभे क्रिये सतिमिरः सिंहे निशान्धः पुमान्", "दारिद्र्योपहतो विनष्टतनयो जातस्तुलायां भवेत् ॥१॥"] },
  { verse: 2, graha: "Sun", houses: [2, 3, 4], sanskrit: ["विगतविद्याविनयवित्तं स्खलितवाचं धनगतः", "सबलशौर्यश्रियमुदारं स्वजनशत्रुं सहजगः।", "जनयतीमं सुहृदि सूर्यो विसुखबन्धुक्षितिसुहृद्", "भवनमुक्तं नृपतिसेवा जनकसम्पत्क्षयकरम् ॥२॥"] },
  { verse: 3, graha: "Sun", houses: [5, 6, 7, 8], sanskrit: ["सुखधनायुस्तनयहीनं सुमतिमात्मन्यटविगं", "प्रथितमुर्वीपतिमरिस्थः सुगुणसम्पद्विजयगम् ।", "नृपविरुद्धं कुतनुमस्तेऽध्वगमदारं ह्यवमतं", "हतधनायुः सुहृदमर्कः विगतदृष्टिं निधनगः ॥३॥"] },
  { verse: 4, graha: "Sun", houses: [9, 10, 11, 12], sanskrit: ["विजनकोऽर्केऽसुतबन्धुस्तपसि देवद्विजमनाः", "ससुतयानस्तुतिमतिश्रीबलयशाः खे क्षितिपतिः ।", "भवगतेऽर्के बहुधनायुर्विगतशोको जनपतिः", "पितुरमित्रं विकलनेत्रो विधनपुत्रो व्ययगते ॥४॥"] },
  { verse: 5, graha: "Moon", houses: [1, 2, 3], sanskrit: ["सिते चन्द्रे लग्ने दृढतनुरदभ्रायुर भयो", "बलिष्ठो लक्ष्मीवान् भवति विपरीतं क्षयगते।", "धनाढ्योऽन्तर्वाणिर्विषयसुखवान् वाचि विकलः", "सहोत्थे सभ्रातृप्रमदबलशौर्योऽतिकृपणः ॥५॥"] },
  { verse: 6, graha: "Moon", houses: [4, 5, 6, 7], sanskrit: ["सुखी भोगी त्यागी सुहृदि ससुहृद्वाहनयशाः", "सुपुत्रो मेधावी मृदुगतिरमात्यः सुतगते ।", "क्षतेऽल्पायुश्चन्द्रेऽमतिरुदररोगी परिभवी", "स्मरे दृष्टेः सौम्यो वरयुवतिकान्तोऽतिसुभगः ॥६॥"] },
  { verse: 7, graha: "Moon", houses: [8, 9, 10, 11, 12], sanskrit: ["मृतौ रोग्यल्पायुस्तपसि शुभधर्मात्मसुतवान्", "जयी सिद्धारम्भो नभसि शुभकृत्सत्प्रियकरः ।", "मनस्वी बह्नायुर्धनतनयभृत्यैः सह भवे", "व्यये द्वेष्यो दुःखी शशिनि परिभूतोऽलसतमः ॥७॥"] },
  { verse: 8, graha: "Mars", houses: [1, 2, 3, 4], sanskrit: ["क्षततनुरतिक्रूरोऽल्पायुस्तनौ धनसाहसी", "वचसि विमुखो निर्विद्यार्थः कुजे कुजनाश्रितः ।", "सुगुणधनवाञ्छूरोऽधृष्यः सुखी व्यनुजोऽनुजे", "सुहृदि विसुहन्मातृक्षोणीसुखालयवाहनः ॥८॥"] },
  { verse: 9, graha: "Mars", houses: [5, 6, 7, 8], sanskrit: ["विसुखतनयोऽनर्थप्रायः सुते पिशुनोऽल्पधीः", "प्रबलमदनः श्रीमान् ख्यातो रिपौ विजयी नृपः ।", "अनुचितकरो रोगार्तोऽस्तेऽध्वगो मृतदारवान्", "कुतनुरधनोऽल्पायुश्छिद्रे कुजे जननिन्दितः ॥९॥"] },
  { verse: 10, graha: "Mars", houses: [9, 10, 11, 12], sanskrit: ["नृपसुहृदपि द्वेष्योऽतातः शुभजनघातको", "नभसि नृपतिः क्रूरो दाता प्रधानजनस्तुतः ।", "धनसुखयुतोऽशोकः शूरो भवे सुशीलः कुजे", "नयनविकृतः क्रूरोऽदारो व्यये पिशुनोऽधमः ॥१०॥"] },
  { verse: 11, graha: "Mercury", houses: [1, 2, 3, 4], sanskrit: ["दीर्घायुर्जन्मनि ज्ञे मधुरचतुरवाक् सर्वशास्त्रार्थबोधः", "स्याद्बुद्ध्योपार्जितस्वः कविरमलवचा वाचि मिष्टान्नभोक्ता ।", "शौर्ये शूरः समायुः सुसहजसहितः सश्रमो दैन्ययुक्तः", "संख्यावान् चाटुवाक्यः सुहृदि सुखसुहृत्क्षेत्रधान्यार्थभोगी ॥११॥"] },
  { verse: 12, graha: "Mercury", houses: [5, 6, 7, 8], sanskrit: ["विद्यासौख्यप्रतापः प्रचुरसुतयुतो मान्त्रिकः पञ्चमस्थे", "जातक्रोधो विवादैर्द्विषि रिपुबलहन्तालसो निष्ठुरोक्तिः ।", "प्रज्ञोऽस्ते चारुवेषः ससकलमहिमा याति भार्यां सवित्तां", "विख्याताख्यश्चिरायुः कुलभृदधिपतिर्ज्ञेऽष्टमे दण्डनेता ॥१२॥"] },
  { verse: 13, graha: "Mercury", houses: [9, 10, 11, 12], sanskrit: ["विद्यार्थाचारधर्मैः सह तपसि बुधे स्यात्प्रवीणोऽतिवाग्मी", "सिद्धारम्भः सुविद्याबलमतिसुखसत्कर्मसत्यान्वितः खे ।", "बह्वायुः सत्यसन्धो विपुलधनसुखी लाभगे भृत्ययुक्तो", "दीनो विद्याविहीनः परिभवसहितोऽन्त्ये नृशंसोऽलसश्च ॥१३॥"] },
  { verse: 14, graha: "Jupiter", houses: [1, 2, 3, 4], sanskrit: ["शोभावान् सुकृती चिरायुरभयो लग्ने गुरौ सात्मजो", "वाग्मी भोजनसारवांश्च सुमुखो वित्ते धनी कोविदः ।", "सावज्ञः कृपणः प्रतीतसहजः शौर्येऽघकृद्दुष्टधी-", "र्बन्धौ मातृसुहृत्परिच्छदसुतस्त्रीसौख्यधान्यान्वितः ॥१४॥"] },
  { verse: 15, graha: "Jupiter", houses: [5, 6, 7, 8], sanskrit: ["सुतैः क्लेशयुतो महीशसचिवो धीमान् सुतस्थे गुरौ", "षष्ठे स्यादलसोऽरिहा परिभवी मन्त्राभिचारे पटुः ।", "सत्पत्नीसुतवान् मदेऽतिसुभगस्तातादुदारोऽधिकः", "दीनो जीवति सेवया कलुषधीर्दीर्घायुरिज्येऽष्टमे ॥१५॥"], note: "The first word was unreadable in the scan and is restored from the commentary." },
  { verse: 16, graha: "Jupiter", houses: [9, 10, 11, 12], sanskrit: ["ख्यातः सन् सचिवः शुभेऽर्थसुतवान् स्याद्धर्मकार्योत्सुकः", "स्वाचारः सुयशा नभस्यतिधनी जीवे महीशप्रियः ।", "आयस्थे धनिकोऽभयोऽल्पतनयो जैवातृको यानगो", "द्वेष्यो धिक्कृतवारव्यये वितनयः साघोऽलसः सेवकः ॥१६॥"] },
  { verse: 17, graha: "Venus", houses: [1, 2, 3, 4], sanskrit: ["तनौ सुतनुदृक्प्रियं सुखिनमेव दीर्घायुषं", "करोति कविरर्थगः कविमनेकवित्तान्वितम् ।", "विदारसुखसम्पदं कृपणमप्रियं विक्रमे", "सुवाहनसुमन्दिराभरणवस्त्रगन्धं सुखे ॥१७॥"] },
  { verse: 18, graha: "Venus", houses: [5, 6, 7, 8], sanskrit: ["अखण्डितधनं नृपं सुमतिमात्मजे सात्मजं", "विशत्रुमधनं क्षते युवतिदूषितं विक्लवम्", "सुभार्यमसतीरतं मृतकलत्रमाढ्यं मदे", "चिरायुषमिलाधिपं धनिनमष्टमे संस्थितः ॥१८॥"] },
  { verse: 19, graha: "Venus", houses: [9, 10, 11, 12], sanskrit: ["सदारसुहृदात्मजं क्षितिपलब्धभाग्यं शुभे", "नभस्यतियशः सुहत्सुखितवृत्तियुक्तं प्रभुम् ।", "धनाढ्यमितराङ्गनारतमनेक सौख्यं भवे", "भृगुर्जनयति व्यये सरतिसौख्यवित्तद्युतिम् ॥१९॥"] },
  { verse: 20, graha: "Saturn", houses: [1], sanskrit: ["स्वोच्चे स्वकीयभवने क्षितिपालतुल्यो", "लग्नेऽर्कजे भवति देशपुराधिनाथः ।", "शेषेषु दुःखपरिपीडित एव बाल्ये", "दारिद्र्यदुःखवशगो मलिनोऽलसश्च ॥२०॥"] },
  { verse: 21, graha: "Saturn", houses: [2, 3], sanskrit: ["विमुखमधनमर्थेऽन्यायवन्तं च पश्चा-", "दितरजनपदस्थं यानभोगार्थयुक्तम् ।", "विपुलमतिमुदारं दारसौख्यं च शौर्ये", "जनयति रविपुत्रश्चालसं विक्लवं च ॥२१॥"] },
  { verse: 22, graha: "Saturn", houses: [4, 5, 6, 7], sanskrit: ["दुःखी स्याद्गृहयानमातृवियुतो बाल्ये सरुग्बन्धुभे", "भ्रान्तो ज्ञानसुतार्थहर्षरहितो धीस्थे शठो दुर्मतिः ।", "बह्वाशी द्रविणान्वितो रिपुहतो धृष्टश्च मानी रिपौ", "कामस्थे रविजे कुदारनिरतो निःस्वोऽध्वगो विह्वलः ॥२२॥"] },
  { verse: 23, graha: "Saturn", houses: [8], sanskrit: ["शनैश्चरे मृतिस्थिते मलीमसोऽर्शसोऽवसुः ।", "करालधीर्बुभुक्षितः सुहज्जनावमानितः ॥२३॥"] },
  { verse: 24, graha: "Saturn", houses: [9, 10, 11, 12], sanskrit: ["भाग्यार्थात्मजतातधर्मरहितो मन्दे शुभे दुर्जनो", "मन्त्री वा नृपतिर्धनी कृषिपरः शूरः प्रसिद्धोऽम्बरे ।", "बह्वायुः स्थिरसम्पदायसहितः शूरो विरोगो धनी", "निर्लज्जार्थसुतो व्ययेऽङ्गविकलो मूर्खो रिपूत्सारितः ॥२४॥"] },
  { verse: 25, graha: "Rahu", houses: [1, 2, 3, 4], sanskrit: ["लग्नेऽहावचिरायुरर्थबलवानूर्ध्वाङ्गरोगान्वितः", "छन्नोक्तिर्मुखरो घृणी नृपधनी वित्ते सरोषः सुखी ।", "मानी भ्रातृविरोधको दृढमतिः शौर्ये चिरायुर्धनी", "मूर्खो वेश्मनि दुःखकृत्ससुहृदल्पायुः कदाचित्सुखी ॥२५॥"] },
  { verse: 26, graha: "Rahu", houses: [5, 6, 7, 8], sanskrit: ["नासोद्यद्वचनोऽसुतः कठिनहृद्वाहौ सुते कुक्षिरु-", "गरिट्कूर्हपीडितः सगुदरुक्छ्रीमांश्चिरायुः क्षते ।", "स्त्रीसङ्गादधनो मदेऽथ विधुरोऽवीर्यः स्वतन्त्रोऽल्पधी-", "र्… विकलो वातामयोऽल्पात्मजः ॥२६॥"], note: "Part of the last line was unreadable in the scan." },
  { verse: 27, graha: "Rahu", houses: [9, 10, 11, 12], sanskrit: ["धर्मस्थे प्रतिकूलवाग्गणपुरग्रामाधिपोऽपुण्यवान्", "ख्यातः खेऽल्पसुतोऽन्यकार्यनिरतः सत्कर्महीनोऽभयः ।", "श्रीमान्नातिसुतश्चिरायुरसुरे लाभे सकर्णामयः", "प्रच्छन्नाघरतो बहुव्ययकरो रिःफेऽम्बुरुक्पीडितः ॥२७॥"] },
  { verse: 28, graha: "Ketu", houses: [1, 2], sanskrit: ["लग्ने कृतघ्नमसुखं पिशुनं विवर्णं", "स्थानच्युतं विकलदेहमसत्समाजम् ।", "विद्यार्थहीनमधमोक्तियुतं कुदृष्टिं", "पातः परान्ननिरतं कुरुते धनस्थः ॥२८॥"] },
  { verse: 29, graha: "Ketu", houses: [3, 4], sanskrit: ["आयुर्बलं धनयशः प्रमदान्नसौख्यं", "केतौ तृतीयभवने सहजप्रणाशम् ।", "भूक्षेत्रयानजननीसुखजन्मभूमि-", "नाशं सुखे परगृहस्थितिमेव दत्ते ॥२९॥"] },
  { verse: 30, graha: "Ketu", houses: [5, 6], sanskrit: ["पुत्रक्षयं जठररोगपिशाचपीडां", "दुर्बुद्धिमात्मनि खलप्रकृतिं च पातः ।", "औदार्यमुत्तमगुणं दृढतां प्रसिद्धिं", "षष्ठे प्रभुत्वमरिमर्दनमिष्टसिद्धिम् ॥३०॥"] },
  { verse: 31, graha: "Ketu", houses: [7, 8], sanskrit: ["द्यूनेऽवमानमसतीरतिमान्त्ररोगं", "पातः स्वदारवियुतिं मदधातुहानिम् ।", "स्वल्पायुरिष्टविरहं कलहं च मृत्यौ", "शस्त्रक्षतं सकलकार्यविरोधमेव ॥३१॥"], note: "The word \"mṛtyau\" in the third line is restored from the commentary." },
  { verse: 32, graha: "Ketu", houses: [9, 10], sanskrit: ["पापप्रवृत्तिमशुभं पितृभाग्यहीनं", "दारिद्र्यमार्यजनदूषणमाह धर्मे ।", "सत्कर्मविघ्नमशुचित्वमवद्यकृत्यं", "तेजस्विनं नभसि शौर्यमतिप्रसिद्धम् ॥३२॥"] },
  { verse: 33, graha: "Ketu", houses: [11, 12], sanskrit: ["लाभेऽर्थसञ्चयमनेकगुणं सुभोगं", "सद्द्रव्यसोपकरणं सकलार्थसिद्धिम् ।", "प्रच्छन्नपापमधमव्ययमर्थनाशं", "रिःफे विरुद्धगतिमक्षिरुजं च पातः ॥३३॥"] },
  { verse: 34, graha: null, houses: [], sanskrit: ["उदयर्क्षांशस्फुटतुल्यांशे निवसन् पूर्णं फलमाधत्ते ।", "शनिवद्राहुः कुजवत्केतुः फलदाता स्यादिह सम्प्रोक्तः ॥३४॥"] },
  { verse: 35, graha: null, houses: [], sanskrit: ["भावसमांशकसंस्था भावफलं पूर्णमेव कलयन्ति ।", "न्यूनाधिकांशवशतः फलवृद्धिह्रासता वाच्या ॥३५॥"] },
];

/** The result of each graha in each house from the lagna (1–12). */
export const GRAHA_BHAVA_RESULTS: Record<BhavaGraha, Record<number, string>> = {
  Sun: {
    1: "Scanty-haired, very lazy, wrathful, fierce, proud, with dull eyes, lean-bodied, brave but weak, cruel-minded.",
    2: "Without learning, modesty and wealth; stammering speech.",
    3: "Strong, courageous, wealthy, generous; an enemy of his own people.",
    4: "Without kin, friends, land and house; serves a king and wastes his father's property.",
    5: "Without happiness, wealth and children; short-lived but intelligent; roams in forests.",
    6: "Owner of broad lands, virtuous, wealthy and victorious.",
    7: "Opposed to the king, deformed, a wanderer, without happiness from a wife, despised.",
    8: "Without wealth and life-span, defective in sight, short-lived.",
    9: "Fatherless, with kin and children, devoted to the gods and the brahmins.",
    10: "With children, vehicles, praise, a sharp mind, wealth, strength and fame.",
    11: "Much wealth and a long life, free from sorrow, a king among men.",
    12: "Hates his father, has eye disease, without wealth and children.",
  },
  Moon: {
    1: "The waxing Moon: a firm body, long life, fearless, strong, prosperous; the waning Moon: the opposite.",
    2: "Wealthy, learned, enjoys the pleasures of the senses; defective in speech.",
    3: "With brothers, fond of women, strong, brave, very miserly.",
    4: "Happy, an enjoyer and a giver; with friends, vehicles and fame.",
    5: "With good sons, very intelligent, slow in gait, a king's minister.",
    6: "Short-lived, foolish, with stomach disease, without honour.",
    7: "Gentle, handsome, loved by fine young women, very fortunate.",
    8: "Sickly and short-lived.",
    9: "Prosperous, righteous, happy in his children.",
    10: "Victorious, completes his undertakings, does good and helps the good.",
    11: "High-minded, long-lived, with wealth, children and servants.",
    12: "Hated, unhappy, humbled, very lazy.",
  },
  Mars: {
    1: "A wounded body, very cruel, very bold, short-lived.",
    2: "Poor in speech, without learning and wealth, dependent on bad people.",
    3: "Virtuous, wealthy, brave, bold and happy; without younger brothers.",
    4: "Without kin and friends; no happiness from mother, land, house and vehicles.",
    5: "Without happiness from children, of little worth, a slanderer, dull-witted.",
    6: "Very passionate, prosperous, famous, a victorious king.",
    7: "Does improper things, ill, a traveller; loses his wife.",
    8: "Deformed, poor, short-lived, despised by people.",
    9: "A friend of the king yet disliked, fatherless, injures good people.",
    10: "Cruel, a king, a giver, praised by the leading men.",
    11: "Wealthy and happy, free from sorrow, brave and well-behaved.",
    12: "Eye disease, cruel, without a wife, a slanderer, base.",
  },
  Mercury: {
    1: "Long-lived, sweet and clever in speech, knows the meaning of all the scriptures.",
    2: "Wealth earned by his intellect, a poet, pure speech, eats sweet food.",
    3: "Brave, middling life, with good brothers, hardworking but wretched.",
    4: "Learned, flattering in speech, happy in friends, land, grain and wealth.",
    5: "Learning, happiness and might, many sons, skilled in mantras.",
    6: "Quick to anger, quarrelsome, defeats enemies, lazy, harsh in speech.",
    7: "Wise, well dressed, honoured, with a wealthy wife.",
    8: "Famous, long-lived, upholds his family, a commander or punisher.",
    9: "Learning and wealth, good conduct, righteous, skilled and very eloquent.",
    10: "Succeeds in his undertakings; learning, strength, wisdom and happiness; truthful.",
    11: "Long-lived, truthful, great wealth and happiness, with servants.",
    12: "Wretched, without learning, humiliated, cruel and lazy.",
  },
  Jupiter: {
    1: "Handsome, virtuous, long-lived, fearless, with children.",
    2: "Eloquent, fond of fine food, good-looking, wealthy and learned.",
    3: "Scorned, miserly, with famous brothers, brave but sinful and wicked-minded.",
    4: "Happy with mother, friends, retinue, children, wife and grain.",
    5: "Troubled by his sons, wise, a king's minister.",
    6: "Lazy, slays his enemies, humbled, skilled in mantra and magic.",
    7: "A good wife and sons, handsome, more generous than his father.",
    8: "Wretched, lives by service, sinful-minded, long-lived.",
    9: "Famous, a minister, with wealth and sons, devoted to dharma.",
    10: "Good conduct, fame, very wealthy, dear to the king.",
    11: "Wealthy, fearless, few children, long-lived, with vehicles.",
    12: "Hated, scorned, childless, sinful, lazy, a servant.",
  },
  Venus: {
    1: "A beautiful body, dear to others, happy, long-lived.",
    2: "A poet with much wealth.",
    3: "Without wife, happiness and wealth; miserly and unloved.",
    4: "Fine vehicles, a fine house, ornaments, clothes and perfumes.",
    5: "Unbroken wealth, like a king, intelligent, with children.",
    6: "Without enemies and wealth, wounded, ruined by women, wretched.",
    7: "A good wife, yet fond of unchaste women; loses his wife but is very rich.",
    8: "Long-lived, a ruler of land, wealthy.",
    9: "With wife, friends and children, fortune through the king.",
    10: "Great fame, happy with his friends, supports many.",
    11: "Wealthy, fond of other women, many comforts.",
    12: "The pleasures of love, wealth and lustre.",
  },
  Saturn: {
    1: "In its own or exaltation sign: like a king, lord of a country or town; in any other sign: pained from childhood, poor, dirty and lazy.",
    2: "Ugly, poor, unjust; later abroad with vehicles and enjoyments.",
    3: "Broad-minded, generous, brave, happy with his wife, but lazy and distressed.",
    4: "Unhappy; without house, vehicles and mother; sickly in childhood.",
    5: "Wandering, without knowledge, children, wealth and joy; wicked and evil-minded.",
    6: "Eats much, wealthy, strikes down his enemies, bold and proud.",
    7: "Fond of bad women, poor, a wanderer, distressed.",
    8: "Dirty, with piles, poor, cruel-minded, hungry, insulted by his kin.",
    9: "Without fortune, wealth, children, father and dharma; a wicked man.",
    10: "A minister or a king, wealthy, farming, brave, famous.",
    11: "Long-lived, steady wealth and income, brave, healthy and rich.",
    12: "Shameless, loses wealth and children, deformed, foolish, driven out by enemies.",
  },
  Rahu: {
    1: "Short-lived, wealthy and strong; disease in the upper body.",
    2: "Indistinct or harsh speech, mouth disease, angry, wealthy through the king.",
    3: "Proud, opposes his brothers, firm-minded, long-lived and wealthy.",
    4: "Foolish, unhappy, with good friends, short-lived, rarely happy.",
    5: "Nasal or stammering speech, childless, hard-hearted, stomach disease.",
    6: "Afflicted by enemies and malefics, anal disease, yet prosperous and long-lived.",
    7: "Loses wealth through women, a widower, impotent, independent, dull-witted.",
    8: "Short-lived, dirty, deformed, wind diseases, few children.",
    9: "Contrary in speech, a headman of a group, town or village, without merit (the commentary reads: very meritorious).",
    10: "Famous, few children, busy with other people's affairs, lacking good works, fearless.",
    11: "Prosperous, not many children, long-lived, ear disease.",
    12: "Secretly sinful, spends much, afflicted by water-borne diseases.",
  },
  Ketu: {
    1: "Ungrateful, unhappy, a slanderer, an outcast, displaced, deformed, in bad company.",
    2: "Without learning and wealth, base speech, an evil eye, eats others' food.",
    3: "Long-lived, strong, wealthy, famous, with women and food; destroys his brothers.",
    4: "Loses land, fields, vehicles, mother's happiness and his homeland; lives in another's house.",
    5: "Loss of children, stomach disease, affliction by spirits, evil-minded and wicked.",
    6: "Generous, excellent qualities, firm, famous, authority; destroys his enemies and attains his aims.",
    7: "Humiliation, intestinal disorder, fond of unchaste women, loses his wife.",
    8: "Short-lived, parted from loved ones, quarrels, wounds by weapons, fails in all work.",
    9: "Sinful, inauspicious, without his father's fortune, poor, reviles good people.",
    10: "Obstructs good works, impure, does blameworthy acts; radiant and famous for courage.",
    11: "Accumulates wealth, many virtues, fine enjoyments and possessions, success in all aims.",
    12: "Secretly sinful, wasteful, loses wealth, goes against the right way, eye disease.",
  },
};
/** 8.1: the Sun in the lagna, by the sign of the lagna. */
export const SUN_LAGNA_SIGNS: Record<number, string> = {
  1: 'Aries lagna: dim sight (eye disease).',
  4: 'Cancer lagna: the eyes are afflicted (cataract and the like).',
  5: 'Leo lagna: night-blind.',
  7: 'Libra lagna: poor and without sons.',
};

export interface GrahaBhavaRow {
  graha: BhavaGraha;
  /** The house from the lagna, 1–12. */
  house: number;
  sign: number;
  verse: number;
  result: string;
  /** What the verse says about the sign or the Moon's phase, when it does. */
  variant: string | null;
  /** Degrees between the graha and the middle of the house (the degree of the lagna, repeated in each sign); null when the longitude of the lagna is not known. */
  fromMiddle: number | null;
}

export interface GrahaBhavaReading {
  rows: GrahaBhavaRow[];
  /** The degree of the lagna in its sign: the middle of every house (8.34–35). */
  middleDegree: number | null;
}

export interface GrahaBhavaContext {
  ascendantSign: number;
  ascendantLongitude?: number;
  planets: { name: string; sign: number; degree: number }[];
  /** Whether the Moon is waxing at the chart's moment. */
  moonWaxing: boolean;
}

/** The verse of 8.1–33 that gives a graha's result in a house. */
export function verseFor(graha: BhavaGraha, house: number): GrahaBhavaVerse | undefined {
  return GRAHA_BHAVA_VERSES.find(item => item.graha === graha && item.houses.includes(house));
}

const OWN_OR_EXALTED_SATURN = [10, 11, 7];

export function grahaBhavaReading(context: GrahaBhavaContext): GrahaBhavaReading {
  const middleDegree = context.ascendantLongitude === undefined ? null : context.ascendantLongitude % 30;
  const rows: GrahaBhavaRow[] = [];
  for (const graha of BHAVA_GRAHAS) {
    const body = context.planets.find(planet => planet.name === graha);
    if (!body) continue;
    const house = ((body.sign - context.ascendantSign + 12) % 12) + 1;
    const verse = verseFor(graha, house);
    if (!verse) continue;
    let variant: string | null = null;
    if (graha === 'Sun' && house === 1) variant = SUN_LAGNA_SIGNS[context.ascendantSign] ?? null;
    if (graha === 'Moon' && house === 1) variant = context.moonWaxing ? 'The Moon is waxing: the result as given.' : 'The Moon is waning: the opposite of the result.';
    if (graha === 'Saturn' && house === 1) variant = OWN_OR_EXALTED_SATURN.includes(body.sign) ? 'Saturn is in its own or exaltation sign: like a king, lord of a country or town.' : 'Saturn is in another sign: pained from childhood, poor, dirty and lazy.';
    rows.push({
      graha, house, sign: body.sign, verse: verse.verse, result: GRAHA_BHAVA_RESULTS[graha][house], variant,
      fromMiddle: middleDegree === null ? null : Math.abs(body.degree - middleDegree),
    });
  }
  return { rows, middleDegree };
}
