# Yogas by topic, from the classics (since v3.78; marriage and longevity since v3.79; wealth and poverty since v3.82)

The view ANALYSIS → Topic yogas judges rules that the classics give for one topic, each with the verses it is read from, in Sanskrit. It is the answer to the topic searches of the Kala software
(longevity, marriage, illness, spirituality): there, a search over "several thousand yogas from over 30 texts"; here, rule by rule from a named verse, and what cannot be judged says so.

Code: `src/lib/topicYogas.ts` (the topics and `evaluateTopic`), `src/lib/topicCore.ts` (the shape of a rule and the questions a chart is asked), `src/lib/topicSpirituality.ts`, `topicMarriage.ts`, `topicLongevity.ts`, `topicWealth.ts`
(the rules), `src/lib/topicVerses.ts` (the verses of chapters 18, 19, 39, 40, 41, 42, 44 and 79: Devanagari, IAST and a short gloss) and `src/components/TopicYogaPanel.tsx`.
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

## Next topics (not built yet)

* **Illness**: BPHS 17 (the 6th), 9–11 (ariṣṭa and its cancelling).
* **Women**: BPHS 80 and 83.
* Other texts: the Phaladīpikā, the Sārāvalī and the Jātakapārijāta for marriage and longevity.
