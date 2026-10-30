# Ṣaḍbala and Bhāva Bala: how every number is calculated

This is the manual of the two views ANALYSIS → Bala → Ṣaḍbala and Bhāva Bala. It says, step by step, how each number is made, so that anyone can repeat it by hand or in a spreadsheet and get the same figure. Every step is worked on one chart, the **reference chart**, whose numbers are also the expected values of the tests (`src/lib/shadbala.fixture.ts`). Where the sources do not agree, or the verses are silent, the manual says so and marks it as a **choice point** (C1, C2 …); the table at the end lists them with the alternatives.

A Finnish version of this manual is [shadbala-manuaali.md](shadbala-manuaali.md); if they differ, both are corrected.

Where each rule comes from, verse by verse, is in [shadbala-sources.md](shadbala-sources.md). The code is in `src/lib/shadbala.ts`, `shadbalaAspects.ts`, `shadbalaCheshta.ts`, `shadbalaTime.ts` and `bhavaBala.ts`.

## 0. Conventions

- Strengths are in **virūpa**. 60 virūpa make a **rūpa**. The total is the sum of the six balas in virūpa; the rūpa figure is that divided by 60.
- Longitudes are sidereal degrees, 0–360, in the ayanamsa of the chart (Aries 0°–30° is sign 0). Where a rule needs the tropical (sāyana) longitude, it is the longitude plus the ayanamsa.
- "Sign index" counts Aries 0, Taurus 1, Gemini 2, Cancer 3, Leo 4, Virgo 5, Libra 6, Scorpio 7, Sagittarius 8, Capricorn 9, Aquarius 10, Pisces 11.
- A distance between two longitudes is always the short way round, 0–180°.
- The planets are the seven grahas. Rahu and Ketu have no Ṣaḍbala, but they count as malefics for Mercury (§7).

## 1. The reference chart

13 October 1987, 00:15 EET (UTC+2), Kotka (60.46667° N, 26.94583° E), Lahiri ayanamsa 23.6864°. It is a night birth before sunrise, with Cancer rising.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Longitude | 175.3595 | 65.1636 | 158.9588 | 198.7067 | 1.7542 | 188.8783 | 233.1488 |
| Sign | Virgo | Gemini | Virgo | Libra | Aries | Libra | Scorpio |

Ascendant 114.5441° (Cancer), midheaven 359.7065°, so the nadir is 179.7065° and the descendant 294.5441°. Sunrise 06:45:51, sunset 17:10:08 (local clock), the previous sunrise 17.28 h before midnight (−17.2774 h). Julian day 2447081.4271. The Moon is 249.80° ahead of the Sun, so it is waning.

## 2. Sthāna Bala (positional strength)

The sum of five parts: Uccha, Saptavargaja, Ojhayugma, Kendradi and Drekkana.

### 2.1 Uccha Bala (BPHS 27.1–2)

The distance from the graha's debilitation point, divided by three. The debilitation point is the exaltation point plus 180°. The exaltation points are Sun 10° (Aries), Moon 33° (Taurus 3°), Mars 298° (Capricorn 28°), Mercury 165° (Virgo 15°), Jupiter 95° (Cancer 5°), Venus 357° (Pisces 27°), Saturn 200° (Libra 20°).

Uccha = 60 × (1 − d / 180), where d is the distance from the exaltation point.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| d | 165.36 | 32.16 | 139.04 | 33.71 | 93.25 | 168.12 | 33.15 |
| Uccha | 4.88 | 49.28 | 13.65 | 48.76 | 28.92 | 3.96 | 48.95 |

### 2.2 Saptavargaja Bala (27.2–4)

1. Find the sign of the graha in seven divisional charts: rāśi (D1), hora (D2), drekkāṇa (D3), saptāṃśa (D7), navāṃśa (D9), dvādaśāṃśa (D12) and triṃśāṃśa (D30). The charts are the ones of ANALYSIS → Varga (the hora is Parāśara's: in an odd sign the first 15° belong to the Sun's hora, Leo, and the rest to the Moon's, Cancer; in an even sign the other way round).
2. Score each sign:
   - **45** if it is the graha's own mūlatrikoṇa, **in the rāśi only** (C3); the bands are Sun Leo 0–20°, Moon Taurus 3–30°, Mars Aries 0–12°, Mercury Virgo 15–20°, Jupiter Sagittarius 0–10°, Venus Libra 0–15°, Saturn Aquarius 0–20° (3.51–54).
   - **30** if it is one of its own signs (also the mūlatrikoṇa sign in the other six vargas, and in the rāśi outside the band).
   - Otherwise by the **compound relation** to the lord of the sign (3.55–58): adhimitra **20**, mitra **15**, sama **10**, śatru **4**, adhiśatru **2**. There is no score of its own for exaltation or debilitation.
3. Add the seven scores. The most possible is 315. The sum is **not** divided by seven.

The compound relation is the natural relation together with the temporary one, both from the rāśi chart:

| Natural relation to the lord | Lord stands in the 2nd, 3rd, 4th, 10th, 11th or 12th sign from the graha (temporary friend) | Elsewhere (temporary enemy) |
|---|---|---|
| Friend | adhimitra | sama |
| Neutral | mitra | śatru |
| Enemy | sama | adhiśatru |

The natural friends are Sun: Moon, Mars, Jupiter · Moon: Sun, Mercury · Mars: Sun, Moon, Jupiter · Mercury: Sun, Venus · Jupiter: Sun, Moon, Mars · Venus: Mercury, Saturn · Saturn: Mercury, Venus. The natural enemies are Sun: Venus, Saturn · Moon: none · Mars: Mercury · Mercury: Moon · Jupiter: Mercury, Venus · Venus: Sun, Moon · Saturn: Sun, Moon, Mars. The others are neutral.

Worked, the Sun's D1: the Sun is in Virgo, whose lord is Mercury. Mercury is neutral to the Sun (the Sun's friends are the Moon, Mars and Jupiter and its enemies Venus and Saturn). In the rāśi Mercury stands in Libra, one sign after Virgo, the 2nd place from the Sun, a temporary friend. Neutral + temporary friend = mitra, 15. The full working for every graha follows.

