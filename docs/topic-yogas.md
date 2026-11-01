# Yogas by topic, from the classics (since v3.78)

The view ANALYSIS → Topic yogas judges rules that the classics give for one topic, each with the verses it is read from, in Sanskrit. It is the answer to the topic searches of the Kala software
(longevity, marriage, illness, spirituality): there, a search over "several thousand yogas from over 30 texts"; here, rule by rule from a named verse, and what cannot be judged says so.

Code: `src/lib/topicYogas.ts` (the rules and `evaluateTopic`), `src/lib/bphs79Data.ts` (the verses), `src/components/TopicYogaPanel.tsx`.
A rule has an id, the topic, the verses it comes from, what the text says follows, and a function from the chart to *met*, *not met* or *cannot be judged*.

## "Strong"

The classics say *bali* (strong) without a measure. The app takes the Ṣaḍbala of the graha at or over the strength it needs (the ratio of the Ṣaḍbala panel is 1 or more, with the default options). This is the app's own
choice and is said in the view. Aspects are counted by whole signs (the 7th for all, Mars 4th and 8th, Jupiter 5th and 9th, Saturn 3rd and 10th); Rāhu and Ketu do not aspect here.

## Spirituality: BPHS 79 (Pravrajyā-yoga), 15 verses

| Verse | Rule | In the app |
|---|---|---|
| 79.2–3, 12–13 | Four or more strong grahas in one sign: renunciation; its kind by the strongest of them, in the order of the grahas: Sun a tapasvī, Moon a Kāpālika, Mars a wearer of red, Mercury an ekadaṇḍī, Jupiter a yati, Venus a cakradhara, Saturn a nirgranthika. With many, the renunciation of all, each in its daśā | rule 1 |
| 79.4 | Those grahas strong but combust by the Sun: uninitiated, devotion to the Sun | rule 2 (all of the crowd but the Sun combust) |
| 79.5 | Combust and weak, with the Sun strong: a renunciation of the Sun | rule 3 (four combust and weak grahas in one sign) |
| 79.6–7 | The lord of the birth sign (janmabha) seeing Saturn and seen by no other graha; or weak and seen by Saturn alone | rule 4. **Two readings are made:** "janmabheśa" is the lord of the Moon's *sign* (the translations also say "star"), and "anyakheṭaiḥ adṛṣṭaḥ" is read as seen by no graha *but Saturn* |
| 79.8 | The Moon in a drekkāṇa of Saturn, a navāṁśa of Saturn or Mars, and seen by Saturn | rule 5 |
| 79.14 | The Moon, Jupiter and the Lagna seen by Saturn, Jupiter in the 9th: a tīrthakṛt | rule 6 |
| 79.15 | Saturn in the 9th, free of aspect: a king who is initiated | rule 7 |
| 79.1, 9–11 | The introduction; the victor in the war of the grahas (Venus in either course, another in the north); the one defeated gives up the renunciation; the question of equal strengths | **not judged**: they need the war of the grahas and the daśā; the verses are shown |

## Next topics (not built yet)

* **Marriage**: BPHS 18 (the 7th house, 42 verses), 80 and 83 (women), and the Phaladīpikā.
* **Longevity**: BPHS 19 (the 8th), 43–44 (the āyurdāya and the yogas of the length of life and the Māraka), 9–11 (ariṣṭa and its cancelling).
* **Illness**: BPHS 17 (the 6th), 9 (ariṣṭa).
* **Wealth and poverty**: BPHS 41–42.

Each will be added the same way: the verses first, then the rules that can be decided from a chart, then the list of what cannot.
