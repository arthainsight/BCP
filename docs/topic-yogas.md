# Yogas by topic, from the classics (since v3.78; marriage and longevity since v3.79; wealth and poverty since v3.82; illness and ariṣṭa since v3.83; the houses since v3.84, the 9th to 12th since v3.85, the Phaladīpikā's 7th house since v3.90, the woman's chart since v3.91)

The view ANALYSIS → Topic yogas judges rules that the classics give for one topic, each with the verses it is read from, in Sanskrit. It is the answer to the topic searches of the Kala software
(longevity, marriage, illness, spirituality): there, a search over "several thousand yogas from over 30 texts"; here, rule by rule from a named verse, and what cannot be judged says so.

Code: `src/lib/topicYogas.ts` (the topics and `evaluateTopic`), `src/lib/topicCore.ts` (the shape of a rule and the questions a chart is asked), `src/lib/topicSpirituality.ts`, `topicMarriage.ts`, `topicLongevity.ts`, `topicWealth.ts`, `topicIllness.ts`, `topicHouses.ts`
(the rules), `src/lib/topicVerses.ts` (the verses of chapters 9, 10, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 18, 19, 39, 40, 41, 42, 44 and 79: Devanagari, IAST and a short gloss) and `src/components/TopicYogaPanel.tsx`.
A rule has an id, the topic, the chapter and verses it comes from, what the text says follows, and a function from the chart to *met*, *not met* or *cannot be judged*. The rule names, the lines of evidence and the glosses are in English.

## Readings made throughout

* **"Strong" (bali)**: the Ṣaḍbala of the graha at or over the strength it needs (the ratio of the Ṣaḍbala panel is 1 or more, with the default options). The text gives no measure; this is the app's choice and is said in the view.
* **Aspects** are counted by whole signs (the 7th for all, Mars 4th and 8th, Jupiter 5th and 9th, Saturn 3rd and 10th); Rāhu and Ketu do not aspect here.
* **Malefics** are the Sun, Mars, Saturn, Rāhu and Ketu, and the Moon when waning; **benefics** Jupiter, Venus, Mercury and the Moon when waxing.
* The text speaks of a man's chart ("his wife"). For a woman's chart the 7th house is the husband's, and BPHS 80 and 83 are the chapters for her (not built).

## Spirituality: BPHS 79 (Pravrajyā-yoga), 15 verses

| Verse | Rule | In the app |
|---|---|---|
| 79.2–3, 12–13 | Four or more strong grahas in one sign: renunciation; its kind by the strongest, in the order of the grahas: Sun a tapasvī, Moon a Kāpālika, Mars a wearer of red, Mercury an ekadaṇḍī, Jupiter a yati, Venus a cakradhara, Saturn a nirgranthika | rule 1 |
| 79.4 | Those grahas strong but combust by the Sun: uninitiated, devotion to the Sun | rule 2 |
| 79.5 | Combust and weak, with the Sun strong: a renunciation of the Sun | rule 3 |
| 79.6–7 | The lord of the birth sign seeing Saturn and seen by no other graha; or weak and seen by Saturn alone | rule 4. **Two readings:** "janmabheśa" is the lord of the Moon's *sign*, and "anyakheṭaiḥ adṛṣṭaḥ" is read as seen by no graha *but Saturn* |
| 79.8 | The Moon in a drekkāṇa of Saturn, a navāṁśa of Saturn or Mars, and seen by Saturn | rule 5 |
| 79.14 | The Moon, Jupiter and the Lagna seen by Saturn, Jupiter in the 9th | rule 6 |
| 79.15 | Saturn in the 9th, free of aspect | rule 7 |
| 79.1, 9–11 | The introduction; the war of the grahas; the one defeated gives up the renunciation; a question | **not judged** |

## Marriage: BPHS 18 (the 7th house), 42 verses, 33 rules