| | D1 | D2 | D3 | D7 | D9 | D12 | D30 | Sum |
|---|---|---|---|---|---|---|---|---:|
| Sun | Virgo 15 (Mercury, mitra) | Leo 30 | Taurus 10 (Venus, sama) | Leo 30 | Leo 30 | Cancer 20 (Moon, adhimitra) | Scorpio 10 (Mars, sama) | **145** |
| Moon | Gemini 10 (Mercury, sama) | Leo 20 (Sun, adhimitra) | Gemini 10 | Cancer 30 | Scorpio 15 (Mars, mitra) | Leo 20 | Aquarius 4 (Saturn, śatru) | **109** |
| Mars | Virgo 10 (Mercury, sama) | Cancer 20 (Moon, adhimitra) | Virgo 10 | Taurus 15 (Venus, mitra) | Pisces 10 (Jupiter, sama) | Sagittarius 10 | Virgo 10 | **85** |
| Mercury | Libra 10 (Venus, sama) | Cancer 2 (Moon, adhiśatru) | Aquarius 15 (Saturn, mitra) | Aquarius 15 | Pisces 4 (Jupiter, śatru) | Taurus 10 (Venus, sama) | Gemini 30 | **86** |
| Jupiter | Aries 10 (Mars, sama) | Leo 10 (Sun, sama) | Aries 10 | Aries 10 | Aries 10 | Aries 10 | Aries 10 | **70** |
| Venus | Libra **45** (mūlatrikoṇa) | Leo 10 (Sun, sama) | Libra 30 | Sagittarius 4 (Jupiter, śatru) | Sagittarius 4 | Capricorn 20 (Saturn, adhimitra) | Aquarius 20 (Saturn, adhimitra) | **133** |
| Saturn | Scorpio 10 (Mars, sama) | Leo 10 (Sun, sama) | Cancer 2 (Moon, adhiśatru) | Libra 20 (Venus, adhimitra) | Capricorn 30 | Leo 10 (Sun, sama) | Capricorn 30 | **112** |

### 2.3 Ojhayugma Bala (27.5)

15 virūpa for the rāśi and 15 for the navāṃśa standing in a sign of the graha's kind: the **Moon and Venus in even signs** (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces), **all the others in odd signs** (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius). Mercury and Saturn are among the others; many books give them both kinds, but the verse says *anye*, "the others".

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Rāśi / navāṃśa | Virgo ✗ / Leo ✓ | Gemini ✗ / Scorpio ✓ | Virgo ✗ / Pisces ✗ | Libra ✓ / Pisces ✗ | Aries ✓ / Aries ✓ | Libra ✗ / Sagittarius ✗ | Scorpio ✗ / Capricorn ✗ |
| Ojhayugma | 15 | 15 | 0 | 15 | 30 | 0 | 0 |

### 2.4 Kendradi Bala (27.5)

By the house the graha is in (whole signs from the Lagna): a kendra (1, 4, 7, 10) **60**, a panapara (2, 5, 8, 11) **30**, an apoklima (3, 6, 9, 12) **15**.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| House | 3 | 12 | 3 | 4 | 10 | 4 | 5 |
| Kendradi | 15 | 15 | 15 | 60 | 60 | 60 | 30 |

### 2.5 Drekkana Bala (27.6, 3.19)

15 virūpa when the graha stands in the decanate that suits its kind: the males (Sun, Mars, Jupiter) in the first decanate (0–10° of the sign), the neuters (Mercury, Saturn) in the second (10–20°), the females (Moon, Venus) in the third (20–30°). Santhanam's edition of the text has the females second and the neuters third; the app follows the Sanskrit and Raman.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Degree in sign | 25.4 | 5.2 | 9.0 | 18.7 | 1.8 | 8.9 | 23.1 |
| Drekkana | 0 | 0 | 15 | 15 | 15 | 0 | 0 |

### 2.6 Sthāna Bala total

| | Uccha | Saptavargaja | Ojhayugma | Kendradi | Drekkana | **Sthāna** |
|---|---:|---:|---:|---:|---:|---:|
| Sun | 4.88 | 145 | 15 | 15 | 0 | **179.9** |
| Moon | 49.28 | 109 | 15 | 15 | 0 | **188.3** |
| Mars | 13.65 | 85 | 0 | 15 | 15 | **128.7** |
| Mercury | 48.76 | 86 | 15 | 60 | 15 | **224.8** |
| Jupiter | 28.92 | 70 | 30 | 60 | 15 | **203.9** |
| Venus | 3.96 | 133 | 0 | 60 | 0 | **197.0** |
| Saturn | 48.95 | 112 | 0 | 30 | 0 | **191.0** |

## 3. Dig Bala (directional strength, 27.7–8)

Each graha has a point on the horizon-meridian cross where it is powerless, and is full at the opposite point. The verse names the house the strength is subtracted from. The angles are the four angles of the chart (C4):

| Graha | Powerless at | Full at |
|---|---|---|
| Sun, Mars | the nadir (4th) | the midheaven (10th) |
| Moon, Venus | the midheaven (10th) | the nadir (4th) |
| Jupiter, Mercury | the descendant (7th) | the ascendant (1st) |
| Saturn | the ascendant (1st) | the descendant (7th) |

Dig = (distance from the powerless point, 0–180°) / 3. Reference chart: ascendant 114.544°, nadir 179.706°, descendant 294.544°, midheaven 359.706°.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Powerless point | nadir 179.71 | MC 359.71 | nadir 179.71 | desc 294.54 | desc 294.54 | MC 359.71 | asc 114.54 |
| Distance | 4.36 | 65.46 | 20.75 | 95.84 | 67.20 | 170.82 | 118.60 |
| **Dig** | **1.45** | **21.82** | **6.92** | **31.95** | **22.40** | **56.94** | **39.53** |

