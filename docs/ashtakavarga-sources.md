# Aṣṭakavarga: where the bindu tables come from

The Bhinnāṣṭakavarga (BAV) of a graha gives it a bindu for each of the houses, counted from each of eight bodies (the seven grahas and the Lagna), that the table allows. The Sarvāṣṭakavarga (SAV) is the sum of the seven BAVs. The tables are in `src/lib/ashtakavarga.ts` (`PARASHARA_AV`); the tests are in `src/lib/ashtakavarga.test.ts`.

## What BPHS 66 says

BPHS 66.13–15 names two kinds of place for each body: **karaṇa** (marked by a bindu, a dot, the inauspicious ones) and **sthāna** (marked by a rekhā, a line, the auspicious ones). The app's "bindu" of a BAV is the verses' *sthāna*: the places where a graha is auspicious for the planet.

The chapter gives the same information twice for each of the eight charts:

| Verses | What | Form |
|---|---|---|
| 66.16–42 | The *karaṇa* (the places without a point in the modern sense) of the Sun, Moon, Mars, Mercury, Jupiter, Venus and Saturn | first the number of bodies in each house, then the names |
| 66.44–60 | The *sthāna* of the same seven | the names, house by house |
| 66.61–68 | The karaṇa and the sthāna of the Lagna | |

Every house of every chart has the eight bodies split between the two, so the karaṇa and the sthāna of a house are complements. That makes a check possible without trusting a translation: the Sanskrit gives numbers (the counts of 66.16–40) and names (the lists), and the two must agree.

## The check (October 2026)

1. The **numbers** of the karaṇa verses (how many bodies have no point in each house) were read from the Sanskrit number words and compared with the table: the Sun's, Mars's, Mercury's, Jupiter's, Venus's and Saturn's agree in all 72 houses; **the Moon's table disagreed in two houses** (the verse says 6 in the 2nd and 8 in the 12th; the table gave 7 and 7).
2. The **names** were read from the Sanskrit: the sthāna verses of the Sun (66.44–46), the Moon (66.46–48), Mars (66.49–50) and Mercury (66.51–53), house by house, and the karaṇa verses of Jupiter, Venus and Saturn (66.31–42). The Sun's, Mars's, Mercury's, Jupiter's, Venus's and Saturn's tables agree with the verses in every body. Venus from Mars is 3, 4, 6, 9, 11, 12 (66.35–38), as in the BPHS; Brihat Jataka has the 5th instead of the 4th.
3. **The Moon's table had three entries that the verses do not have**, in the same eight-body totals (49):

| In the Moon's Aṣṭakavarga | Until v3.42 | The verses (66.20–23, 66.46–48) |
|---|---|---|
| Moon from the Moon | 1, 3, 6, 7, 10, 11 | 1, 3, 6, 7, **9**, 10, 11 |
| Mars from the Moon | 2, 3, 5, 6, **9**, 10, 11 | 2, 3, 5, 6, 10, 11 |
| Jupiter from the Moon | 1, **4**, 7, 8, 10, 11, **12** | 1, **2**, 4, 7, 8, 10, 11 |

The sthāna of the 2nd house of the Moon's chart is *kujāryau* (Mars and Jupiter), the 9th is *śukrendū* (Venus and the Moon) and the 12th is *śūnyam* (none), and the karaṇa lists agree: the 9th names *horārkārārkivijjīvāḥ* (the Lagna, Sun, Mars, Saturn, Mercury, Jupiter) as having no point, which is the Moon's absence from it, and *vyaye … sakalāḥ* (all eight) in the 12th. The verses' own numbers (6 in the 2nd, 8 in the 12th) fit only this. The corrected table is also the one PyJHora uses.

The app now follows the verses. If you hold another printed table for the Moon, the three entries above are where it will differ.

## The reductions, the Piṇḍas, the Prastāra and the Kakṣyā

The app now works the reductions (*trikoṇa śodhana*, BPHS 67; *ekādhipatya śodhana*, 68) and the Piṇḍas (69) from the Sanskrit of the verses, in `src/lib/ashtakavargaShodhana.ts`; the effects (70) and the longevity from the Aṣṭakavarga (71) are not calculated. The views are in ANALYSIS → Aṣṭakavarga (Prastāra, Śodhana & Piṇḍa, Kakṣyā).

