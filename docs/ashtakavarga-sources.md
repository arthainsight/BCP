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

## What is not in the app

The reductions (*trikoṇa śodhana*, 67; *ekādhipatya śodhana*, 68), the multiplication into the Piṇḍas (69), the effects (70) and the longevity from the Aṣṭakavarga (71) are not calculated: the app shows the BAV and the SAV only.


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