## 4. Kāla Bala (temporal strength)

The sum of Natonnata, Pakṣa, Tribhāga, Varṣa-Māsa-Dina-Horā and Ayana. (Yuddha Bala, planetary war, is not included; the sources disagree about it, and no graha of the reference chart is in war.)

### 4.1 Natonnata Bala (27.8–9)

Strength by the hour: the Sun, Jupiter and Venus are strongest at noon and empty at midnight; the Moon, Mars and Saturn the opposite; Mercury always has 60. The hours are measured from local noon, the midpoint of the real sunrise and sunset:

day strength = 60 × (1 − h / 12), h the distance of the birth from local noon in hours, 0–12; the night-strong grahas have 60 − that.

Reference chart: local noon = (6.7642 + 17.1689) / 2 = 11.9666 h; the birth, 0.25 h, is 11.7166 h away; day strength 1.42, night strength 58.58.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Natonnata | 1.42 | 58.58 | 58.58 | 60 | 1.42 | 1.42 | 58.58 |

### 4.2 Pakṣa Bala (27.10–11)

The distance of the Moon from the Sun (0–180°) divided by three is the strength of the **benefic group** (Moon, Mercury, Venus, Jupiter); the rest (Sun, Mars, Saturn) have 60 minus that. The Moon is always in the first group here, however the Moon is classed elsewhere. The Moon's Pakṣa Bala is **not doubled** (C7).

Reference chart: the Moon is 249.80° ahead, so 110.20° from the Sun the short way; 110.20 / 3 = 36.73. The Sun, Mars and Saturn have 60 − 36.73 = 23.27.

### 4.3 Tribhāga Bala (27.12)

The day (sunrise to sunset) and the night (sunset to the next sunrise) are each split into three equal parts. The lord of the part has 60: Mercury, the Sun and Saturn rule the three parts of the day, the Moon, Venus and Mars those of the night. Jupiter always has 60.

Reference chart: the birth is before sunrise, in the night that began at the sunset of the evening before and ends at the sunrise at 6.76 h; the night is 13.64 h long (sunset 17.17 h to the next sunrise 30.81 h), so it began at 6.76 − 13.64 = −6.87 h; a third is 4.55 h, and 00:15 is 7.12 h into it, the second third: **Venus** 60 and Jupiter 60.

### 4.4 Varṣa-Māsa-Dina-Horā Bala (27.13)

15 virūpa for the lord of the year (abda), 30 for the lord of the month (masa), 45 for the lord of the day (vara), 60 for the lord of the hour (hora). The verse gives the strengths; the lords are found by the method of the commentaries (Santhanam on 27.13, Raman articles 58–63), which gives both authors' own examples:

1. The **ahargaṇa** A = 714,404,108,573 + the days since 1 January 1860 (civil date of the Vedic day).
2. Lord of the **year** = the weekday numbered ((⌊A / 360⌋ × 3 + 1) mod 7), counting Sunday 1 … Saturday 7 (remainder 0 is Saturday).
3. Lord of the **month** = the weekday numbered ((⌊A / 30⌋ × 2 + 1) mod 7).
4. Lord of the **day** = the weekday numbered (A mod 7).
5. Lord of the **hour**: the Vedic day runs from sunrise to sunrise, so a birth before sunrise belongs to the day before. The hour is counted from that day's sunrise in clock hours; the first hour belongs to the lord of the day, and the next ones follow the order Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars.

Reference chart: the birth is before sunrise, so the Vedic day is Monday 12 October 1987 (A = 714,404,155,243); lord of the year Saturn, of the month Mercury, of the day the Moon. It is 0.25 − (−17.2774) = 17.53 h after the sunrise of that day, the 18th hour, counting from the Moon: Moon, Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon … the 18th is **Mars**.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lord of | – | day | hour | month | – | – | year |
| Strength | 0 | 45 | 60 | 30 | 0 | 0 | 15 |

### 4.5 Ayana Bala (27.15–17)

1. The tropical longitude of the graha λ = longitude + ayanamsa.
2. Its declination δ from the table of the verse. The distance x of λ from the nearer equinox is taken (0–90°), and the 24° of the obliquity is split among the three signs of the quarter in the parts 45 : 33 : 12 (ninety parts), the part inside the sign interpolated in proportion: δ = 24° × (parts up to x) / 90, north for λ from 0° to 180°, south for the rest.
3. For the Sun, Mars, Jupiter and Venus: Ayana = 60 × (24° + δ) / 48°; for the Moon and Saturn: 60 × (24° − δ) / 48°; for Mercury: 60 × (24° + |δ|) / 48°.
4. The **Sun is not doubled** (C6). The doubling in the books is how they count the Sun's Cheṣṭā Bala into the total (§5).

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| λ | 199.05 | 88.85 | 182.65 | 222.39 | 25.44 | 212.57 | 256.84 |
| δ | −7.62 | +23.88 | −1.06 | −15.64 | +10.18 | −12.75 | −22.60 |
| Ayana | 20.48 | 0.15 | 28.68 | 49.54 | 42.72 | 14.06 | 58.24 |

The table uses only the longitude, not the graha's ecliptic latitude, so the Moon, whose real declination is +28.7°, is given +23.9°. Without an ayanamsa in the chart the real declination stands in (clamped to 0–60).

### 4.6 Kāla Bala total

