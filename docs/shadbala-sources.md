# Ṣaḍbala: where every rule comes from

This is the record of the audit that led to v3.37. It says, for each part of the Ṣaḍbala, what the Sanskrit text of Bṛhat Parāśara Horā Śāstra (BPHS) says, what the app does, and where the two are not the same thing. The code is in `src/lib/shadbala.ts` and the modules beside it (`shadbalaAspects.ts`, `shadbalaCheshta.ts`, `shadbalaTime.ts`).

## The rule of the audit

The Sanskrit text decides. JHora, LagnaOne, Viveka and PyJHora were used only to compare with, and a program agreeing with another is not a reason to take a formula as right. The translations and commentaries of R. Santhanam (Ranjan, 1992) and B. V. Raman (*Graha and Bhava Balas*, 1937) are a second witness where the verse is short or silent.

## What this record cannot promise

- The Sanskrit text and the verse numbers (3, 6, 26, 27) come from one online edition (enjoylearningsanskrit.com, devanāgarī with IAST). Other editions number the verses differently, and a second edition was not compared. Santhanam follows the edition of Sitaram Jha, which differs in at least one place (the order of the decanate lords, below).
- The number words of the verses (*bhūta*, *abdhi*, *kha*, *agni*, *nakha*, *tithi*, *yuga*, *kara*, *sindhu*, *rāma*, *aṅga*, *sura*, *sūrya* and so on) were read by the auditor, right to left in the Sanskrit way, and the English of that website was not trusted: it misreads some of them. Santhanam's translation gives the same numbers independently. **A reader of Sanskrit should check verses 27.2–3, 27.13, 27.15, 27.21–23, 27.32–33, 3.50–54 and 26.9–12.**
- Where the verse gives a method but no figures (the mean longitudes for Cheṣṭā Bala, the day count for the lord of the year) the figures are those of the commentators. The labels below say which.

Labels: **A** the rule is in the verse; **B** the verse leaves it open and two independent commentators agree; **C** a choice made by the app, with the sources that disagree; **E** not implemented.

## Rule by rule

