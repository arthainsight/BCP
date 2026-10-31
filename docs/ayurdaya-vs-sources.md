# The daśās of the length of life: what the text gives and what it leaves open

Read in the Sanskrit with IAST of BPHS (the text of enjoylearningsanskrit.com): chapter 43 "Āyurdāya", and 46.201–210. The Bṛhat Jātaka (chapter 7)
has its own Āyurdāya; the OCR of the edition found (`jyotisha`) is too broken in these chapters to quote from (the chapter name itself is spelt "आयुदाय्ाध्यायः"
and "आयुर्दाचाध्वायः" in different places), so it is not used.

**State since v3.70:** the Naisargika daśā of the app is the natural years of 43.16–17 and matches. The **Paiṇḍī and Aṃśī daśās are in the app** (off to begin
with, beta), with the points below settled by the defaults the user chose on 31 October 2026 ("go with the defaults"): no Lagna row, the Sanskrit reading of
43.9 (a retrograde graha is excepted from the loss of a third), and the strength of the Lagna, Sun and Moon by the Jaimini rules for signs. The other readings
are the ones of the section "How the code reads it" below; each can be changed by one line of `src/lib/ayurdaya.ts`.

## What the text says

| Verse | Rule |
|---|---|
| 43.6–7 | Piṇḍāyu, the full years of a planet in its exaltation sign: Sun 19, Moon 25, Mars 15, Mercury 12, Jupiter 15, Venus 21, Saturn 20; half of it in debilitation, and in between "by proportion" |
| 43.8 | "svoccaśuddhau grahaḥ śodhyaḥ ṣaḍbhādūno bhamaṇḍalāt, svapiṇḍaguṇito bhakto bhādimānena vatsarāḥ": the planet's arc from its (point), reduced below six signs, times its Piṇḍāyu, divided by "the measure of the signs" |
| 43.9 | A combust planet loses half (not Venus or Saturn); a planet in an enemy's sign loses a third "vakracāraṃ vinā", i.e. a retrograde one is excepted (the English of the site reads it the other way) |
| 43.10 | By the house: a planet in the 12th loses the whole share, in the 11th a half, 10th a third, 9th a fourth, 8th a fifth, 7th a sixth ("vyayād vāmaṃ"); a benefic loses half of that |
| 43.11 | Of several planets in one sign the strong one takes its share; the waning Moon is not counted as a malefic here |
| 43.12–15 | The Lagna's own span (two readings: the sign number in years with the degrees in months, or the degrees as years) and a reduction for the Sun, Mars and Saturn in the Lagna |
| 43.16–17 | Naisargika: Moon 1, Mars 2, Mercury 9, Venus 20, Jupiter 18, Sun 20, Saturn 50 (in the app) |
| 43.18–23 | Aṃśāyu: the planet's navāṁśa number counted from Aries (108 in all) taken modulo 12 gives the years; three times in its exaltation or own sign, twice in its own navāṁśa, own drekkāṇa or a Vargottama position; the reductions as in the Piṇḍāyu, "hānidvaye'rdhahāniḥ" (two reductions: half the reduction) |
| 43.31–32 | Which of the three spans to take: the Aṃśāyu if the lord of the Lagna is strong and well aspected, the Naisargika for the Moon…; equal: the mean; all three: a third of the sum |
| 46.201 | The Paiṇḍī, Aṃśī and Naisargikā daśās: the daśā of each planet is the length of the Piṇḍāyu, Aṃśāyu or Naisargikāyu it gives |
| 46.202–203 | The first daśā is that of the strongest of the Lagna, the Sun and the Moon, then the planets in the angles from it and so on, by strength; the results by the Aṣṭakavarga (the "Aṣṭavarga daśā" has no years of its own) |
| 46.204–206 | Sandhyā and Pācaka: the twelfth of the full life; the sum with "rasa, guṇa" over "candra, vahni" is read differently by each commentator and the cells are not described in the verses |
| 46.207–209 | Tārā: the Viṃśottarī read by tārās from a strong planet in an angle |