| | Natonnata | Pakṣa | Tribhāga | Abda… | Ayana | **Kāla** |
|---|---:|---:|---:|---:|---:|---:|
| Sun | 1.42 | 23.27 | 0 | 0 | 20.48 | **45.2** |
| Moon | 58.58 | 36.73 | 0 | 45 | 0.15 | **140.5** |
| Mars | 58.58 | 23.27 | 0 | 60 | 28.68 | **170.5** |
| Mercury | 60 | 36.73 | 0 | 30 | 49.54 | **176.3** |
| Jupiter | 1.42 | 36.73 | 60 | 0 | 42.72 | **140.9** |
| Venus | 1.42 | 36.73 | 60 | 0 | 14.06 | **112.2** |
| Saturn | 58.58 | 23.27 | 0 | 15 | 58.24 | **155.1** |

## 5. Cheṣṭā Bala (motional strength, 27.18, 27.24–25)

- The **Sun's** Cheṣṭā Bala is its Ayana Bala and the **Moon's** is its Pakṣa Bala (27.18). The verses count Cheṣṭā as one of the six balas that are added (27.25), so these two are in the total twice: once in Kāla and once here (C5). JHora and Raman's worked example leave them out of the total; the books speak of "doubling" the Sun's Ayana and the Moon's Pakṣa, which is the same thing counted inside Kāla.
- **Mars, Mercury, Jupiter, Venus and Saturn**: the cheṣṭā-kendra. Take the **śīghrocca** (the apogee of the graha's quick motion) and subtract the mean of the graha's mean and true longitudes; if the result is over 180° take it from 360°; divide by three. For Mars, Jupiter and Saturn the śīghrocca is the mean Sun and the graha's mean is its own mean longitude; for Mercury and Venus the mean is the mean Sun and the śīghrocca is the graha's own.

The mean positions are the ones of B. V. Raman's tables (from Kedarnath Dutt's *Book of Fate*) in Lahiri's zodiac: at 1 January 1900, 0h at 76° E the mean Sun is 257.4568°, Mars 270.22°, Jupiter 220.04°, Saturn 236.74° and the śīghrocca of Mercury 164° and of Venus 328.51°; the daily motions are 0.98560265°, 0.52402°, 0.0830967°, 0.03344°, 4.09232° and 1.602147°; and Mercury, Jupiter, Venus and Saturn have a yearly correction (t = the year − 1900): Mercury + (6.67 − 0.00133 t), Jupiter − (3.33 + 0.0067 t), Venus − (5 + 0.001 t), Saturn + (5 + 0.001 t). The true longitude is moved to Lahiri's zodiac first, so the strength does not depend on the ayanamsa of the chart.

Reference chart: 32061.138 days after the epoch.

| | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|
| Mean Sun | 177.000 | 177.000 | 177.000 | 177.000 | 177.000 |
| Mean (śīghrocca for Mercury, Venus) | 150.898 | 334.991 | 0.302 | 210.079 | 233.951 |
| True | 158.959 | 198.707 | 1.754 | 188.878 | 233.149 |
| Reduced kendra | 22.07 | 147.14 | 175.97 | 27.14 | 56.55 |
| **Cheṣṭā** (÷ 3) | **7.36** | **49.05** | **58.66** | **9.05** | **18.85** |

