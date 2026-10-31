# Specific Muhurta Guidelines in the Muhūrta Finder (v3.56)

Source: Ernst Wilhelm, *Classical Muhurta*, chapter 22 "Specific Muhurta Guidelines". The code is `src/lib/muhurtaFinderPresets.ts`; the tests (`muhurtaFinder.test.ts`) check each list against the printed text.

## How a guideline becomes a ready-made choice

| The book gives | The finder |
| --- | --- |
| Nakṣatra: favourable / "best" | ticked in the Nakṣatra group |
| Nakṣatra, Tithi, Lagna: "middling" | **not** ticked; listed under the choice ("Middling in the book, not chosen") |
| Tithi, Karaṇa, Vāra, Lagna: "avoid" | left out of the group |
| Lagna "best" / "favourable" | the signs of the Ascendant |
| Bhāvas ("no malefic in the 8th", "Venus or Moon in the Lagna") | placement rules (`any` / `none`) |
| "Avoid afflictions of Jupiter and Venus, particularly combustion" | the Mahādoṣa "Guru and Śukra" (combustion of Jupiter or Venus, Jupiter in Leo or Capricorn; Muhūrtacintāmaṇi 1.46–51). The Udayāsta Śuddhi is a different thing: the purity of the Lagna and the 7th |
| The Mahādoṣas the book names for the purpose | the Mahādoṣa group (see the wedding below) |
| Navāṁśa of Moon, Mercury, Jupiter, Venus | the D1 wish "Navāṁśa Lagna of a benefic" (one point) |
| Tara, Chandrabala | the start wishes (they apply when a natal chart is given) |

The Kālaprakāśikā / Muhūrta Cintāmaṇi rule of the chapter's introduction (the nakṣatras on which the two agree are the most favourable, those only one gives are middling) is followed where the book prints it (entering a house).

## Events in this batch

| Id | Book heading | Notes |
| --- | --- | --- |
| `business-opening` | Business/Finance – Store/Business Opening | the first ready-made choice |
| `marriage-wedding` | Marriage – Wedding | tithis 2, 3, 5, 7, 10, 11, 13, the dark half only to the 8th (Riktā out); not Viṣṭi; not Sun, Mars, Saturn vāras; Lagna Gemini, Virgo, Libra (others middling, Aries, Capricorn, Scorpio, Pisces to avoid). Rules: not Moon or a malefic in the Lagna, Saturn not in 12, Mars not in 8 or 10, Venus not in 6, Moon not in 6 or 8, no benefic in 8. |
| `construction-start` | Construction – Beginning Construction (Laying Foundations) | tithis 2, 6, 10 and the odd ones but the 9th (Amāvasyā left out, as in the finder's Riktā list); vāras Moon, Mercury, Jupiter, Venus, Saturn; fixed Lagnas; a benefic in 1, 2 or 9; no graha in 8; no malefic in 12 |
| `house-entering` | House/Buildings – Entering a New House (Gṛhapraveśa) | tithis 2, 3, 5, 7, 10 of both halves, 11 and 13 of the bright half, the dark 1st; vāras Moon, Mercury, Jupiter, Venus (Saturn mediocre, not ticked); fixed Lagnas; no graha in the 8th |
| `real-estate-purchase` | Real Estate – Purchasing | not 4, 9, 14; not Viṣṭi; vāras Moon, Mars, Mercury, Saturn; fixed Lagnas; no graha in the 8th |
| `journey-start` | Travel – Commencing a Journey | the direction-free factors only (see below) |

### The wedding and the Mahādoṣas

The book says to avoid as many of the 21 as possible, "particularly Udayāṣṭa Śuddhi, Sūrya Saṅkrānti, Ekārgala, Bhṛguṣaṭka, Kujāṣṭama, Gaṇḍānta, Kartarī, Indu Saṅgraha, Aṣṭama Lagna, Vyatīpāta and Vaidhṛti" – these eleven are set. Jāmitra ("avoid at all costs"), Lattā, Upagraha, Pāta (the last three only bite when the Moon is in the same pāda) and the blind, deaf and lame Lagna are named too, but trying them from November 2026 in Helsinki:

| Set | Stretches in a year |
| --- | --- |
| the preset without any dosha | 38 |
| the eleven | 10 |
| the eleven + Jāmitra | 0 |
| the eleven + blind/deaf/lame | 4 |
| the eleven + Lattā, Upagraha, Pāta | 4 |
| all sixteen | 0 |

A boolean search that finds nothing helps nobody, so the other five are left for the user to tick one at a time. A better answer needs a "fewest blemishes" ranking, which is not built.

## Not used, per event

`NOT_APPLIED` in the code is the vocabulary; each choice lists its own on the page.

- **All**: the Masa (lunar month) with the Sun's sign, the Ayana, the natal chart's 8th / Janma Rāśi, Gochara of the Sun, Jupiter and Venus from the natal Moon, Navāṁśa and Drikkāṇa signs beyond the one wish, the lords of the Lagna and the Navāṁśa Lagna, the Combinations (named yogas of the grahas).
- **Wedding**: the pādas (the first pāda of Maghā and Mūla, the last of Revatī), the Dagdha tithi, the Vāra–nakṣatra yogas, the Moon alone or joined to a graha, the nakṣatra of a malefic that has just passed or is next.
- **Construction**: the door's direction (tithi ranges to avoid, less favourable nakṣatras), the kind of building (kitchen, city, granary, ... have their own best nakṣatras), the Ūrdhva / Adho / Tiryag Mukha Rāśis, the Raja Yoga of the grahas in nakṣatras on their vāra, the wife's pregnancy.
- **Entering a house**: the Ayana, the Masa, the door's direction (nakṣatras and tithis facing it), the Sun on the left, Venus in the opposite direction, the Lagna from the natal Janma Rāśi, the 4th empty ("a good principle").
- **Real estate**: the lord of the vāra in the Lagna, the Sun and Ketu in the Lagna.
- **Journey**: the direction of the journey (Ayana, nakṣatras and tithis, Śūla, Venus in front), the part of the day under each nakṣatra, the Ghāta nakṣatra and pādas of the natal Moon, the nāḍī exceptions of the avoided nakṣatras, the 1st pāda, retrograde vāras, Shukla Paksha preferred, the Lagna by day or night, the Lagna lord / Moon lord, boat and other special journeys, the Yavanajātaka purposes.

## The rest of the chapter (not yet added)

Agriculture (about 25 events), bed, boat, business (storing, selling, lending, ...), chairs, children (birth, naming, first feeding, ...), clothes, construction (doors, wells, roofs, ...), craft, criminals, currency, dairy, dance, dishes, ear piercing, education (a dozen), employees, friendship, funerals, grooming, house (old house), jewelry, killing, leather, litigation, livestock, the rest of marriage (bride coming home, engagement, invitation, Nisheka), medical (a dozen), menses, musical instruments, oil bath, painting, politics, pottery, pregnancy ceremonies, the religious rites, Samāvartana, stones and bricks, the rest of travel, vehicles, war, weapons, wells, wine, writing.
