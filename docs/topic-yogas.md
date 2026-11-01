# Yogas by topic, from the classics (since v3.78; marriage and longevity since v3.79)

The view ANALYSIS → Topic yogas judges rules that the classics give for one topic, each with the verses it is read from, in Sanskrit. It is the answer to the topic searches of the Kala software
(longevity, marriage, illness, spirituality): there, a search over "several thousand yogas from over 30 texts"; here, rule by rule from a named verse, and what cannot be judged says so.

Code: `src/lib/topicYogas.ts` (the topics and `evaluateTopic`), `src/lib/topicCore.ts` (the shape of a rule and the questions a chart is asked), `src/lib/topicSpirituality.ts`, `topicMarriage.ts`, `topicLongevity.ts`
(the rules), `src/lib/topicVerses.ts` (the verses of chapters 18, 19, 44 and 79: Devanagari, IAST and a short gloss) and `src/components/TopicYogaPanel.tsx`.
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

## Next topics (not built yet)

* **Illness**: BPHS 17 (the 6th), 9–11 (ariṣṭa and its cancelling).
* **Wealth and poverty**: BPHS 39–42.
* **Women**: BPHS 80 and 83.
* Other texts: the Phaladīpikā, the Sārāvalī and the Jātakapārijāta for marriage and longevity.