(The eight named motions of 27.21–23 — vakra 60, anuvakra 30 and so on — are not used: the verses give no speeds for the states, and Santhanam points to the kendra for the calculation. The test accepts ±0.1 virūpa for Mars to Saturn against JHora's figures.)

The other table, chosen with C13, is the Sūrya Siddhānta's own: the mean position of a graha is (revolutions in a kalpa ÷ 1,577,917,828,000 days) × the days since the Kali-yuga midnight at Ujjain (Julian day 588,465.5, 76° E), with the mean Sun 4,320,000,000, Mars 2,296,832,000, Mercury's śīghrocca 17,937,060,000, Jupiter 364,220,000, Venus's śīghrocca 7,022,376,000 and Saturn 146,568,000 revolutions. At the 1900 epoch it gives exactly the epoch values of Raman's table (Sun 257.457°, Mars 270.216°, Mercury 163.985°, Jupiter 220.040°, Venus 328.509°); Raman's table is the same with Dutt's yearly corrections added, and Saturn's epoch 236.74° is 2° off the pure 238.735°. For Mars the two are the same; in the three charts of the audit Mercury differs by up to 2.2 virūpa, Venus by 1.7, Jupiter by 0.7 and Saturn by 0.5.

## 6. Naisargika Bala (27.14)

Fixed by the graha: 60/7 times 1 to 7 in the order Saturn, Mars, Mercury, Jupiter, Venus, Moon, Sun.

| Saturn | Mars | Mercury | Jupiter | Venus | Moon | Sun |
|---:|---:|---:|---:|---:|---:|---:|
| 8.571 | 17.143 | 25.714 | 34.286 | 42.857 | 51.429 | 60 |

## 7. Dṛg Bala (aspectual strength, 27.19, 26.6–12)

1. For every other graha, the **aspect value** (sphuṭa dṛṣṭi) at the angle: the aspected graha's longitude minus the aspecting graha's, 0–360°. The general table (26.6–8):

   | Angle | Value |
   |---|---|
   | under 30° and from 300° | 0 |
   | 30°–60° | (angle − 30) / 2 |
   | 60°–90° | angle − 45 |
   | 90°–120° | 30 + (120 − angle) / 2 |
   | 120°–150° | 150 − angle |
   | 150°–180° | 2 × (angle − 150) |
   | 180°–300° | (300 − angle) / 2 |

   Saturn, Mars and Jupiter have special values in some stretches that replace it (26.9–12): Saturn 30–60°: 2(angle − 30), 60–90°: 60 − (angle − 60)/2, 240–270°: (angle − 240) + 30, 270–300°: 2(300 − angle); Mars 60–90°: 1.5(angle − 60) + 15, 90–120°: 60 − (angle − 90), 180–210°: 60, 210–240°: 60 − (angle − 210); Jupiter 90–120°: (angle − 90)/2 + 45, 120–150°: 60 − (angle − 120), 210–240°: (angle − 210)/2 + 45, 240–270°: 60 − (angle − 240).
2. The aspect is **benefic** if the aspecting graha is a benefic and **malefic** otherwise. Jupiter and Venus are benefics; the Sun, Mars and Saturn are malefics; the **Moon** is a benefic while waxing and a malefic while waning (3.11, 34.9): the bright half, the new Moon excluded and the full Moon included, is waxing (C1); **Mercury** is a malefic when it stands in the same sign as a malefic (Sun, Mars, Saturn, Rahu, Ketu or a waning Moon) and a benefic otherwise (C2).
3. Dṛg = ¼ × (sum of the benefic aspect values − sum of the malefic ones). Mercury's and Jupiter's aspects are **not** added again in full (C8).

Reference chart: the Moon is waning (249.8°) and Mercury, alone in Libra with Venus, is a benefic. So Jupiter, Venus and Mercury are benefics, the Sun, Moon, Mars and Saturn malefics.

Aspect value of the graha in the column on the graha in the row (virūpa):

| on ↓ / from → | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn | benefic sum | malefic sum | **Dṛg** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Sun | – | 34.90 | 0 | 0 | 47.21 | 0 | 0 | 47.21 | 34.90 | **3.08** |
| Moon | 25.10 | – | 16.90 | 36.77 | 18.41 | 31.86 | 53.99 | 87.04 | 95.99 | **−2.24** |
| Mars | 0 | 43.10 | – | 0 | 14.41 | 0 | 28.38 | 14.41 | 71.48 | **−14.27** |
| Mercury | 0 | 16.46 | 4.87 | – | 51.52 | 0 | 0 | 51.52 | 21.33 | **7.55** |
| Jupiter | 56.80 | 1.70 | 60.00 | 26.09 | – | 45.75 | 21.39 | 71.85 | 139.90 | **−17.01** |
| Venus | 0 | 26.29 | 0 | 0 | 56.44 | – | 0 | 56.44 | 26.29 | **7.54** |
| Saturn | 13.89 | 35.97 | 36.28 | 2.22 | 55.70 | 7.14 | – | 65.05 | 86.15 | **−5.27** |

(For example the Moon's aspect on Saturn: the angle is Saturn − Moon = 233.15 − 65.16 = 167.99°, in the 150°–180° stretch, so 2 × (167.99 − 150) = 35.97. Dṛg of the Sun: benefics Jupiter 47.21, malefics Moon 34.90, so ¼ × (47.21 − 34.90) = 3.08.)

## 8. The total and the required strength

Total = Sthāna + Dig + Kāla + Cheṣṭā + Naisargika + Dṛg, in virūpa. The graha is strong when the total reaches its required Ṣaḍbala (27.32–33): Sun 390, Moon 360, Mars 300, Mercury 420, Jupiter 390, Venus 330, Saturn 300 virūpa. In the view, under 100 % of the required is weak (✕), up to 120 % ok (!), more strong (✓).

| | Sthāna | Dig | Kāla | Cheṣṭā | Naisargika | Dṛg | **Total** | Required | |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Sun | 179.9 | 1.4 | 45.2 | 20.5 | 60.0 | 3.1 | **310.0** | 390 | weak |
| Moon | 188.3 | 21.8 | 140.5 | 36.7 | 51.4 | −2.2 | **436.5** | 360 | strong |
| Mars | 128.7 | 6.9 | 170.5 | 7.4 | 17.1 | −14.3 | **316.4** | 300 | ok |
| Mercury | 224.8 | 31.9 | 176.3 | 49.0 | 25.7 | 7.6 | **515.3** | 420 | strong |
| Jupiter | 203.9 | 22.4 | 140.9 | 58.6 | 34.3 | −17.0 | **443.1** | 390 | ok |
| Venus | 197.0 | 56.9 | 112.2 | 9.1 | 42.9 | 7.5 | **425.6** | 330 | strong |
| Saturn | 191.0 | 39.5 | 155.1 | 18.9 | 8.6 | −5.3 | **407.8** | 300 | strong |

## 9. Bhāva Bala (strength of the houses, 27.26–31)

The houses are whole signs counted from the Lagna sign, the first house beginning at 0° of the Lagna sign (the equal houses of LagnaOne); the middle point of each house, which the aspects and the Dig Bala go by, is 15° into its sign (C9). The reference chart has Cancer rising, so the 1st house is Cancer (middle 105°), the 2nd Leo (135°), the 3rd Virgo (165°) and so on.

The strength of a house is the sum of five parts:

1. **Bhāvādhipati Bala**: the total Ṣaḍbala of the lord of the sign, in virūpa (§8).
2. **Bhāva Dig Bala** (27.26–28): the distance of the middle of the house from its powerless angle, divided by three. The angle depends on the sign: Gemini, Virgo, Libra, Aquarius and the first half of Sagittarius — the **descendant**; Aries, Taurus, Leo, the first half of Capricorn and the second half of Sagittarius — the **nadir**; **Cancer and Scorpio — the ascendant** (C10); the second half of Capricorn and Pisces — the **midheaven**. Because the middle of a whole-sign house is always at 15°, which is read as the second half, Sagittarius is taken with the nadir and Capricorn with the midheaven.
3. **Bhāva Dṛṣṭi Bala** (27.28–29): the aspects on the middle of the house, by the table of §7: a quarter of each aspect (benefic positive, malefic negative), but **Mercury's and Jupiter's in full** (C8), added up.
4. **Occupants** (27.30): +60 virūpa (one rūpa) for each of Mercury and Jupiter in the house, −60 for each of Saturn, Mars and the Sun. The Moon and Venus add nothing.
5. **Bhāva Kāla Bala** (27.31): +15 virūpa if the sign of the house rises head first (śīrṣodaya: Gemini, Leo, Virgo, Libra, Scorpio, Aquarius) and the birth is in the daytime, if it rises both ways (ubhayodaya: Pisces) and the birth is in the twilight, or if it rises back first (pṛṣṭhodaya: Aries, Taurus, Cancer, Sagittarius, Capricorn) and the birth is at night. The twilight is five ghaṭī, two hours, either side of the sunrise and the sunset (46.44–47); the day is the rest of the time between them (C11).

Reference chart: a night birth (00:15, more than two hours from sunrise at 06:46 and sunset at 17:10), so the pṛṣṭhodaya signs have the 15.

| House | Sign | Lord | Bhāvādhipati | Dig (from) | Dṛṣṭi | Occupants | Kāla | **Total** |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Cancer | Moon | 436.5 | 3.18 (Asc) | 60.42 | 0 | 15 | **515.1** |
| 2 | Leo | Sun | 310.0 | 14.90 (Nadir) | 29.44 | 0 | 0 | **354.4** |
| 3 | Virgo | Mercury | 515.3 | 43.18 (Desc) | 12.40 | Sun, Mars −120 | 0 | **450.9** |
| 4 | Libra | Venus | 425.6 | 33.18 (Desc) | 47.58 | Mercury +60 | 0 | **566.4** |
| 5 | Scorpio | Mars | 316.4 | 36.82 (Asc) | 39.00 | Saturn −60 | 0 | **332.2** |
| 6 | Sagittarius | Jupiter | 443.1 | 25.10 (Nadir) | 29.26 | 0 | 15 | **512.5** |
| 7 | Capricorn | Saturn | 407.8 | 24.90 (MC) | 24.42 | 0 | 15 | **472.1** |
| 8 | Aquarius | Saturn | 407.8 | 6.82 (Desc) | 13.67 | 0 | 0 | **428.2** |
| 9 | Pisces | Jupiter | 443.1 | 4.90 (MC) | −29.09 | 0 | 0 | **418.9** |
| 10 | Aries | Mars | 316.4 | 54.90 (Nadir) | 38.75 | Jupiter +60 | 15 | **485.0** |
| 11 | Taurus | Venus | 425.6 | 44.90 (Nadir) | 37.50 | 0 | 15 | **523.0** |
| 12 | Gemini | Mercury | 515.3 | 46.82 (Desc) | 46.53 | 0 | 0 | **608.6** |

Worked, the 1st house: Cancer, lord the Moon with a Ṣaḍbala of 436.5. Cancer is measured from the ascendant (114.54°); the middle of the house, 105°, is 9.54° away, so Dig = 9.54 / 3 = 3.18. Dṛṣṭi: the aspects on 105°, by the angle 105° − the graha's longitude:

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Angle | 289.64 | 39.84 | 306.04 | 266.29 | 103.25 | 276.12 | 231.85 |
| Value | 5.18 | 4.92 | 0 | 16.85 | 51.62 | 11.94 | 34.07 |
| Nature | malefic | malefic | malefic | benefic | benefic | benefic | malefic |
| Weight | ¼ | ¼ | ¼ | full | full | ¼ | ¼ |

Dṛṣṭi = −¼ × (5.18 + 4.92 + 0 + 34.07) + 16.85 + 51.62 + ¼ × 11.94 = −11.04 + 68.47 + 2.99 = 60.42. (Jupiter's value is its special one: 90°–120° gives (103.25 − 90) / 2 + 45 = 51.62.) No graha stands in Cancer. Cancer rises back first and the birth is at night: Kāla +15. Total 436.5 + 3.18 + 60.42 + 0 + 15 = 515.1.

## 10. Choice points

These are the places where the verses are silent or the sources disagree. The "Used" column is the default, the reading of the Sanskrit text, and it is the first choice of each setting. **Every other alternative can be chosen in the Bala views, under "Calculation choices"** (above the Ṣaḍbala and the Bhāva Bala; the choices are kept in this browser and change nothing but these two views). C1–C11 and C13–C16 are settings; C6 and C7 (doubling the Sun's Ayana and the Moon's Pakṣa) are in the third choice of C5; C12 (Yuddha Bala) is not a setting.

| | Question | Used | Alternatives and who holds them |
|---|---|---|---|
| C1 | When is the Moon a malefic? | Dark half and new Moon (Santhanam, the Saravali documentation) | From the eighth tithi of the bright half to the eighth of the dark half, benefic; otherwise malefic (B. V. Raman, JHora) |
| C2 | When is Mercury a malefic? | In the same sign as a malefic (3.11 *krūra-yuta*; the text gives no orb) | Only when the benefics in its sign do not outnumber the malefics there (P. V. R. Narasimha Rao); or always a benefic |
| C3 | Saptavargaja scores and mūlatrikoṇa | The verse's 45/30/20/15/10/4/2; the 45 for the mūlatrikoṇa in the rāśi only (Raman); relations from the rāśi chart (Santhanam) | Raman's 45/30/22.5/15/7.5/3.75/1.875 (JHora); the 45 in every varga (Santhanam, the Saravali documentation); relations from each varga |
| C4 | Which "houses" Dig Bala measures from | The four angles: ascendant, descendant, midheaven, nadir (Santhanam, Raman) | Equal houses from the Lagna (JHora desktop) |
| C5 | Cheṣṭā Bala of the Sun and the Moon | Added to the total, once as Ayana/Pakṣa in Kāla and once as Cheṣṭā (27.18, 27.25) | Left out of the total (JHora, Raman's example); or the Ayana and Pakṣa doubled in Kāla with the Cheṣṭā column empty (the commentaries) |
| C6 | Ayana Bala | The declination of the verse's table from the longitude, the Sun not doubled | The real declination (Santhanam: "from a modern ephemeris"); the Sun's Ayana Bala doubled |
| C7 | The Moon's Pakṣa Bala | Not doubled (27.10–11) | Doubled (Raman article 55, Santhanam) |
| C8 | Mercury's and Jupiter's aspects (*jñejya-dṛk-yuktam*, 27.19, 27.29) | Ṣaḍbala: only the quarter (Raman, JHora). Bhāva Bala: in full instead of the quarter (Raman) | Ṣaḍbala: added in full on top (Santhanam, Sharma). Bhāva Bala: added in full on top of the quarter |
| C9 | The houses of Bhāva Bala | Whole signs from the Lagna sign; the middle point at 15° (LagnaOne) | Śrīpati (Porphyry) middle points, with the lord of the sign of the middle point (Raman); equal houses from the Lagna degree |
| C10 | The powerless angle of Cancer in Bhāva Dig Bala | The ascendant (27.27, Santhanam, Sharma) | The midheaven, with Pisces and the second half of Capricorn (Raman, Śrīpati's grouping of the water signs) |
| C11 | Which parts Bhāva Bala has; the twilight | The five parts of 27.26–31; the twilight is two hours either side of sunrise and sunset (46.44–47) | Raman's three parts without the occupants and the Kāla Bala; other lengths of twilight |
| C12 | Yuddha Bala | Left out | Raman's rule (the difference of the Ṣaḍbalas over the difference of the discs, the winner the one with the smaller longitude); the Saravali documentation (the winner the one with the greater longitude) |
| C13 | The mean positions of Cheṣṭā Bala | Raman's tables (Dutt, with the yearly corrections), in Lahiri's zodiac | The Sūrya Siddhānta's own revolutions from the Kali Yuga, without the corrections (Mars the same; Mercury up to 2.2 virūpa different) |
| C14 | The order of the decanates in Drekkana Bala (27.6) | Males, neuters, females: the Sanskrit text and Raman | Males, females, neuters: the translations of Santhanam (the edition of Sitaram Jha) and Sharma |
| C15 | The formula of Iṣṭa and Kaṣṭa Phala (28.6) | The mean of Uccha Bala and Cheṣṭā Bala; Kaṣṭa is what is left of sixty (the verse) | The square root of the product of the two; Kaṣṭa from what each lacks of sixty (B. V. Raman) |
| C16 | A graha in its debilitation sign in Vimśopaka Bala (7.11, 7.24–25) | Nothing, as in 7.11 | The points of its relation to the sign's lord, like any other sign |

## 11. Changing the choices

Above the Ṣaḍbala and the Bhāva Bala there is a folded line, **Calculation choices**. It opens one select for each choice point of §10 that belongs to the view (the Bhāva Bala shows the Ṣaḍbala's too, because it is made from the Ṣaḍbala of the lords), each with its sources and a note. The first alternative of each is the Sanskrit reading. A mark tells when any choice differs from it, and **Back to the Sanskrit reading** sets them all back. The reference chart's figures in this manual are for the Sanskrit reading; with the choices that JHora makes (the Moon by the eighth tithi, Raman's scores, equal houses for Dig Bala, the Sun's and the Moon's Cheṣṭā Bala out of the total) the app gives JHora's own Dṛg Bala and Cheṣṭā Bala of Mars to Saturn, the Sun's Dig Bala and Raman's Saptavargaja scores for the reference chart (tested in `src/lib/balaOptions.test.ts`).

## 12. How to check a number by hand

1. Take the longitudes, the ascendant, the midheaven, the ayanamsa, the sunrise and sunset and the birth time from the collapsed "calculation details" line under the graha table and from the graha table itself.
2. Choose a part, find its section above and follow the steps; every section ends with the reference chart's figures so you can first check your method against them.
3. For a graha's total, add its six parts (§8); for a house, add its five (§9). The tooltips in the tables show the parts of Sthāna and Kāla.
4. The same arithmetic is in the tests: `src/lib/shadbala.test.ts` and `src/lib/bhavaBala.test.ts`, with the reference chart in `src/lib/shadbala.fixture.ts`.

## 13. What is not included

- Yuddha Bala (C12).
- The rest of chapter 28 (28.7–20) beyond the Iṣṭa and Kaṣṭa Phala of §14.
- The minimum strengths of the parts of the Ṣaḍbala (27.34–36: for Jupiter, Mercury and the Sun Sthāna 165, Dig 35, Kāla 50, Cheṣṭā 112, Ayana 30 virūpa; for the Moon and Venus 133, 50, 30, 100, 40; for Mars and Saturn 96, 30, 40, 67, 20). The view shows only the total against its required strength.
- A minimum strength for a house: the verses give none.
- The edition: the Sanskrit comes from one online edition, and a reader of Sanskrit should check the verses listed in [shadbala-sources.md](shadbala-sources.md).

## 14. Iṣṭa Phala and Kaṣṭa Phala (BPHS 28.2–6)

Chapter 28 turns two of the strengths into a measure of the good and the harm a graha's daśā is likely to bring. It is shown under the Ṣaḍbala table. The verses work with "rays" (*raśmi*):

1. **Uccha ray (28.2).** The distance of the graha from its debilitation point, taken to 180° at most, as signs, plus one sign, with the remaining degrees doubled (the degrees over 30, that is). Take one from the ray and multiply by ten, and you have the angle over three: this is Uccha Bala of §2.1.
2. **Cheṣṭā ray (28.3–4).** The same from the cheṣṭā-kendra: for Mars to Saturn the kendra of §5; for the Sun the sāyana Sun and three signs (28.4); for the Moon the Moon less the Sun. Each is reduced to 180° at most; the Cheṣṭā strength is the kendra over three. The Sun's and the Moon's Cheṣṭā here is therefore not their Ayana Bala and Pakṣa Bala (§5), and the setting C5 does not touch it.
3. **Iṣṭa Phala (28.6).** Take one from each ray, multiply each by ten, add them and halve: this is the **mean of Uccha Bala and Cheṣṭā Bala**, in virūpa (0–60). **Kaṣṭa Phala** is what is left of sixty. (28.5 also gives a "benefic ray", half the sum of the two rays, and an "inauspicious ray", that taken from eight; the app shows the virūpa form of 28.6.)
4. **Which is greater** tells whether the good or the harm is likely to prevail; with the verse's formula the two always add up to 60, so Iṣṭa over 30 is the same as Iṣṭa over Kaṣṭa.

**Choice point C15.** B. V. Raman (articles 138–139) takes instead the square root of the product of Uccha Bala and Cheṣṭā Bala as the Iṣṭa Phala and the square root of the product of what each lacks of sixty as the Kaṣṭa Phala. With his formula the two do not add up to 60 (Raman's Moon: 38.13 and 20.66). The verse is the mean, which is the default; Raman's is a choice under "Calculation choices".

**Worked on the reference chart** (the Sūrya Siddhānta's mean positions for the five grahas, C13; the default Raman's table moves Mercury and Venus a little):

| Graha | Uccha | Cheṣṭā (kendra) | Iṣṭa (verse) | Kaṣṭa (verse) | Iṣṭa (Raman) | Kaṣṭa (Raman) |
|---|---:|---:|---:|---:|---:|---:|
| Sun | 4.88 | 23.65 | 14.27 | 45.73 | 10.74 | 44.76 |
| Moon | 49.28 | 36.73 | 43.01 | 16.99 | 42.55 | 15.79 |
| Mars | 13.65 | 7.36 | 10.51 | 49.49 | 10.02 | 49.39 |
| Mercury | 48.76 | 46.84 | 47.80 | 12.20 | 47.79 | 12.16 |
| Jupiter | 28.92 | 58.01 | 43.46 | 16.54 | 40.96 | 7.87 |
| Venus | 3.96 | 10.74 | 7.35 | 52.65 | 6.52 | 52.54 |
| Saturn | 48.95 | 18.33 | 33.64 | 26.36 | 29.96 | 21.46 |

The tests are in `src/lib/ishtaKashta.test.ts`: Raman's printed examples (61–64) and the three charts of the audit, against numbers worked out by a separate program. The rest of chapter 28 (28.7–20: the Iṣṭa and Kaṣṭa of the sign a graha stands in, with the scores 60, 45, 30, 22, 15, 8, 4, 2 and 0 and half of them in the other vargas, those of Dig and Kāla Bala, and the results for the houses) is not included.

## 15. Vimśopaka Bala (BPHS 7.10–27)

Vimśopaka Bala says how well a graha stands in the divisional charts, out of 20. It is the third tab of ANALYSIS → Bala. A graha gets points for the sign it holds in each varga of a scheme, and each varga counts for its weight out of 20.

1. **The schemes and their weights (7.17–23).** Ṣaḍvarga: D1 6, D2 2, D3 4, D9 5, D12 2, D30 1. Saptavarga: D1 5, D2 2, D3 3, D7 2.5, D9 4.5, D12 2, D30 1. Daśavarga: D1 3, D60 5 and 1.5 each for D2, D3, D7, D9, D10, D12, D16, D30. Ṣoḍaśavarga: D1 3.5, D9 3, D60 4, D16 2, D2, D3 and D30 1 each, and 0.5 each for the other nine (D4, D7, D10, D12, D20, D24, D27, D40, D45). Each scheme adds up to 20. (The Sanskrit of 7.18 has *rama* where the Ṣaḍvarga's D1 6 should be *rasa*; with 3 the scheme would add up to 17, so the printed word is a slip, shared by the editions.)
2. **The points of a sign (7.24–25).** 20 in its own sign; 18 in the sign of an **adhimitra** (great friend), 15 of a **mitra**, 10 of a **sama**, 7 of a **śatru** and 5 of an **adhiśatru**. The relation is the compound one of the Saptavargaja Bala (§2.2): the natural friendship together with the temporary one, which is read from the rāśi chart (choice C3, shared with the Saptavargaja Bala; the other reading takes it from the varga's own chart).
3. **Exaltation and debilitation (7.11).** Full strength, 20, in the exaltation sign as in the own sign, and none in the seventh from it. A graha in its debilitation sign gets 0 (choice C16); the other reading gives it the points of its relation to the sign's lord, like any other sign.
4. **The sum.** For each varga of the scheme: weight × points / 20; the sum is the graha's Vimśopaka Bala out of 20.
5. **What the total gives (7.26–27).** Under 5 it gives no results, over 5 little, over 10 middling and over 15 the full (*tithi* in the verse is 15; the site translation of the audit reads it as thirty). The view prints that word next to the number.

**Choice points.** C3 (the temporary friendship: from the rāśi chart, the default, or from each varga's own chart) and **C16** (the debilitation sign: 0 by 7.11, the default; or the points of the relation). The Vimśopaka view shows them under "Calculation choices".

**Worked on the reference chart** (the defaults):

| Graha | Ṣaḍvarga | Saptavarga | Daśavarga | Ṣoḍaśavarga |
|---|---:|---:|---:|---:|
| Sun | 15.80 | 16.55 | 13.60 | 13.65 |
| Moon | 8.95 | 10.45 | 12.75 | 10.12 |
| Mars | 9.00 | 9.62 | 10.88 | 12.00 |
| Mercury | 8.50 | 9.12 | 12.38 | 11.45 |
| Jupiter | 10.00 | 10.00 | 12.50 | 11.38 |
| Venus | 15.45 | 14.15 | 15.28 | 15.20 |
| Saturn | 12.00 | 13.25 | 14.62 | 14.18 |

The divisional charts are the sixteen of §2.2 with D4, D10, D16, D20, D24, D27, D40, D45 and D60 worked from their definitions in BPHS 6. The tests are in `src/lib/vimsopaka.test.ts`: the weights, the points of a sign, the thresholds, the signs of the sixteen vargas and the four schemes of every graha on three charts, against a separate program. Not included: the strength that runs by degrees through the sign (*gṛhaviṃśopaka*, 7.11–16) and the one from the distance to the Sun (*udayāsta*, 7.28–29).
