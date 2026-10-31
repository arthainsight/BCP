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
| Sthira, the Brahma graha | 46.171–173: the strong lord of the 6th, 8th or 12th in an odd sign; among several, the one in the highest degree, then the stronger | **done (v3.69)**, see "Brahma graha, Mūla and the other Jaimini daśās" below |
| The year | the text does not say what a year of a daśā is | a Julian year (365.25 days), with no choice |
| Nārāyaṇa, Mūla | not in BPHS | the tables follow PVR / JHora; not compared with the Jaimini Sūtras |
| Kālachakra, the sub-periods | not read | proportional to the years of the signs, from the parent's sign in the cycle; not compared |
| Other daśās of 46.3–11 | Ṣoḍaśottarī, Dvādaśottarī, Pañcottarī, Śatābdikā, Caturaśītisamā, Dvisaptati, Ṣaṣṭi, Ṣaṭtriṁśat: **done (v3.68)**, see `dasha-candidates.md` section A. Kāla, Cakra, Pañcasvara, Paiṇḍī, Aṁśī, Aṣṭavarga, Sandhyā, Pācaka, Tārā | the first eight are in the app, off to begin with; the rest are not |
| Brahma graha | Jaimini 2.1.49–54 | **done (v3.69)**; the scoring of PyJHora is the other choice (Settings → dasha methods → Brahma graha) |
| Kendrādi (Mūla) | 2.4.11–14 | **done (v3.69)** as the default of the Mūla; the Mūla of PyJHora (from the Lagna, by position, two rounds) is the other choice |
| Nārāyaṇa | not in the edition read | the tables are PyJHora's |
| The other daśās of the Jaimini Sūtras | Trikoṇa, Yogārdha, Dṛg, Śūla: **done (v3.69)**. Nakṣatra, the Kārakas' Kendrādi (of grahas), Maṇḍūkī: not | the four are in the app, off to begin with |

## Brahma graha, Mūla and the other Jaimini daśās (v3.69)

All from the Jaimini Sūtras (Chowkhamba edition with the Hindi of Sītārāma Jhā) beside BPHS 46. Each is the default of the app; the other way (PyJHora, or the app's old scoring) is a choice in Settings.

**Brahma graha (2.1.49–54, BPHS 46.170–173).** Of the lords of the 6th, 8th and 12th from the stronger of the Lagna and the 7th, the one in an odd sign and "behind"
that stronger sign. The commentary defines "behind" (pṛṣṭha): for the Lagna the arc from the 7th point round to the Lagna point (the Lagna degree is needed, and
the page now gives it), for the 7th the arc from the Lagna point to the 7th point. Also the lord of the 8th from the Ātmakāraka and a graha in it (2.1.53, 46.172).
If the graha is Saturn, Rāhu or Ketu, the graha in the 6th from it or the lord of that sign (2.1.50). Of several, the one with the most degrees, Rāhu's counted
from the end of the sign (2.1.51–52, 46.173); equal: the stronger (2.1.54). *Not defined by the text and taken so:* "the strong" among the lords of the 6th/8th/12th
(every lord in an odd sign and behind is a candidate and the degrees choose); the marks of 2.1.49 and 2.1.53 as alternatives (all that meet either are
candidates); the replacement of 2.1.50 when the 6th sign holds no graha is its lord (which may be the same graha). When no graha meets a mark, which cannot
happen with an Ātmakāraka, the old scoring is used.

**Kendrādi rāśi daśā, the Mūla (2.4.11–14, the commentary).** From the stronger of the Ātmakāraka's sign and its 7th (the commentary: "the stronger of the
Ātmakāraka and its 7th"; its example starts from the Ātmakāraka's sign, an odd one); then the angles, the 2nd/5th/8th/11th, and the 3rd/6th/9th/12th, each group
by the strength of the sign, equal strength to the sign with more years ("rāśibalasamānatve bahuvarṣo balī bhavet"). The houses are counted in order from an odd
sign and from the 7th in reverse for an even one. The years as in the Chara, one round of twelve signs; the sub-periods the same order from the sign itself.
*Open:* whether the start is always the Ātmakāraka's sign when it is odd and the stronger of it and its 7th otherwise (the commentary's Sanskrit says "the stronger
of the two", its example gives the Ātmakāraka's sign): the app takes the stronger of the two.

**Yogārdha (2.4.19–20, 46.174).** From the stronger of the Lagna and the 7th; the years half the sum of the Chara and Sthira years (the commentary: Libra 2 and 7 give
4½); the sub-periods as in the Chara. The direction is not given: the signs run in order, as the commentary's example does.

**Dṛg (2.4.21–23, 46.185–187).** The 9th from the Lagna, the signs it glances at, then the 10th with its, then the 11th with its; the years as in the Sthira; the
sub-periods as in the Sthira. The glanced signs are the nearer ones first: for a movable sign backwards the 3rd, 6th and 9th, for a fixed one forwards, for a dual
one the 4th, 7th and 10th (forwards from Gemini and Sagittarius, backwards from Virgo and Pisces). The commentary's example (Libra rising) is in the tests. When the 9th is
a fixed sign (Virgo, Sagittarius, Pisces or Gemini rising) the 11th sign is one that the 9th glances at, and a sign already placed is not placed twice, so that only
ten signs are named; the text gives no continuation and none is made up.

**Trikoṇa (2.4.24–25, 46.183–184).** From the strongest of the Lagna, the 5th and the 9th, each sign with its 5th and 9th, four such groups in the order of the
start (direct from an odd sign, reverse from an even one); the years as in the Chara. The sub-periods by the verse quoted with the sūtra: an odd sign from itself in
order, an even one from its 7th in reverse.

**Śūla (2.3.18–25, 46.181–182).** For the time of death: from the stronger of the 8th from the Lagna and the 8th from the 7th, direct from an odd sign and reverse from
an even one; the years as in the Sthira. For others the 9th (father), 4th (mother), 3rd (younger brother), 5th (sister, child) and 11th (elder brother), a choice in
Settings. Not done: the māraka signs and the antardaśā of death (2.3.26 on).