| Part | Verse | The app | Label |
|---|---|---|---|
| Uccha | 27.1–2, 3.49–50 | Distance from the debilitation point (the exaltation point's opposite), up to 180°, divided by three. Exaltation points 10° Aries, 33° Taurus, 28° Capricorn, 15° Virgo, 5° Cancer, 27° Pisces, 20° Libra | A |
| Saptavargaja: vargas | 27.4, 6.5–6.27 | Rāśi, hora (Parāśara's), drekkāṇa, saptāṃśa, navāṃśa, dvādaśāṃśa, triṃśāṃśa | A |
| Saptavargaja: sum | 27.4 *aikya* | The sum of the seven scores, 0 to 315, **not divided by 7** | A |
| Saptavargaja: scores | 27.2–3 | Own mūlatrikoṇa 45, own sign 30, adhimitra 20, mitra 15, sama 10, śatru 4, adhiśatru 2. No score of its own for exaltation or debilitation | A |
| Saptavargaja: compound relation | 3.55–58 | Natural friendship (the table of the app matches the rule of 3.55 for all seven) together with the temporary one: another graha is a temporary friend in the 2nd, 3rd, 4th, 10th, 11th or 12th sign from the graha. Friend + friend = adhimitra, friend + enemy = sama, neutral + friend = mitra, neutral + enemy = śatru, enemy + friend = sama, enemy + enemy = adhiśatru | A |
| Saptavargaja: which chart | Santhanam on 27.2–4, Raman art. 25–27 | The temporary relation is read from the rāśi chart alone, in every varga | B |
| Saptavargaja: mūlatrikoṇa | Raman art. 30 | 45 only in the rāśi; in the other six vargas an own sign scores 30. Santhanam and the Saravali documentation read *evam* ("likewise") more widely | C |
| Mūlatrikoṇa degrees | 3.51–54 | Sun Leo 0–20°, Moon Taurus 3–30°, Mars Aries 0–12°, Mercury Virgo 15–20°, Jupiter Sagittarius 0–10°, Venus Libra 0–15°, Saturn Aquarius 0–20° | A |
| Ojhayugma | 27.5 *śukrendū samabhāṃśe 'nye viṣame* | The Moon and Venus in even signs, **all the others (Mercury and Saturn too) in odd signs**; 15 for the rāśi and 15 for the navāṃśa | A |
| Kendradi | 27.5 | Kendra 60, panapara 30, apoklima 15 | A |
| Drekkana | 27.6, 3.19 | Males (Sun, Mars, Jupiter) first decanate, neuters (Mercury, Saturn) second, females (Moon, Venus) third; 15 virūpa. Santhanam (Jha's edition) has the females second and the neuters third, as LagnaOne does | A, edition differs |
| Dig | 27.7–8 | The distance in degrees from the point where the graha is powerless, divided by three: the 4th for the Sun and Mars, the 7th for Jupiter and Mercury, the 1st for Saturn, the 10th for the Moon and Venus | A |
| Dig: which "house" | Santhanam on 27.7–13, Raman art. 44–45 | The four angles: ascendant, descendant, midheaven, nadir. JHora's desktop version takes equal houses from the ascendant instead (Sun 9.7 against 1.45 for the reference chart) | B |
| Natonnata | 27.8–9 | Continuous from the apparent midnight: the Moon, Mars and Saturn 60 minus twice the *nata* in ghaṭīs, the Sun, Jupiter and Venus twice the *nata*, Mercury always 60. Local noon is the midpoint of sunrise and sunset | A |
| Pakṣa | 27.10–11 | The Moon's distance from the Sun, up to 180°, divided by three, for the Moon, Mercury, Venus and Jupiter; 60 minus that for the Sun, Mars and Saturn. **Not doubled** for the Moon | A |
| Tribhāga | 27.12 | Day thirds Mercury, Sun, Saturn, night thirds Moon, Venus, Mars: 60 to the lord; Jupiter always 60 | A |
| Varṣa-Māsa-Dina-Horā | 27.13 | 15 to the lord of the year, 30 to the month's, 45 to the day's, 60 to the hour's | A |
| The four lords | Santhanam on 27.13, Raman art. 58–63 | Counted from the ahargaṇa of the Sūrya Siddhānta (714,404,108,573 days on 1 January 1860); the Vedic day runs from sunrise to sunrise; the hora lords follow Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars. Reproduces both authors' worked examples | B |
| Ayana | 27.15–17 | Declination from the sāyana longitude by the table 45 : 33 : 12 (ninety parts to 24°) interpolated inside the sign; (24° ± δ) / 48° × 60; the Moon and Saturn gain in the south, Mercury by the magnitude. **The Sun is not doubled** | A (table), B (24°) |
| Cheṣṭā: Sun and Moon | 27.18, 27.25 | The Sun's Cheṣṭā Bala is its Ayana Bala and the Moon's is its Pakṣa Bala, and Cheṣṭā is one of the six balas that are added | A |
| Cheṣṭā: Mars to Saturn | 27.24–25 | The cheṣṭā-kendra: the śīghrocca less the mean of the mean and the true longitude, over six signs taken from the circle, divided by three | A |
| Cheṣṭā: mean positions | Raman art. 87–107 (Kedarnath Dutt's tables) | The epoch of 1 January 1900 at Ujjain midnight, daily motions and yearly corrections of Raman's tables, in the Lahiri zodiac. The Sūrya Siddhānta's revolutions give the same strength within 0.2 virūpa | B |
| Naisargika | 27.14 | 60/7 times 1 to 7 for Saturn, Mars, Mercury, Jupiter, Venus, Moon, Sun, as fractions | A |
| Dṛg: aspect values | 26.6–8, 26.9–12 | The general table and the special values of Saturn, Mars and Jupiter (listed in `shadbalaAspects.ts`) | A for the general table; B for the special values, which were read from the Sanskrit and checked against Santhanam and against JHora (within 0.04 virūpa) |
| Dṛg: sum | 27.19 | A quarter of the benefic aspects less a quarter of the malefic ones | A |
| Dṛg: Mercury and Jupiter "in full" | 27.19 *jñejya-dṛk-yuktam* | **Not added.** Santhanam reads it as adding their aspects in full, Raman and JHora count only the quarter. In 27.29 (Bhāva Bala) it means in full; here adding it would raise the totals by 14–58 virūpa | C |
| Benefic and malefic | 3.11, 34.9, 3.37 | Benefics Jupiter and Venus; malefics Sun, Mars, Saturn (and Rahu and Ketu as companions of Mercury); Mercury a malefic in the sign of a malefic; the Moon a malefic while waning | A, see below |
| The waning Moon | 3.11 *kṣīṇendu* | The verses never say where waxing ends. The app takes the dark half (and the new Moon) as waning, as Santhanam and the Saravali documentation say; B. V. Raman puts the change at the eighth tithi (and JHora follows him) | C |
| Bhāva Bala: parts | 27.26–31 | Five parts: the lord's Ṣaḍbala, Dig Bala, Dṛṣṭi Bala, the occupants and the Kāla Bala. Raman leaves out the occupants and the Kāla Bala | A |
| Bhāva Dig Bala | 27.26–28 | The distance in degrees of the middle of the house from its powerless angle, divided by three: Gemini, Virgo, Libra, Aquarius, first half of Sagittarius → descendant; Aries, Taurus, Leo, first half of Capricorn, second half of Sagittarius → nadir; Cancer, Scorpio → ascendant; second half of Capricorn, Pisces → midheaven. Raman counts it in whole signs from house numbers and pairs Cancer with Pisces and the 10th | A (Santhanam and Sharma agree on Cancer); the Cancer grouping may be a corruption of the verse |
| Bhāva Dṛṣṭi Bala | 27.28–29 | A quarter of the benefic aspects less a quarter of the malefic ones on the middle of the house, Mercury's and Jupiter's aspects in full instead of the quarter (Raman art. 132). Read literally the verse adds them to the quarter (Santhanam, Sharma) | B, see the manual (C8) |
| Bhāva occupants | 27.30 | Mercury and Jupiter in the house +60 virūpa, Saturn, Mars and the Sun −60 | A |
| Bhāva Kāla Bala | 27.31 | +15 virūpa for a house in a head-rising sign by day, a both-rising sign in the twilight, a back-rising sign at night. The way each sign rises is in 4.7–23 (Scorpio's is not stated and it is counted with the head-risers) | A |
| The twilight | 46.44–47 | Five ghaṭī (two hours) either side of sunrise and sunset. The definition is in the verses on the divisions of the day for daśās; 27.31 does not define the word | C |
| The houses of Bhāva Bala | – | The verses do not say how the houses are divided. The app takes whole signs from the Lagna sign, the middle point 15° into the sign (LagnaOne's equal houses); Raman uses Śrīpati's middle points and takes the lord from the sign of the middle point | C |
| Required strength | 27.32–33 | 390, 360, 300, 420, 390, 330, 300 virūpa. (JHora has 300 for the Sun.) | A |
| Yuddha | 27.20 | **Not implemented.** The verse says the winner gains and the loser loses the difference; Raman and the Saravali documentation disagree about who wins and about the divisor. The reference chart has no planets in war | E |

The step-by-step calculation of every part, with the reference chart worked through, is in [shadbala-manual.md](shadbala-manual.md).

## Where the app differs from JHora on purpose

1. The waning Moon is a malefic in Dṛg Bala (the reference chart's Moon, 249.8° from the Sun, is a benefic in JHora).
2. The Sun's and the Moon's Cheṣṭā Bala are in the total (the verses count Cheṣṭā among the six); JHora and Raman's worked example leave them out.
3. Dig Bala uses the four angles rather than equal houses.
4. Mūlatrikoṇa scores 45 in the rāśi only, and the other grades are the verse's 20, 15, 10, 4 and 2 rather than Raman's 22.5, 15, 7.5, 3.75 and 1.875, which JHora uses.

## The reference chart

13 October 1987, 00:15 EET, Kotka (60.46667° N, 26.94583° E), Lahiri ayanamsa. The test (`src/lib/shadbala.test.ts`) holds the positions and these expected values, worked out separately from the Sanskrit rules rather than by the app:

| | Sthāna | Dig | Kāla | Cheṣṭā | Naisargika | Dṛg | Total | Required |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Sun | 179.9 | 1.4 | 45.2 | 20.5 | 60.0 | 3.1 | 310.0 | 390 |
| Moon | 188.3 | 21.8 | 140.5 | 36.7 | 51.4 | −2.2 | 436.5 | 360 |
| Mars | 128.7 | 6.9 | 170.5 | 7.4 | 17.1 | −14.3 | 316.4 | 300 |
| Mercury | 224.8 | 31.9 | 176.3 | 49.0 | 25.7 | 7.6 | 515.3 | 420 |
| Jupiter | 203.9 | 22.4 | 140.9 | 58.6 | 34.3 | −17.0 | 443.1 | 390 |
| Venus | 197.0 | 56.9 | 112.2 | 9.1 | 42.9 | 7.5 | 425.6 | 330 |
| Saturn | 191.0 | 39.5 | 155.1 | 18.9 | 8.6 | −5.3 | 407.8 | 300 |

The lords for this birth are Saturn (year), Mercury (month), the Moon (day; the birth is before sunrise, so the Vedic day is Monday 12 October) and Mars (hour).

## Verification of the Sanskrit (October 2026)

The verses listed above as needing a reader of Sanskrit were checked in three ways.

**1. A second digitization of the Sanskrit.** The text of sanskritdocuments.org (typed and proofread by Ahto Jarve, updated 22 October 2026) was compared with the text of enjoylearningsanskrit.com that the audit used, verse by verse, for the 3,843 verses that both hold (chapter 47 of the second was not read). Once a nasal before a consonant is read as an anusvāra, 3,533 verses (92 %) are letter for letter the same. The others differ in spelling and in small corrections. In the verses the Ṣaḍbala and the Bhāva Bala use there is no difference in a number word or in any rule: 26.1–14 and 27.1–40 are the same but for the last sign of 27.13, and 3.50–54 are the same; 3.49, 3.56 (*vandhu* / *bandhu*) and 6.12–6.18 differ in spelling or add a name that the calculation does not use. The twilight verses 46.44–47 are the same in both. **The two are one digitization at two stages, not two witnesses:** they share their misprints (*vaṣamāsa*, *tabdalaṃ jñenaṃ*), so their agreement shows that the transcription is consistent, not that the text is right.

**2. The number words, decoded and set against the translations of two printed editions.** The numbers of the verses were read from the Sanskrit number words, right to left in the Sanskrit way, and compared with the translations of R. Santhanam (the edition of Sitaram Jha) and Girish Chand Sharma, and with B. V. Raman:

| Verse | Sanskrit number words | The app | Santhanam | Sharma | Raman |
|---|---|---|---|---|---|
| 27.2–3 | *bhūtābdhayaḥ khāgninakhāḥ tithyo daśa yugāḥ karāḥ* | 45, 30, 20, 15, 10, 4, 2 | same | same | other table (22.5 …) |
| 27.5 | *śukrendū samabhāṃśe 'nye viṣame* | Moon and Venus even, the others odd | same | same | – |
| 27.6 | *puṃ-napuṃsaka-yoṣā* | males, neuters, females | males, females, neuters | males, females, neuters | males, neuters, females |
| 27.13 | *tithyas triṃśat śarārṇavāḥ … ṣaṣṭi* | 15, 30, 45, 60 | same | same | – |
| 27.15 | *pañcābdhayaḥ surāḥ sūryāḥ* | 45, 33, 12 | same | same | – |
| 27.21–23 | the eight motions | 60, 30, 15, 30, 15, 7.5, 45, 30 (not used) | same | same | – |
| 27.32–33 | *aṃkāgnayaḥ aṅgarāmāḥ khāgnayaḥ karasindhavaḥ navāgnayaḥ surāḥ triṃśat* | 390, 360, 300, 420, 390, 330, 300 | same | same | same |
| 3.50 | *daśa trayo 'ṣṭāśvyaḥ tithyo 'kṣā bhamitā nakhāḥ* | 10, 3, 28, 15, 5, 27, 20 | same | same | – |
| 3.51–54 | the mūlatrikoṇa degrees | Sun 0–20, Moon 3–30, Mars 0–12, Mercury 15–20, Jupiter 0–10, Venus 0–15, Saturn 0–20 | same | same | – |
| 26.9–12 | the special aspects | the table of the manual | same | Jupiter's *śara-veda* given as +15, not +45 | – |

**What this found.**
- *Drekkana (27.6).* The two printed translations follow an edition in which the females are second; the digitizations and Raman have the neuters second. Neither can be shown wrong from here, so the app follows the Sanskrit text it was given and offers the other order as a setting (C14).
- *26.12.* Sharma's "increase by 15" for Jupiter is a slip: *śara-veda* is 5 and 4, read right to left 45, which is Santhanam's number and the one that makes the aspect full (60) at the 5th and 9th place. The app has 45.
- *27.13.* Sharma divides the ahargaṇa by 60 for the lord of the year where Santhanam divides by 360. 360 gives the worked examples of both Santhanam and Raman, and the app uses it.
- *27.15–17 and 27.19.* Sharma confirms the method of the Ayana Bala (the Bhuja from the nearer equinox, 45 : 33 : 12, three signs added or taken off for the north and the south) that the app implements, and both translators read "the entire Dṛṣṭi of Mercury and Jupiter" as added to a planet's Dṛg Bala, where the app, following Raman and JHora, takes only the quarter (a setting, C8).
- *27.26–31.* Both translations agree with the reading of the Bhāva Bala, Cancer and Scorpio from the Lagna included.

**3. What this does not settle.** All the sources descend from the same printed tradition of the text, so an error common to the printed editions would pass every check above. A reading of the printed Sanskrit of Sitaram Jha's edition, or of a manuscript, is the only thing that would settle it. Nothing found changes the calculation; the only new thing is the Drekkana setting.
