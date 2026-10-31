# The daśās of the app beside the Sanskrit text

The classics decide. This page sets the daśā systems of the app beside the **Bṛhat Parāśara Horā Śāstra** (BPHS), chapters 46 to 51, in the
Sanskrit with IAST (the text of enjoylearningsanskrit.com, read with its transliteration; the English of that site is a help, not the
authority). The Jaimini systems (Nārāyaṇa, Mūla and the full rule of the Chara) are in the Jaimini Sūtras, which are not read here.

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
| Chara, the length | 46.155–165: the count of signs to the lord; a sign with two lords (Scorpio, Aquarius) 12 years if both are in their own signs, else the stronger; +1 for an exalted lord, −1 for a debilitated one | options of `charaClean.ts`: the count (inclusive or not), the lord of Scorpio and Aquarius, the exaltation adjustment |
| Chara, the direction | 46.156: odd signs direct, even reverse | the option "odd-even" (the other option is the Jaimini rule by movable and fixed signs) |
| Chara, the sub-periods | 51.5: the daśā divided by twelve | the same |
| Sthira | 46.168–169: 7 years for the movable signs, 8 for the fixed, 9 for the dual, from the sign of the Brahma graha | the same, the Brahma graha as in `jaiminiStrength.ts` |

## Corrected by this comparison

**Kālachakra: Revatī was in the wrong group.** 46.58 names the first savya group: "aśvinī, aditi, hasta, … mūla, proṣṭhapadā, vahni, vāta, viśva(rkṣa), revatī … savyatārakāḥ" — ten stars, "aśvinyādidaśatārāṇām" (46.62); the second savya group is five (Bharaṇī, Puṣya, Citrā, Pūrva Āṣāḍhā, Uttara Bhādrapadā, 46.65). The app had the first group at nine and the second at six, with Revatī in the second. By number the stars of the first group are 1, 3, 7, 9, 13, 15, 19, 21, 25 and 27 (pairs six apart), the second 2, 8, 14, 20, 26; Revatī (27) belongs with Aśvinī. The Kālachakra of a Moon in Revatī is now that of the first savya group (pada 1: Aries to Sagittarius), not the Pisces–Scorpio sequence of the second. The four groups are now typed in the test, nakṣatra by nakṣatra.

## Readings of the text put right by the sense, not by the letter

* 46.15 prints Mercury 19 as well as Saturn 19 (total 122); 46.14 says 120, and the usual 17 for Mercury makes 120. The app has 17.
* 46.68 ends the sequence with "rāma" (3) where the Jīva sign, Virgo (6), is meant; 46.74 starts it with "aṅka" (9) where "aṅga" (6) is meant. The app has Virgo in both.
* 46.61 gives the second pada of the first savya group only as "from Makara to Mithuna"; the sequence in the app (Capricorn, Aquarius, Pisces, Scorpio, Libra, Virgo, Cancer, Leo, Gemini) is the one that the jumps of 46.96–100 (Maṇḍūka, Markaṭī, Siṃhāvalokana) make of it.

## What the app does not do, or does by another rule

| Subject | The text | The app |
|---|---|---|
| Aṣṭottarī, the other condition | 46.23: Aṣṭottarī is to be taken for a birth by day in the dark half or by night in the bright half | only the Rāhu condition of 46.17 is shown |
| Chara, a sign with two lords | 46.158–164: if one is in its own sign take the other; if both are elsewhere the one with more planets, then the stronger sign (movable, fixed, dual), then the one with more years | the lord is chosen by an option, not by this rule |
| Sthira, the Brahma graha | 46.171–173: the strong lord of the 6th, 8th or 12th in an odd sign; among several, the one in the highest degree, then the stronger | the lords are scored (a friendly sign, an odd sign, in the first seven signs), then the stronger of the best two; the degree is not used |
| The year | the text does not say what a year of a daśā is | a Julian year (365.25 days), with no choice |
| Nārāyaṇa, Mūla | not in BPHS | the tables follow PVR / JHora; not compared with the Jaimini Sūtras |
| Kālachakra, the sub-periods | not read | proportional to the years of the signs, from the parent's sign in the cycle; not compared |
| Other daśās of 46.3–11 | Ṣoḍaśottarī, Dvādaśottarī, Pañcottarī, Śatābdikā, Caturaśītisamā, Dvisaptati, Ṣaṣṭi, Ṣaṭtriṁśat, Kāla, Cakra, Pañcasvara, Paiṇḍī, Aṁśī, Aṣṭavarga, Sandhyā, Pācaka, Tārā | not in the app |