### What the verses say (the Sanskrit of the edition of sanskritdocuments.org, chapters 67–69)

| Verses | Text | The app |
|---|---|---|
| 67.2–3 | The trines: Aries, Leo, Sagittarius; Taurus, Virgo, Capricorn; Gemini, Libra, Aquarius; Cancer, Scorpio, Pisces | The four trines of the signs 0, 4, 8 and so on |
| 67.4 | त्रिकोणेषु च यन्न्यूनं तत्तुल्यं त्रिषु शोधयेत् । एकस्मिन् भवने शून्यं तत् त्रिकोणं न शोधयेत् | The least of the three is taken from each; a sign with no bindu in the trine stops it |
| 67.5 | समत्वे सर्वगेहेषु सर्वं संशोधयेद् बुधः | All three alike: all three become nought |
| 68.1 | पूर्वं त्रिकोणं संशोध्य … ततः कुर्यादेकाधिपतिशोधनम् | The Ekādhipatya is worked on what the Trikoṇa leaves |
| 68.3 | उभयोर्ग्रहसंयोगे न संशोध्यः कदाचन् | A graha in both signs: no reduction |
| 68.3 | ग्रहयुक्ते फलैर्हीने ग्रहाभावे फलाधिके । ऊनेन सममन्यस्मिन् शोधयेद् ग्रहवर्जिते | The graha-held sign has the less, the empty one the more: the empty one is made equal to the lesser |
| 68.4 | फलाधिके ग्रहैर्युक्ते चान्यस्मिन् सर्वमुत्सृजेत् | The graha-held sign has the more: the empty one goes (to nought) |
| 68.5 | उभयत्र ग्रहभावे समत्वे सकलं त्यजेत् । सग्रहाग्रहयोस्तुल्ये सर्वं संशोध्यमग्रहे | Both empty and equal: both go; one held and one empty and equal: the empty one goes |
| 68.2 | क्षीणेन सह चान्यस्मिन् … ग्रहवर्जिते | Both empty and unequal: the greater is brought down to the lesser |
| 68.6 | कुलीरसिंहयो राश्योः पृथक् क्षेत्रं पृथक् फलम् | The Sun and the Moon own one sign each: no Ekādhipatya for them |
| 69.1 | What is left × the number of the sign; in a sign with a graha, × the number of the graha | Rāśi Piṇḍa and Graha Piṇḍa; their sum is the Śodhya Piṇḍa |
| 69.2–3 | गोसिंहौ दशभिर्गुण्यौ वसुभिर्युग्मवृश्चिकौ । सप्तभिस्तुलमेषौ च मृगकन्ये च पञ्चभिः । शेषाः स्वसंख्यया | Taurus, Leo 10; Gemini, Scorpio 8; Libra, Aries 7; Capricorn, Virgo 5; the rest by their own number: Cancer 4, Sagittarius 9, Aquarius 11, Pisces 12 (the sum is 96) |
| 69.4 | जीवारशुक्रसौम्यानां दशाष्टनगसायकाः । पञ्च शेषग्रहाणां च | Jupiter 10, Mars 8, Venus 7, Mercury 5; the others (Sun, Moon, Saturn) 5 |

The verses say *graha* for what makes a sign occupied; the app counts the nine grahas, Rahu and Ketu included, and not the Lagna. Rahu and Ketu have no number of their own in 69.4, so they make a sign occupied and add nothing to the Graha Piṇḍa.

### What PyJHora does differently

All of PyJHora's work (the Bhinna, Sarva and Prastāra tables, the reductions and the Piṇḍas, 32,760 numbers in 120 charts) is reproduced to the number by the app's `pyjhora` rules, which is what `src/lib/pyjhoraAshtakavarga.test.ts` checks. Three things in PyJHora are not what the verses say, and the `bphs` rules (the default) follow the verses:

1. **The number of Virgo.** PyJHora has 6; the verse 69.3 says Capricorn and Virgo by five (*mṛgakanye ca pañcabhiḥ*), and the sum of the numbers is the 96 that the books give (PyJHora's is 97).
2. **A sign with a graha against an empty one of the same value.** 68.5 reduces the empty one to nought; PyJHora keeps both.
3. **The Lagna as a graha.** PyJHora makes a sign occupied by the Lagna alone; the verses speak of grahas.

In the charts of the test (random placements) the Śodhya Piṇḍas differ in 487 of 840 cases between the two rules, nearly all of them because of the number of Virgo.

## The effects: BPHS 70 and 72

ANALYSIS → Aṣṭakavarga → Effects (`src/lib/ashtakavargaPhala.ts`). What is worked out is what the verses state as a rule; none of it is checked against another program (PyJHora has none of it), and where the verses are short the choice made is named here.

| Verses | Text (the Sanskrit of the edition of sanskritdocuments.org) | The app |
|---|---|---|
| 70.1–4 | आत्मस्वभावशक्तिश्च पितृचिन्ता रवेः फलम् । मनोबुद्धिप्रसादश्च मातृचिन्ता मृगाङ्कतः … सर्वक्षयं च मरणं मन्देनैव निरीक्षयेत् | What each graha's Aṣṭakavarga is for: the Sun's the self and the father, the Moon's the mind and the mother, Mars's brothers and land, Mercury's livelihood and friends, Jupiter's body, learning, children and wealth, Venus's marriage and vehicles, Saturn's life, grief and death |
| 70.5–6 | तत्तद्भावफलाङ्केन गुणयेद् योगपिण्डकम् । सप्तविंशोद्धृतं शेषतुल्यर्क्षे याति भानुजः यदा तदा तस्य तस्य भावस्यार्ति विनिर्दिशेत् | The Piṇḍa times the bindus of the house, divided by 27; Saturn in the nakṣatra of the remainder troubles the house |
| 70.7–10 | अर्काश्रितर्क्षान्नवमो राशिः पितृ गृहं स्मृतम् … तत्त्रिकोणगते वापि … अर्कोद्धृतावशेषर्क्षे … तत्त्रिकोणर्क्षकं वापि पितृकष्टं | The Sun: the 9th from its sign is the father's; by 27 and by 12; Saturn in the nakṣatra or sign of the remainder or in its trine troubles the father |
| 70.22–23, 70.24–27, 70.28–29, 70.30–33, 70.35–36, 70.37 and 70.41–42 | The 4th from the Moon (the mother), the 3rd from Mars (brothers), the 4th from Mercury (kin, friends), the 5th from Jupiter (children), the 7th from Venus (the wife, *jāmitra*), the 8th from Saturn (death) | The same working for each |
| 70.19–21 | सूर्याष्टवर्गे यञ्छून्यं तन्मासे वत्सरेऽपि च । विवाहव्रतचूडादि शुभकर्म परित्यजेत् । यत्र रेखाधिका तत्र … शुभकर्म समाचरेत् । एवं चन्द्राष्टवर्गे च यत्र शून्यं भवेद् बहु … | The signs with no bindu in the Sun's and the Moon's Aṣṭakavarga are not for auspicious acts while the Sun or the Moon goes through them; those with the most favour them |
| 72.3 | त्रिंशाधिकफला ये स्युः राशयस्ते शुभप्रदाः । पञ्चविंशादित्रिंशान्तफला मध्यफलाः स्मृताः । अतः क्षीणफला ये ते … कष्टदुःखदाः | A sign of the Sarvāṣṭakavarga: more than 30 good, 25 to 30 middling, fewer poor |
| 72.8 | लग्नं फलाधिकं यस्य भोगवानर्थवान् हि सः । विपरीतेन दारिद्र्यं भवत्येव न संशयः | A Lagna with the more is of enjoyment and wealth, with the fewer of want |
| 72.9–10 | दशावदिह भावानां कृत्वा खण्डत्रयं बुधः । पश्येत् पापसमारूढं खण्डे कष्टकरं वदेत् … क्रमाद् बाल्याद्यवस्थासु खण्डत्रयफलं वदेत् | The houses in three parts, a malefic in a part troubling its stage of life (childhood, adulthood, old age) |

**What the verses leave open, and what the app took:**

1. *Which bindus.* The verse says "the number of the house" (*bhāvaphala*); the app takes the bindus of the graha's own Bhinnāṣṭakavarga in that sign before the reductions. For Mars 70.25 speaks of the Trikoṇa Śodhana for land and the wife, which is not the same thing as the product of 70.24–27.
2. *Which Piṇḍa.* The *yogapiṇḍa* of the verse is taken as the graha's Śodhya Piṇḍa (the Rāśi and the Graha Piṇḍa added), with the rules of the Śodhana of the page (the verses' own by default).
3. *A remainder of nought* is taken as the divisor: the 27th nakṣatra (Revatī), the 12th sign (Pisces). A product of nought (no bindu in the house) gives no point.
4. *The trine of a nakṣatra* is the nakṣatras nine and eighteen on from it; the trine of a sign the signs four and eight on.
5. *The three parts of the houses* (72.9–10) are taken as four houses each, and the malefics as the Sun, Mars, Saturn, Rahu and Ketu.