## How the code reads it (`ayurdaya.ts`, v3.70)

* **Piṇḍāyu (43.6–10).** Full years 19, 25, 15, 12, 15, 21, 20; the arc from the deepest debilitation point (reduced below 180°) gives
  years = full × (½ + arc / 360°): the half at the debilitation point and the whole at the exaltation point (43.7), in proportion between. Reductions: combust, half
  (not Venus or Saturn); in an enemy's sign (the natural enemies of the sign's lord), a third, a retrograde graha excepted; by the house from the Lagna 12th: all, 11th: ½,
  10th: ⅓, 9th: ¼, 8th: ⅕, 7th: ⅙, a benefic losing half of that (the Sun, Mars and Saturn are the malefics; the Moon counts as a benefic whatever its phase, 43.11).
  Reductions are taken one after another; when two or more apply, the loss is halved (43.22).
* **Aṃśāyu (43.18–22).** The navāṁśa number of the longitude counted from Aries (of 108), modulo 12, is the years; three times in the exaltation or own sign, twice in the own
  navāṁśa or drekkāṇa or Vargottama, three times when both (not six); the reductions as above (43.20). The scaling of 43.23 is for other beings than men.
* **Order (46.202).** The strongest of the Lagna sign, the Sun's sign and the Moon's sign (Jaimini strength of signs); the Sun or the Moon in it comes first, the Lagna has
  no row; then the grahas in the angles from that sign, the 2nd/5th/8th/11th, the 3rd/6th/9th/12th, each group by the strength of the grahas. One round: the daśās end with the
  last. A graha with no years has no daśā.
* **Sub-periods.** The years of the daśā times the years of the lord over the total of the round (51.1), from the lord of the daśā in the order of the round.
* **Not applied:** 43.11 (of several grahas in a sign only the strong one takes its share), 43.12–13 (the Lagna's degrees and the Sun, Mars and Saturn in the Lagna), the
  Lagna's own span (43.14–15), the choice between the three spans (43.31–32), Sandhyā, Pācaka and Tārā (46.204–209), and the Bṛhat Jātaka's Āyurdāya.

## What was open (decided by the defaults above where marked)

1. **43.8, the arc and the divisor** (read as the straight line, above). "bhādimānena" is not clear; the usual reading is a straight line between the half at the debilitation point and the whole at the
   exaltation point (years = full × (½ + arc from the debilitation point / 360°)). The verse could also be read to give no half at all at the debilitation point, which
   43.7 contradicts.
2. **43.9, retrograde** (decided: the Sanskrit). The Sanskrit excepts a retrograde planet from the loss of a third; the Bṛhat Jātaka says a retrograde planet gives three times (the commentary quoted
   in the OCR, "vakrago graha āyurdāyaṃ sabalasvāt triguṇaṃ dadāti"). Which of the two the app should take.
3. **43.10–11, 43.12–13.** The loss by house, one planet in a sign, the Lagna's reduction: a reduction "of the Piṇḍāyu" which is taken from the planet's years or from a total, and
   in what order the reductions are applied (one after another, or the largest only).
4. **The Lagna's own span** (decided: no Lagna row) (43.14 and 43.15 differ by an order of magnitude) and so the first daśā when the Lagna is the strongest of the three in 46.202.
5. **The strength of the Lagna, the Sun and the Moon** (46.202; decided: the Jaimini strength of signs): the strength of a sign by the Jaimini rules, the Ṣaḍbala, or the Aṣṭakavarga (46.203 mentions it for the results).
6. **The sub-periods**: BPHS 47–51 give the Antardaśā of the daśās of 46; whether they are proportional to the years as in 51.1 for these three is not read yet.

What is read above is a reading, not the letter of the text: the figures of the Paiṇḍī and Aṃśī daśās should be taken as such.