* **18.1–6, 15–21**: the 7th lord (own or exaltation sign, in the 12th/6th/8th, with or aspected by benefics, debilitated, in an enemy's sign, weak; in a sign of Saturn or Venus), Venus in the 7th or with a malefic, the lagna lord in the 7th,
  the 7th or its lord with a malefic, the Moon in the 7th with the 7th lord in the 12th and Venus weak, the combinations of two, three and many wives.
* **18.7–9**: a graha in the 7th and the kind of wife it gives.
* **18.11–14**: Saturn and Mars in the 7th; Venus in a navāṁśa or sign of Mars or of Saturn.
* **18.22–30, 40–41**: the year of marriage by the configuration (the ages are the text's, in years of age).
* **18.35–39, 42**: loss of the wife, with the year, and the bride dying after the wedding (37).
* **Not judged**: 18.10 (the print does not make the marks clear), 18.31–34 (the navāṁśa and "the 9th from the 9th" readings are not certain).
* **Readings**: a eunuch sign is one of Mercury or Saturn (3.19: they are the eunuchs); the signs "of a benefic" are those of Jupiter, Venus, Mercury and the Moon; 18.3's second half does not name the graha and is read as Venus; the navāṁśa half
  of 18.19 is not judged.

## Longevity and death: BPHS 19 (the 8th house) and 44 (the māraka)

* **19.1–2, 4–6, 8–15**: the 8th lord in a kendra; the 8th lord or the lagna lord in the 8th with malefics; the lords of the 6th and 12th; the lagna lord and the 8th lord in own or friendly places; the four in kendras or trikoṇas;
  the short-life combinations (8, 9, 12), death at birth (10), at once (11), at the end of a month (13); the long-life ones (14, 15, the latter with "very strong" read as a Ṣaḍbala of 1.2 or more).
* **44.2–4, 21**: the death-giving grahas (the lords of the 2nd and 7th, malefics in those houses or with those lords) and the chief one, the strongest. Rāhu and Ketu have no Ṣaḍbala and are left out of the comparison.
* **44.18, 22–24**: the lords of the 2nd and 12th from the Moon; Rāhu and Ketu as māraka.
* **44.25–36**: the kind of death by the grahas of the 3rd and of the 8th, and the place of death by the sign of the 3rd.
* **Not judged**: 19.3 and 19.7 (how to weigh), 44.5–9, 15–17, 19–20 (the daśās), 44.37–46 (the place of death by drekkāṇas, the worlds after death).
* The statements about death are shown as the text has them and the view says they are not predictions.

## Royal yogas, wealth and poverty: BPHS 39, 40, 41, 42 (115 verses, 63 rules)

* **39 (rāja yogas, 48 verses)**: the lagna and 5th lords in each other's houses (6) and, exalted or in their own navāṁśa and seen by benefics, the Mahārāja yoga (7); Venus with Jupiter and the Moon (11); benefics and a malefic in the first four houses (17);
  an exalted benefic in the 2nd (18); debilitated grahas in the 3rd, 6th or 8th with the lagna lord looking at the lagna (19); the trika lords weak (20); the 10th lord looking at the lagna (21); a debilitated lord of a bad house looking at the lagna (28); a debilitated graha in the 6th or 8th (30);
  the 9th and 5th lords (33–34); the 4th and 10th lords (35, 37); the lords of the lagna, 4th, 5th and 10th with the 9th lord (36); the 5th lord with the 9th lord or the lagna lord (38); Jupiter in the 9th (39); the Moon and Venus (41);
  the Moon (42) and the lagna (43) vargottama and aspected by four or more; the count of exalted grahas (44–46); one exalted benefic in a kendra (47); the benefics in kendras and the malefics in 3, 6, 11 (48).
* **40 (the minister, 15 verses)**: the Amātyakāraka (the second by degree in the sign of the eight-karaka scheme, Rāhu counted from the end of the sign) in the lagna, 5th or 9th (5), strong with benefics or in own or exaltation sign (4), in a kendra or trikoṇa from the Ātmakāraka (6),
  and the other statements of 40.1–2, 8–10, 12–15.
* **41 (dhana yogas, 34 verses)**: the 5th a sign of a graha with that graha in it and others in the 11th (2–8, seven rules), the lagna likewise with others joined or aspecting (9–15, seven rules), and the lords of the 2nd and 9th (16–17).
* **42 (daridra yogas, 18 verses)**: the exchanges of the lagna lord with the 12th and 6th lords (2–3), the lagna lord in the 8th with Ketu (4), in the trika (5), the 5th and 9th lords in the 6th and 12th (7), malefics in the lagna (8), the trika lords (9), the lord of the Moon's navāṁśa (10),
  the lagna lord and the lord of the lagna navāṁśa (11), grahas without the aspect of a trikoṇa lord (13), and Mars, Saturn or the Sun in the 2nd with their cancellations (16–18).
* **Readings**: the *māraka lord* is the lord of the 2nd or 7th (chapter 44); where a verse names several grahas as one thing ("seen by a māraka lord"), one of them is enough; "suhṛd" in 39.36 is the 4th house (as 39.37 has it) and not the 3rd of the site translation;
  39.38 is read as one sentence (the 5th lord, joined with the 9th lord or the lagna lord, in the lagna, 4th or 10th); in 42.5 the 2nd lord is "in an enemy sign or debilitated"; "all" is read in 39.48; zero exalted grahas is not "three or fewer" (39.44).
* **Not judged**: what needs the ārūḍha, the pada or the older kāraka (39.3–5, 39.8–10, 39.12–16, 39.22–27, 39.29, 39.31, 39.40, 40.3, 40.7, 40.11, 42.14–15); what the verse leaves open (the second half of 39.21 gives no number, 42.6 does not say whether its conditions are alternatives,
  42.12 gives no number); and the Pārijāta, Uttama, Gopura, Siṃhāsana and other divisions of 41.18–34 (they need the divisional scheme of chapter 7). The view lists these verses.

## Illness and ariṣṭa: BPHS 17 (the 6th house), 9 (ariṣṭa), 10 (its cancelling), 82 verses, 59 rules

* **17 (28 verses)**: the 6th lord in its own sign, the lagna or the 8th, with the limb of the 6th sign (the Kālapuruṣa of BPHS 4) (2); the lagna lord and the face (6); the leprosies by the Moon in the lagna with Rāhu, Saturn or Mars (7–9);
  the lords of the 6th and 8th with the Sun in the lagna and the kind of boil by the graha that joins (9–11); the critical period (13); Saturn with Rāhu (14); the ailments with the year of life that the verse names (14–15, 19–20, 21, 23–28).
* **9 (45 verses)**: the dangers of birth to the child (3–12, 16–23), to the mother (5, 24–32), to the father (34–39, 41–42, 44) and to the family (30). The first twenty-four years belong to the ariṣṭa of birth (9.2).
* **10 (9 verses)**: what cancels ariṣṭa: a benefic or the lagna lord in a kendra, Jupiter in the lagna, the night birth in the bright half, Jupiter with Mars, the malefics between benefics.
* **Readings**: "between two malefics" is a malefic in the sign before and one in the sign after; "night" is the Sun in the 1st to 6th house; the strong ("balavān") are the Ṣaḍbala ratio of 1 or more; the 24th year and the other ages are the text's; in 17.6 the aspect of Mercury is read as part of the condition;
  17.7's "lagnādhipau kujabudhau" is read as the lagna lord being Mars or Mercury; 17.24 "or" Mars in the 12th from the 8th (the 7th); 9.18 asks for a malefic in a kendra other than the lagna and one in the 8th.
* **Not judged**: what needs the hour of birth (9.7, 9.13's twilight, horā and gaṇḍānta, 9.14, 9.15's east and west halves), Māndi (17.16), a drekkāṇa (9.22), the kārakas (17.3–5, 17.12), the house of destruction of 17.17 (the 8th or the 12th), the sentences that run over verses (17.11b, 17.18, 17.21b–22),
  the milk (9.27), the navāṁśa of Mars (9.40) and 9.43, 9.45's second half (read with 9.44). The view lists these verses.
* The view says that the statements are the text's and not a prediction, and that nothing in it is medical advice. Chapter 11 (what each house shows, 16 verses) is a list of significations and not a set of yogas and is not built here.

## The houses (bhāva-phala): BPHS 12–16 and 20–23, 168 verses, 142 rules

BPHS 12–23 are the *house* chapters, one for each house in order (12 the lagna … 23 the 12th); they are not chapters of the grahas in the houses. The 6th, 7th and 8th (17, 18, 19) are in the illness, marriage and longevity topics; the rest, 12–16 and 20–23, are here.

* **12 (the lagna, 15 verses)**: the lagna lord in the trika with malefics or in a kendra/trikoṇa (1), weak (2), benefics in kendras and trikoṇas (2), the Moon in the lagna afflicted (3), benefics or malefics in the lagna (4), the lagna lord a benefic in a kendra (5),
  in a movable sign (6), the benefics and the Moon (7), Aries/Taurus/Leo with Saturn or Mars (8), the Sun and Moon in one navāṁśa (10) and the limbs of the lagna's drekkāṇa (12–15).
* **13 (the 2nd, 13 verses)**: the 2nd lord placed, in the trika, benefics and malefics in the 2nd, Jupiter or Mars with it, the 2nd and 11th lords (5–8), wealth spent on dharma (9), the 2nd lord in its own sign (10), with malefics (13).
* **14 (the 3rd, 15 verses)**: benefics on the 3rd, Mars, the destroyers of siblings, a sister or a brother by the gender of the graha, Mars as kāraka, the number of siblings (7–13) and the elder and the younger (14).
* **15 (the 4th, 14 verses)**: the 4th lord and the lagna lord, own sign or exaltation, with the 10th lord, the mother's life and happiness, cattle, muteness, vehicles (12–14).
* **16 (the 5th, 32 verses)**: the 5th lord placed, in the trika, combust or weak, the one-child yogas, an adopted son, many sons, a daughter, a child of another, the fortune of children, the years of the births and the losses and the number of sons (24–31).
* **Readings**: the kāraka of the siblings is Mars and of the children Jupiter; the lagna counts as a kendra and a trikoṇa; "highest exaltation" (paramoccha) is read as the exaltation sign; the female grahas are the Moon and Venus and the male the Sun, Mars and Jupiter (14.4, 14.13);
  in 16.3 "combust, with malefics or weak" are read as alternatives; the sentences of 16.24–31 that give the conditions in one verse and the number of sons in the next are read as one rule with both verses; 16.29b–30a is read without its half that cannot be met (Jupiter and Saturn each in the 5th from the other).
* **Not judged**: Māndi (16.9, 16.23), the Pārāvata and other divisions (13.11), the lord of the eyes (13.12), the twins of 12.9, 13.4 (it asks for the 11th and 2nd lords in kendras and trikoṇas, which they cannot be in the same breath), the list of 15.10–11a, 16.17 and a few verses
  that the text leaves open. The view lists them.
* **20 (the 9th, 32 verses)**: the 9th lord strong in the 9th, Jupiter in the 9th, the fortune of the father (3–7), the Sun and the 9th lord (8–9), the exchange with the 2nd (10), the enmity with the father (11), begging (12), the **years of the father's death** (13–25: the conditions end one verse and the years open the next, so each rule names the two verses) and the fortune rules of 26–31.
* **21 (the 10th, 22 verses)**: the 10th lord strong and dignified, weak, with benefics or malefics, the sacrifices of Rāhu in a kendra, the exchanges with the 11th, 9th and 8th lords, Jupiter in Pisces, the Moon in the 10th, fame and the fault in the work.
* **22 (the 11th, 11 verses)**: the 11th lord placed, with the 2nd and 3rd lords, Jupiter, the gains with the years the text gives, and the absence of gain.
* **23 (the 12th, 14 verses)**: the 12th lord with benefics or malefics, the Moon as the 12th lord, Rāhu in the 12th (naraka), Mercury and liberation (mokṣa), travel abroad, the lagna lord in the 12th, and the visible and invisible halves (8).
* **Readings in 20–23**: "highest exaltation" is the exaltation sign; "the 2nd from the 9th" is the 10th; in 21.19 the trikoṇas from the 10th are the 2nd and 6th; in 22.7 "lābhāt lābhage" is read literally as the 11th from the 11th house, the 9th (the site translation has the 11th).
* **Not judged in 20–23**: 20.23b–24a (Saturn in the 8th and 7th, or in either, is not clear), the aṃśa conditions of 23.3–6, the navāṁśa of 21.16, the Sun's aṃśa of 22.2 and a few verses that are lists or closings (20.32, 21.1, 21.22, 22.1, 23.7). The view lists them.
* The view carries a caution that the statements about the death of the father and the loss of children are the text's and not a prediction.

## Phaladīpikā: the houses (since v3.90): chapter 10 (the 7th house), 15 verses

The topic reads a second classic: the house chapters of the Phaladīpikā of Mantreśvara (`phaldipika_202310`, the Sanskrit with the Hindi commentary of the edition, a scan of the print). The rules carry `text: 'phala'` and the verses are in `src/lib/phalaVerses.ts`
(four lines each; the edition has no IAST); the view shows "Phaladīpikā 10" over the rules. The rules are in `src/lib/topicPhalaHouses.ts`.

* **10 (the 7th house)**: the 5th and 7th joined or seen by benefics (1); the death of the wife by Venus's place (1), by the 7th lord in the 5th or the 5th or 8th lord in the 7th (2), a waning Moon in the 5th (2), the Sun and Rāhu in the 7th (2); the signs that kill the wife (3) and Mars and Saturn in Cancer (3);
  the 7th or its lord afflicted (4, 15); Venus with malefics, in a varga of Mars or Saturn (4); Mars and Saturn in the 7th from Venus or the Moon (5); two wives (5); the 7th lord a strong benefic, a malefic 7th lord in its own sign, benefics in the 7th (6); the 2nd and 7th with malefics (7);
  the Moon with Saturn (8), malefics in their fall in the 7th, 8th or 2nd (8); even signs (9); the lords of the 2nd, 7th and 12th with Jupiter (10); benefics from the 7th lord (10); the direction of the wife's home (12).
* **Readings**: "from the Moon" counts from its sign; in 10.5 "the 7th from Venus and the Moon" is read as the 7th from Venus *or* from the Moon; the 5th and 7th of 10.1 are taken from the lagna and by benefics (the lords and the Moon's reckoning are named in the verse and not tried); the direction of a sign is that of its place in the cycle east, south, west, north (Aries east, Taurus south, Gemini west, Cancer north, and again).
* **Not judged**: the birth sign of the wife and the times of the marriage (10.11, 10.13, 10.14), which need the daśā and the transits. In 10.13 the commentary says the transit of Venus and the Sanskrit the transit of the lagna lord; the verse is not used.
* The Sanskrit has gaps in the scan: in 10.1 a word restored from the commentary, in 10.5 some letters of the third line and in 10.6 one whole line. The verses say so.
* Chapters 12 to 17 of the Phaladīpikā (the children, the span of life, disease, the good and bad of the houses, the houses together, death) are not built yet.

## Phaladīpikā 11 (since v3.91): the woman's chart, 11 verses

Under the same topic ("Phaladīpikā: the houses"), rules `p11-*` in `src/lib/topicPhalaHouses.ts`, verses in `src/lib/phalaVerses.ts`.

* **Judged**: the 7th, 8th, 9th, 4th houses and the lagna as good or bad for a woman (benefics in them, malefics other than the lord of the house); even and odd signs of the lagna and the 7th and of its navāṁśa; Mars in the 7th (a widow); malefics and benefics together in the 7th; benefics in the 2nd; the Moon in the 5th (few children);
  malefics in the 4th; the lagna, the Moon and Venus in the signs of Mars or Saturn; benefics in the 5th and 9th; the trimshāṁśa of the Moon and of the lagna with the table of results (`WOMAN_BY_TRIMSHAMSHA`: seven rows of five); the nakṣatra of the Moon for kin and barrenness; the four lords.
* **Readings**: a malefic that is the lord of the house is not counted as a malefic in it; the trimshāṁśa of the lagna needs the longitude of the lagna and is "cannot be judged" without it.
* **Not judged**: 11.11 (a remedy and a closing statement, nothing to read from the chart).

## The woman's chart: BPHS 80 (since v3.91), 55 verses

A topic of its own ("The woman's chart"), rules `w80-*` in `src/lib/topicWoman.ts`. The text says (80.2) that what is told for men holds for women, and then what is special: the husband, widowhood, children, the 8th house. The app does not ask whether a chart is a woman's, so the rules stand as rules for a chart read so (the caution says it).

* **Judged**: even signs of the lagna and the Moon with benefic aspect (80.5-6) and odd signs with malefics (80.6-7); the Sun or Mars in the 7th (80.18); malefics, benefics or both in the 7th (80.19); Venus and Mars in each other's navāṁśa and the Moon in the 7th (80.20); the lagna a sign of Venus or Saturn (80.21);
  the husband by the lord of the 7th sign and its navāṁśa (80.22-25); each graha in the 8th (80.26-33); barren combinations (80.34, 80.39); the lagna of Mercury with the Moon and Venus in the 5th (80.36); the Moon, Mercury and Venus in the lagna (80.37); miscarriages (80.41); the Moon between malefics (80.42);
  the viṣa-yoga and what cancels it (80.44-46); Mars in the 1st, 4th, 7th, 8th or 12th without a benefic (80.47); Venus and Saturn (80.50); strong Mars, Mercury, Jupiter, Venus in an even lagna (80.52); a malefic in the 7th with a graha in the 9th (80.53); Mercury alone in the 8th (80.54).
* **Readings**: 80.50 is read as Venus and Saturn in mutual aspect (opposition) with the lagna Taurus or Libra; the navāṁśa and ghaṭa parts of the verse are not tried; 80.22-25 name the sign and the navāṁśa of the 7th, and the navāṁśa is shown only when the longitude of the lagna is known.
* **Not judged**: the trimshāṁśa table of 80.8-16 (the Phaladīpikā 11 above has the table; the BPHS verses are garbled in the print and the English), 80.17, 80.35, 80.38, 80.40, 80.43 (the weekday and the tithi), 80.48-49 (the husband's chart), 80.55 (equal strength has no measure). The view lists them.

## Next topics (not built yet)

* **Women**: BPHS 83.
* Other texts: the Phaladīpikā, the Sārāvalī and the Jātakapārijāta for marriage and longevity.
