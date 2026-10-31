# Daśās in the classics that the app does not have

Found by reading the lists and the rules of BPHS 46 (Sanskrit with IAST), the Jaimini Sūtras (adhyāya 2, with the commentary of Sītārāma Jhā)
and the Bṛhat Jātaka (the commentary of Bhaṭṭotpala, chapter 8 "Daśāntardaśā"); the rest of the corpus (`vedic-classics.md`) names the same
systems and adds no other. The app has: Viṃśottarī (with the Utpanna, Kṣema and Ādhāna variants and U. K. Jha's), Aṣṭottarī, Yoginī,
Naisargika, Kālachakra, Chara, Sthira, Nārāyaṇa and Mūla.

The rules are as the text gives them; the numbers of the verses are those of BPHS chapter 46 unless the line says otherwise. Whether a count
from a nakṣatra includes the nakṣatra itself is not said in the verses and is to be settled with the commentaries before the code is written.

## A. The nakṣatra daśās of BPHS 46.24–43 (fixed years, a condition of the birth chart for each) — in the app since v3.68

All are worked out like the Viṃśottarī: the nakṣatra of the Moon gives the first lord by a count and a division, the balance is the part of the
nakṣatra still to pass, the sub-periods are the years of the lord times the daśā years over the total (51.1). The app has the machinery
(`nakshatraDasha.ts`); each needs its own list of lords, years and rule.

| Daśā | When (the text) | The count | The lords, in order | Years | Total |
|---|---|---|---|---|---|
| Ṣoḍaśottarī (46.24–26) | the Lagna in the Moon's hora in the dark half, or in the Sun's hora in the bright half | from Puṣya, divided by 8 | Sun, Mars, Jupiter, Saturn, Ketu, Moon, Mercury, Venus | 11, 12, 13, 14, 15, 16, 17, 18 | 116 |
| Dvādaśottarī (46.27–28) | born in a Navāṁśa of Venus | from the nakṣatra to Revatī, divided by 8 | Sun, Jupiter, Ketu, Mercury, Rāhu, Mars, Saturn, Moon | by 2 and 7: 7, 9, 11, 13, 15, 17, 19, 21 | 112 |
| Pañcottarī (46.29–31) | the Lagna Cancer, in the Navāṁśa of the Sun | from the "friendly" nakṣatra, divided by 7 | Sun, Mercury, Saturn, Mars, Venus, Moon, Jupiter | 12, 13, 14, 15, 16, 17, 18 | 105 |
| Śatābdikā (46.32–34) | the Lagna Vargottama | from Revatī, divided by 7 | Sun, Moon, Venus, Mercury, Jupiter, Mars, Saturn | 5, 5, 10, 10, 20, 20, 30 | 100 |
| Caturaśītisamā (46.35–36) | the lord of the 10th in the 10th | from Svātī, divided by 7 | Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn | 12 each | 84 |
| Dvisaptatisamā (46.37–39) | the lord of the Lagna in the 7th, or the lord of the 7th in the Lagna | from Mūla, divided by 8 | the eight grahas but Ketu, from the Sun | 9 each | 72 |
| Ṣaṣṭihāyanī (46.40–42) | the Sun in the Lagna | from Aśvinī, 3, 4, 3… | Jupiter, Sun, Mars, Moon, Mercury, Venus, Saturn, Rāhu | 10, 10, 10, 6, 6, 6, 6, 6 | 60 |
| Ṣaṭtriṃśatsamā (46.42–43) | the Lagna in the Sun's hora by day, or the Moon's by night | from Śravaṇa, divided by 8 | Moon, Sun, Jupiter, Mars, Mercury, Saturn, Venus, Rāhu | 1 to 8 | 36 |

**How the app reads them (v3.68, `nakshatraSystems.ts`, `birthConditions.ts`).** The count includes both ends, as the Viṃśottarī of 46.13 does
(Kṛttikā itself is 1 and gives the Sun); a remainder of 0 is the last lord. The balance is the part of the nakṣatra still to pass times the
years of the first lord; the sub-periods are the years of the daśā times the years of the lord over the total (51.1). Each daśā is **off to
begin with** (most charts meet none of the conditions or one or two) and the panel of each says when it applies, whether the chart meets it and
what it found; a chart that does not is not given the daśā unless asked. The event list, the finder and the overlap read only those whose
condition the chart meets.

What the text does not say, and what the app took (each is shown beside the condition in the panel):

* "Born in a navāṁśa of Venus" (Dvādaśottarī 46.27): of what is not said; the **Lagna's** navāṁśa is taken (Taurus or Libra).
* "In the Sun's aṃśa" (Pañcottarī 46.29): taken as the navāṁśa of Leo with the Lagna Cancer (the 2nd navāṁśa of Cancer, 3°20′–6°40′).
  "Mitrarkṣa" is read as Anurādhā, the nakṣatra of Mitra.
* The horā (BPHS 6.6: half a sign, 24 from Aries in two rounds): the Sun's first in odd signs, the Moon's first in even ones, as the practice
  has it; the verse does not say which comes first.
* Ṣaṣṭihāyanī counts "3, 4, 3, 4…" from Aśvinī: the 28 divisions of the Aṣṭottarī (with Abhijit) are used, as eight such groups come to 28.
* Śatābdikā's last figure (46.34 "kharāma") is 30, as the total of 100 needs; the English of the site says 33.
* "Day" is the Sun above the horizon (the 7th house to the 12th by degrees from the Lagna).

The Aṣṭottarī has two conditions in the text (46.17 and 46.23); the app has both since v3.68 (either is enough). Note on the sums: the totals above are the ones
that follow from the years; 46.15 prints Mercury 19 in the Viṃśottarī (122 in all) where the 120 of 46.14 needs 17, so a printed figure of
these lines must be checked against its total.

## B. The Jaimini daśās of rāśi (the Sūtras, adhyāya 2)

Years: the Chara count of the sign (`narayanaYears`) unless said. The order and the start are the Sūtra's, with the Hindi commentary.

| Daśā | The rule | Sūtras |
|---|---|---|
| Yogārdha | the years of a sign are half the sum of its Chara and Sthira years (the commentary: Libra 2 + 7 gives 4½); from the stronger of the Lagna and the 7th, the twelve signs in order | 2.4.19–20 |
| Dṛg | from the 9th, then the signs it aspects, in the order movable–fixed–dual (the commentary: the signs seen, near ones first), then the 10th with its aspected signs, and so to the 11th; the years as in the Sthira daśā (7, 8, 9) | 2.4.21–23, BPHS 46.185–187 |
| Trikoṇa | the three trines in a row, from the stronger of the starting houses the sūtras name (the father's, the mother's and the wealth house); the years as in the Sthira. Read only in part | 2.4.24–25, BPHS 46.183–184 |
| Śūla | for the time of death: from the stronger of the 8th from the Lagna and the 8th from the 7th, and for the death of others from their houses (the 9th for the father, the 4th for the mother, the 3rd for a younger brother, the 11th for an elder one, the 5th for a sister or a son); the years are fixed | 2.3.18–25, BPHS 46.181–182 |
| Kendrādi of the signs and of the grahas | the lords of the sub-periods are the signs (grahas) in the angles, then the 2nd, 5th, 8th, 11th, then the rest, each group by strength; the Mūla of the app is a form of it | 2.4.11–14 |
| Nakṣatra | the order Sun, Moon, Mars, Mercury, Saturn, Jupiter, Rāhu, Venus (the order of the Aṣṭottarī); the count of the nakṣatras not read | 2.4, after the Kendrādi |

BPHS adds: Maṇḍūkī (Trikūṭa, 46.179–180: the stronger of the Lagna and the 7th, direct for odd signs and reverse for even, the years of the
Sthira), Caraparyāya (the Chara), the Karaka daśā (46.178: from the Ātmakāraka, the count of signs as years), the Rāśi daśā (46.188–190:
the sign counted twelve years from the part of it passed), the Pañcasvara (46.191–194: the vowel of the first letter of the name, five
lords of 12 years each), the Cakra daśā (46.50–51: from the Lagna by night, the Lagna lord by day, the 2nd at twilight; 10 years each),
the Tārā daśā (46.207–209: the Viṃśottarī read by the tārās from a strong planet in an angle).

## C. Daśās of the length of life

| Daśā | The rule | Where |
|---|---|---|
| Āyurdāya daśā of Varāhamihira | the first daśā is that of the strongest of the Lagna, the Sun and the Moon; then the planets in the angles (the first age), in the 2nd, 5th, 8th, 11th (the middle), in the rest (the last); the length of each is the years of life that planet gives (the Āyurdāya) | Bṛhat Jātaka 8, with Bhaṭṭotpala |
| Paiṇḍī, Aṃśī, Naisargika (as daśās of the lengths) | the daśā of each planet is the length of the Piṇḍāyu, the Aṃśāyu or the Naisargikāyu it gives (46.201) | BPHS 46.201 |
| Aṣṭavarga daśā | the first is that of the strongest of the Lagna, Sun and Moon, then the grahas in the angles by strength; the results by the Aṣṭakavarga (46.202–203) | BPHS 46.202–203 |
| Sandhyā and Pācaka | the twelfth of the full life (parāyu) is the sandhyā; the sandhyā daśā of the Lagna and the signs are measured by it, in the cells in order, 6 × 3 over 1 × 3, half in the next three, a third in the eight (46.204–206) | BPHS 46.204–206 |

Not in the app: the Āyurdāya (Piṇḍāyu, Aṃśāyu, Naisargikāyu with the reductions for the planets in an enemy's sign, combust and the like), on
which the daśās of this table stand; it is a chapter by itself (BPHS 43–44, Bṛhat Jātaka 7).

## D. What to take first

1. ~~The eight nakṣatra daśās of A (and the second condition of the Aṣṭottarī)~~ — done in v3.68.
2. **Jaimini's Dṛg, Yogārdha and Trikoṇa** (B): the same family as the Chara and the Sthira, which the app has now by the text.
3. **The Āyurdāya** and the daśās of C, which depend on it.
4. **The Kendrādi daśās as the Sūtras give them**, which would also make the Mūla of the app a choice between the text and PyJHora.

Not found in the corpus read: the Mudda and the Patyāyinī daśās of the Tājika (the Tājika Nīlakaṇṭhī edition found has no text for them in
its OCR); the app has the Mudda daśā from PVR's examples.
