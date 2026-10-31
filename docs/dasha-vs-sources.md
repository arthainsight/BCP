# The daśās of the app beside the Sanskrit text

The classics decide. This page sets the daśā systems of the app beside the **Bṛhat Parāśara Horā Śāstra** (BPHS), chapters 46 to 51, in the
Sanskrit with IAST (the text of enjoylearningsanskrit.com, read with its transliteration; the English of that site is a help, not the
authority). The Jaimini systems are read in the **Jaimini Sūtras** (adhyāya 2) in the edition *Jaimini Sūtram with the Tattvādarśa of Sītārāma Jhā* (Chowkhamba, Sanskrit with Hindi; archive.org `VTRy_jaimini-sutram-by-jaimini-chowkhamba-vidya-bhavan-varanasi`); the Nārāyaṇa daśā is not in that edition.

**The rule of the project (said by the user, 31 October 2026):** where the original text says something other than PyJHora, the text is the default of the app and the PyJHora way is a choice in the Settings.

Verses are cited as 46.n (chapter, verse). "Matches" means the code does what the verse says; every figure below was compared with the code.

## What matches

| System | The rule in the text | In the app |
|---|---|---|
| Vimśottarī | 46.12–16: the nine lords in the order Sun, Moon, Mars, Rāhu, Jupiter, Saturn, Mercury, Ketu, Venus, counted from Kṛttikā three times round; 120 years (46.14); the balance at birth is the part of the nakṣatra not yet passed (46.16) | the same cycle (Ketu from Aśvinī is the same ring), years 7, 20, 6, 10, 7, 18, 16, 19, 17, the balance from the Moon's position in its nakṣatra |
| Antardaśā and the levels below | 51.1–2: the years of the daśā times the years of the lord divided by the whole (120), the first sub-period that of the daśā lord, then in order; likewise the next level | `calculateSubDashas`: parent × lord years / 120, from the parent's lord |
| Aṣṭottarī | 46.17–22: the lords Sun, Moon, Mars, Mercury, Saturn, Jupiter, Rāhu, Venus with 6, 15, 8, 17, 10, 19, 12, 21 years (108); counted from Ārdrā in groups of 4, 3, 4, 3 (28 nakṣatras, with Abhijit) | the same; Abhijit is the last quarter of Uttara Āṣāḍhā and the first fifteenth of Śravaṇa |
| Aṣṭottarī, when | 46.17: Rāhu in a kendra or a koṇa from the lord of the Lagna, not in the Lagna | `evaluateAshtottariEligibility`: the same (Rāhu with the lord of the Lagna counts as a kendra) |
| Yoginī | 46.196–200: Maṅgalā, Piṅgalā, Dhanyā, Bhrāmarī, Bhadrikā, Ulkā, Siddhā, Saṅkaṭā, of 1 to 8 years (Moon, Sun, Jupiter, Mars, Mercury, Saturn, Venus, Rāhu); the number of the nakṣatra and 3 divided by 8, the remainder 1 being Maṅgalā | the same: Aśvinī starts Bhrāmarī (1 + 3 = 4) |
| Kālachakra, years of the signs | 46.84: the Sun 5, Moon 21, Mars 7, Mercury 9, Jupiter 10, Venus 16, Saturn 4, by the lord of the sign | 7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10 |
| Kālachakra, the four groups | 46.56–58, 65, 71–72, 77 | see below |
| Kālachakra, the sixteen sequences | 46.60–81: for each group and pada the sequence of the nine signs | all sixteen are in `kalachakra.test.ts`, typed from the numbers of the verses |
| Kālachakra, Deha and Jīva | 46.94–95: in savya the first sign is Deha, the last Jīva; reversed in apasavya | the same |
| Kālachakra, the balance | 46.92: the part of the pada passed times the years of the first sign | the same |

## Corrected by this comparison

**Kālachakra: Revatī was in the wrong group.** 46.58 names the first savya group: "aśvinī, aditi, hasta, … mūla, proṣṭhapadā, vahni, vāta, viśva(rkṣa), revatī … savyatārakāḥ" — ten stars, "aśvinyādidaśatārāṇām" (46.62); the second savya group is five (Bharaṇī, Puṣya, Citrā, Pūrva Āṣāḍhā, Uttara Bhādrapadā, 46.65). The app had the first group at nine and the second at six, with Revatī in the second. By number the stars of the first group are 1, 3, 7, 9, 13, 15, 19, 21, 25 and 27 (pairs six apart), the second 2, 8, 14, 20, 26; Revatī (27) belongs with Aśvinī. The Kālachakra of a Moon in Revatī is now that of the first savya group (pada 1: Aries to Sagittarius), not the Pisces–Scorpio sequence of the second. The four groups are now typed in the test, nakṣatra by nakṣatra.

**Chara daśā (Jaimini Sūtras 2.3.26–29, 2.3.30, 2.4.7–10, with BPHS 46.155–165): the start of the app was not the text.**
The app had a choice of conventions with defaults that none of the texts has:

| | The text | The app before |
|---|---|---|
| Order of the signs | 2.3.29 "pañcame padakramāt prāk-pratyaktvaṃ caradaśāyām": direct if the **9th from the start** is in an odd pada (Aries to Gemini, Libra to Sagittarius), reverse if in an even one (so direct for Aries, Leo, Virgo, Libra, Aquarius and Pisces rising) | by the kind of the sign itself (movable forward, fixed and dual reverse), or odd/even |
| The years | 2.3.26–29 and BPHS 46.156: the count from the sign to its lord, in the direction of the **pada of the sign** (direct for Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius; reverse for the others), **less one** (the lord in the 2nd sign: 1 year; in the sign itself 12; "svarāśisthite nāthe dvādaśābdāḥ"), one more for an exalted lord, one less for a debilitated one | counted with the sign itself ("inclusive": one year too many for every sign), in the direction of the kind of the sign |
| A sign with two lords | the Vṛddhakārikā: both in the sign, 12; one in the sign, the other's count; both elsewhere, the one with more grahas with it, then the sign of more strength (movable, fixed, dual), then the larger count; an exalted one before the other | one lord chosen in the settings (Ketu, Saturn) |
| Sub-periods | 2.3.30: a twelfth each; 2.4.7: from the stronger of the dasha sign and its 7th; 2.4.8 movable: the twelve in order, direct for Aries and Libra, reverse for Cancer and Capricorn; 2.4.9 fixed: every sixth sign ("ṣaṣṭha-ṣaṣṭha"), direct for Leo and Aquarius, reverse for Taurus and Scorpio; 2.4.10 dual: the angles, then the 5th, 8th, 11th and 2nd from the start, then the rest, direct for Gemini and Sagittarius, reverse for Virgo and Pisces | always the twelve signs in order, from the sign after the dasha sign (or the sign itself) |

The app now follows the text by default (Settings → dasha methods → Chara method: "the Jaimini Sutras"); the old choices are kept under "my own choices". A count that comes to 0 (a debilitated lord in the 2nd sign) is left at 1 year, as before. The orders of the sub-periods are in `charaClean.test.ts`, typed from the examples of the commentary.

**Sthira daśā (Jaimini Sūtras 2.3.1–4):** 7, 8 and 9 years for movable, fixed and dual signs from the sign of Brahma (as the app had). The commentary runs the signs reverse from an even Brahma sign (its example: Scorpio); the app ran always forward (PyJHora's choice). 2.3.1–2: the sub-periods of an odd sign from the sign itself in order, of an even sign from its 7th in reverse; the app began every sub-period with the sign itself. Both are now the default of Settings ("Sthira: Jaimini Sutras 2.3"); the PyJHora way is the other choice.

## Readings of the text put right by the sense, not by the letter

* 46.15 prints Mercury 19 as well as Saturn 19 (total 122); 46.14 says 120, and the usual 17 for Mercury makes 120. The app has 17.
* 46.68 ends the sequence with "rāma" (3) where the Jīva sign, Virgo (6), is meant; 46.74 starts it with "aṅka" (9) where "aṅga" (6) is meant. The app has Virgo in both.
* 46.61 gives the second pada of the first savya group only as "from Makara to Mithuna"; the sequence in the app (Capricorn, Aquarius, Pisces, Scorpio, Libra, Virgo, Cancer, Leo, Gemini) is the one that the jumps of 46.96–100 (Maṇḍūka, Markaṭī, Siṃhāvalokana) make of it.

## What the app does not do, or does by another rule

| Subject | The text | The app |
|---|---|---|
| Aṣṭottarī, the other condition | 46.23: Aṣṭottarī is to be taken for a birth by day in the dark half or by night in the bright half | **done (v3.68)**: either condition makes the daśā apply; the panel states both and what the chart has. "Day" is the Sun above the horizon (from the 7th house to the 12th, by degrees from the Lagna), "the dark half" the Moon 180°–360° ahead of the Sun |
| Sthira, the Brahma graha | 46.171–173: the strong lord of the 6th, 8th or 12th in an odd sign; among several, the one in the highest degree, then the stronger | the lords are scored (a friendly sign, an odd sign, in the first seven signs), then the stronger of the best two; the degree is not used |
| The year | the text does not say what a year of a daśā is | a Julian year (365.25 days), with no choice |
| Nārāyaṇa, Mūla | not in BPHS | the tables follow PVR / JHora; not compared with the Jaimini Sūtras |
| Kālachakra, the sub-periods | not read | proportional to the years of the signs, from the parent's sign in the cycle; not compared |
| Other daśās of 46.3–11 | Ṣoḍaśottarī, Dvādaśottarī, Pañcottarī, Śatābdikā, Caturaśītisamā, Dvisaptati, Ṣaṣṭi, Ṣaṭtriṁśat: **done (v3.68)**, see `dasha-candidates.md` section A. Kāla, Cakra, Pañcasvara, Paiṇḍī, Aṁśī, Aṣṭavarga, Sandhyā, Pācaka, Tārā | the first eight are in the app, off to begin with; the rest are not |
| Brahma graha | Jaimini 2.1.49–54: the strong lord of the 6th, 8th or 12th from the stronger of the Lagna and the 7th, in an odd sign, behind it; for Saturn, Rāhu or Ketu the planet in the 6th from it or its lord; among several the one with more degrees, with Rāhu the one with fewest; also the 8th lord from the Ātmakāraka and the planet in the 8th; in a dispute the stronger | `brahma()` scores the lords (a friendly sign, an odd sign, in the first seven signs); the rest of the sūtras is not applied |
| Kendrādi (Mūla) | 2.4 (commentary on "kendrādi rāśi daśā"): from the sign of the **Ātmakāraka**; within the angles, the 2nd/5th/8th/11th and the rest, the signs in order of strength; the years as in the Chara | the Mūla daśā of the app begins at the Lagna (or the stronger of the Lagna and the 7th) and takes the signs by position, not by strength: a convention of PyJHora, not of the text |
| Nārāyaṇa | not in the edition read | the tables are PyJHora's |
| The other daśās of the Jaimini Sūtras | Trikoṇa, Yogārdha, Dṛg, Nakṣatra, Śūla, the Kārakas' Kendrādi | not in the app |