**What is not calculated.** BPHS 71 gives a length of life from the Aṣṭakavarga: days for a few rekhas and years for many, and half of the sum of what every graha gives (71.1–4). The numbers of the verses are not clear (days for nought to three rekhas but seven and a half days for four, then years for five and more), and a reading of them would be a guess, so the app does not give it; the Piṇḍāyu and the Aṃśāyu of the Ayurdāya panels are other methods. The months of 72.11–29, in which each number of rekhas of the sign of the month has a danger and a gift to give against it, are not given either.

### Prastāra and Kakṣyā

The Prastāra is the table the Bhinnāṣṭakavarga is made of (the eight bodies that give a bindu, sign by sign); it is checked against PyJHora. The Kakṣyā (a sign in eight parts of 3°45′, ruled in the order Saturn, Jupiter, Mars, the Sun, Venus, Mercury, the Moon, the Lagna) is not in BPHS 66–69 and is not checked against another program; the order is the traditional one by the speed of the grahas.


## Varāhamihira: Bṛhajjātaka, chapter 9

The application now includes a separate **Varāhamihira** system based on the Sanskrit bindu lists in Bṛhajjātaka 9.1–9.7. The Sanskrit text and a word-by-word-supported translation can be consulted at [Wisdomlib, Bṛhajjātaka chapter 9](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501544.html); the chapter's Sanskrit verses are also available individually for [9.1](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501710.html), [9.2](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501711.html), [9.3](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501712.html), [9.4](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501713.html), [9.5](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501714.html), [9.6](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501715.html), and [9.7](https://www.wisdomlib.org/hinduism/book/brihat-jataka-by-varahamihira-sanskrit-english/d/doc1501716.html).

### Table differences encoded

Relative houses are counted from the contributing graha/Lagna, as in the Parāśara implementation. The Bṛhajjātaka lists differ from the currently verified BPHS table in these four contributor rows:

| Target BAV | Contributor | BPHS 66 | Bṛhajjātaka 9 |
|---|---|---|---|
| Moon | Moon | 1, 3, 6, 7, 9, 10, 11 | 1, 3, 6, 7, 10, 11 |
| Moon | Mars | 2, 3, 5, 6, 10, 11 | 2, 3, 5, 6, 9, 10, 11 |
| Moon | Jupiter | 1, 2, 4, 7, 8, 10, 11 | 1, 4, 7, 8, 10, 11, 12 |
| Venus | Mars | 3, 4, 6, 9, 11, 12 | 3, 5, 6, 9, 11, 12 |

The first three differences are in the Moon's BAV as stated in Bṛhajjātaka 9.2; the last is Venus from Mars in Bṛhajjātaka 9.6. The remaining contributor rows match the current Parāśara table. Both systems retain the same BAV totals (48, 49, 39, 54, 56, 52, 39) and SAV total (337), because the changes shift positions without changing the number of bindus in each affected contributor row.

Implementation: `VARAHAMIHIRA_AV` and the `AshtakavargaSystem` parameter in `src/lib/ashtakavarga.ts`; the UI source selector is in `src/components/AshtakavargaPanel.tsx`. The default remains Parāśara, so existing charts retain their prior output unless the user selects Varāhamihira.
