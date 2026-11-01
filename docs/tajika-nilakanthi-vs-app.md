# The Tājika Nīlakaṇṭhī beside the Varṣaphala of the app

Read: `tajika_nilakanthi` (Sanskrit with the Hindi commentary of Mahīdhara, Venkateshwar Press edition). The text layer is an OCR of Devanagari print: the Sanskrit verses are often legible, the commentary less so;
what could not be read is said below.

## What the text gives and the app does since v3.75

| Place in the text | Rule | In the app |
|---|---|---|
| Saṃjñātantra 30–40 | **Pañcavargīya Bala**: Kṣetra 30, Uccha 20, Hadda 15, Drekkāṇa 10, Navāṁśa 5; a graha has the whole in its own, ¾ in a friend's, ½ in a neutral and ¼ in an enemy's, and the total is divided by 4; the Uccha is the arc from the deepest debilitation (reduced below 180°) over 9 | **already as in the text** (`panchaVargiyaBala`) |
| Varṣatantra, "varṣadaśākramavicāraḥ" 1–3 | **Pātyāṁśī daśā**: the degrees of the Lagna and the grahas within their signs, from the smallest; each one's pātyāṁśa is its degrees less those of the one before; the pātyāṁśas add up to the greatest degrees; the year (or month) is divided in proportion, in that order; with equal degrees the slower comes first | **new** (`patyamsha.ts`): in the Varṣaphala panel, before the Mudda. The Lagna and the seven grahas (Rāhu and Ketu are not in the example); the year is the real span of the Sun's return, not 360 days |
| the same, antardaśā | the antardaśā of a graha in the daśā of another: their days multiplied over the days of the year | as that; **the order of the sub-periods is not stated in the lines read**: they begin with the lord of the daśā and follow the same order, as the other daśās of the panel do |
| the commentary on 15 | The daśās of a year are many: Pātyāṁśī, Tāsīra, Bhāva-tāsīra, Sthira-bhāva-tāsīra, Kālahorā, Hadda, Naisargika, Tanubhāva, **Mudda**, Balarāma's, Gaurī's, Rāma's. Nīlakaṇṭha gives only the Pātyāṁśī; Mahīdhara describes the others "for the use of everyone", the Mudda by the birth nakṣatra plus the years gone, divided by 9 (Sun, Moon, Mars, Rāhu, Jupiter, Saturn, Mercury, Ketu, Venus) | The Mudda of the app agrees with this and is now said to be of the commentary, not of Nīlakaṇṭha. The other daśās are **not built** |
| Varṣatantra, "māsadinapraveśānayanaṃ tatphalāni ca" 1–2 | **Māsa-praveśa**: the Sun of the birth carried (n − 1) signs on for the nth month of the year; **Dina-praveśa**: (n − 1) degrees on for the nth day | **new** (`/api/varshaphala/period`, `VarshaPeriodPanel`): the chart for those moments, 12 months and 360 days from the Varṣa-praveśa |
| 3–4 | The office bearers of the month, six: the lord of the month's Lagna, of its Muntha, of the birth Lagna, the Tri-rāśi lord, the lord of the Sun's sign by day (the Moon's by night), the lord of the Varṣa Lagna; "the one who is more" is the lord | **new**; the text does not say what makes one "more", so the strongest by Pañcavargīya Bala is marked and said to be the app's measure |
| commentary on 3–4 | The Muntha of the month: that of the year plus 2°30′ for each month (the commentary says "the number of the month"; read as the months gone, so that the twelfth month ends where the next year's Muntha begins) | **a reading** (n − 1) × 2°30′ |
| 5–14 | The results of the month by the Lagna, Muntha and the nakṣatras of the lords; the month's daśā as the year's with 30 days for 360 | the Pātyāṁśī of 30 days for 360; the **results are not built** |
| 16–32 | Dina-praveśa: seven office bearers (Muntha, Tri-rāśi, the birth Lagna or sign — the print is unclear —, the Sun's or the Moon's sign, the lords of the day's, month's and year's Lagnas) and the Moon's avasthā | **not built** (the list of seven cannot be read with certainty) |

## What is not in the text read, or cannot be read

* **Harṣa Bala** is not in this text (no trace under any spelling). It is of other Tājika books.
* **Dvādaśavargī** (verses 41–47, "horā-drekkāṇa-caturthāṁśa-pañcamāṁśa-ṣaṣṭhāṁśa-saptāṁśa-aṣṭāṁśa-navāṁśa-daśāṁśa-ekādaśāṁśa-dvādaśāṁśa"; more benefic than malefic lords in the vargas of the Lagna
  and of a graha means a good year) **is in the text**, but the divisions are readable only for ten of twelve: the horā, drekkāṇa, caturthāṁśa, pañcamāṁśa, ṣaṣṭhāṁśa, saptāṁśa, aṣṭāṁśa, navāṁśa and dvādaśāṁśa are legible; the **daśāṁśa and
  ekādaśāṁśa** are garbled in the print (the daśāṁśa is in sets of two signs, Aries and Libra from Aries, Taurus and Scorpio from Aquarius, Gemini and Sagittarius from Libra, and the rest cannot be read). They are not built until
  a better copy of the text is found: guessing two vargas would make the count of benefic and malefic lords wrong.
* The Sanskrit verses of the results and the avasthās of the Moon in the Dina-praveśa are legible in part only.

## Praśna: the Tājika yogas of a question — in the app since v3.76

The Praśna Mārga (the Kerala classic of the question) is in the corpus only as a poor OCR of the Sanskrit of its first part, too broken to build on. The Tājika Nīlakaṇṭhī has a Praśna tantra
(the third, with the Saṃjñātantra's sixteen yogas that it uses), whose Sanskrit is legible in part and whose Hindi commentary is legible enough to follow. The panel (ANALYSIS → Praśna) is built on that.

| Verse | Rule | In the app |
|---|---|---|
| 49–56 | The matter of each house: the 1st the body, character; the 2nd gold, jewels, wealth; the 3rd brothers, servants, journeys; the 4th the mother, home, vehicles, land; the 5th children, counsel; the 6th sickness, enemies, four-footed animals; the 7th the wife, trade, things lost; the 8th death, debts; the 9th faith, father, journeys; the 10th the kingdom, honour; the 11th gain; the 12th expense, imprisonment | the house chosen in the panel; the matters are a short form of the commentary |
| Saṃjñātantra 2 (the dīptāṁśa) | Sun 15, Moon 12, Mars 8, Mercury 7, Jupiter 9, Venus 7, Saturn 9 (some give 12 to all) | as the first |
| ṣoḍaśayogādhyāya 4–9 | **Ithasāla**: the swifter graha is behind the slower in the degrees of its sign, the signs having a Tājika aspect (conjunction, sextile 3/11, square 4/10, trine 5/9, opposition 7), and the slower within the dīptāṁśa of the swifter; of the lord of the Lagna and the lord of the house of the matter it brings the matter about, and the days are the degrees between times 12 | **built** |
| 10 | **Īśarāpha**: the swifter has gone a degree beyond the slower: the matter turns away | **built** (a degree or more past, within the dīptāṁśa) |
| 11–13 | **Nakta**: the two lords have no aspect; a third graha, swifter than both, between them in degrees and aspecting both within its dīptāṁśa, takes the light of the one behind and gives it to the one in front: the matter comes through another | **built** |
| 14–16 | **Yamayā**: the two lords have no aspect and a slower third graha aspects both and takes the light of the swifter and gives it to the slower | **not built**: the commentary's example cannot be read in the print to say which degrees are meant |
| 17–20 | **Maṇaū**: Mars or Saturn takes away the light of the swifter in front or behind within its dīptāṁśa, by equal aspect, in the same sign or the 7th and others; the Ithasāla comes to nothing | **not built**: the conditions are broken in the print (twelve kinds are named) |
| 21–22 | **Kambūla**: the Ithasāla of the two lords and the Ithasāla of the Moon with one of them or both; better as the Moon is stronger (thirty-two kinds by the grade of the Moon and of the lords) | **built** in short: the Moon as a third graha in Ithasāla with either or both, graded uttama in its own or exaltation sign (Cancer, Taurus), adhama in its debilitation (Scorpio) and sama otherwise; the middle grade (the Moon's own hadda, drekkāṇa and navāṁśa) is not given, because the Moon has no hadda and the text's wording is broken |
| the other eleven | Gairi-kambūla, Khallāsara, Radda, Duphali-kuttha, Duttotthadavīra, Tambīra, Kuttha, Durupha, Ikkabāla, Induvāra, Yamayā/Maṇaū as above | **not built** |

Open points the print leaves: whether the dīptāṁśa of the swifter, or the half of the sum of the two, is the orb of the Ithasāla (the commentary says the swifter's); whether a retrograde graha counts as swifter or slower; the days per degree (12 is the text's rule for the Ithasāla, and it is given as such). The results of the verses by the nature of the grahas (a malefic Ithasāla, the help of the friends of the lords, 7–9) are not built.
