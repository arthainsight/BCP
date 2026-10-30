# Vāra–Tithi–Nakṣatra yogas and the month strip (v3.57)

Source: Ernst Wilhelm, *Classical Muhurta*, chapter 9 "Combinations of Vara, Tithi & Nakshatra". The code is `src/lib/vtnYogas.ts`; the tests (`vtnYogas.test.ts`) check it against the tables of the book.

## The yogas

| Kind | Auspicious | Inauspicious |
| --- | --- | --- |
| Vāra/Tithi (VT) | Siddha, Amṛta | Krakacha, Dagdha, Hutāśana, Viṣa, Saṃvartaka |
| Tithi/Nakṣatra (TN) | – | Aśubha, Poor luck in ten months |
| Vāra/Nakṣatra (VN) | Sarvārtha Siddhi, Siddha (two), Amṛta, Subha, Subha Madhyam, Śobhana, Śrī, the yogas that dispel difficulties (on tithis other than Riktā) | Dagdha (two), Yamaghaṇṭa, Utpāta, Mṛtyu (three), Kāṇa, Nāśa |
| Vāra/Tithi/Nakṣatra (VTN) | Suta, Siddha | Viṣa, Vināśa |
| (repeating) | Tripuṣkara, Dvipuṣkara: not auspicious or inauspicious, the event repeats; they count for nothing in the judgement |  |

Tithis are counted 1 to 15 in each half; Purnima is the full Moon only. The vāra changes at sunrise (the same sunrise as in the Finder).

## The judgement of a moment

The book: "Vara/Nakshatra Yogas are three times as powerful as Vara/Tithi Yogas, and Vara/Tithi/Nakshatra Yogas are three times as powerful as Vara/Nakshatra Yogas. Tithi/Nakshatra Yogas are the least powerful." And: auspicious and inauspicious yogas of equal strength cancel (the auspicious one prevails if the Tara and the others suit); of different kinds the more powerful kind gives its effects. The finder uses the strengths TN 1, VT 2, VN 6, VTN 18 and sets the strongest auspicious against the strongest inauspicious yoga of a moment: **green** if the auspicious is stronger or alone, **yellow** where the two are equally strong, **red** if the inauspicious is stronger or alone, grey where no yoga is formed. The book's further condition (the lords of the vāra, tithi and nakṣatra not heavily afflicted, the Tara and the others suiting) is not worked out; the strip says what the combinations are, not that the event will succeed.

Exceptions for the event: Aśvinī on Tuesday, Puṣya on Thursday and Rohiṇī on Saturday are Sarvārtha Siddhi but "unfavorable for marriage, traveling and entering a new house"; the strip leaves them out for the ready-made choices Wedding, Entering a new house and Commencing a journey.

## Where the book's prose and its tables differ

The yogas are written from the prose (which names the nakṣatras). The tables at the end of the chapter were compared with it row by row; they agree except in these places, where the prose is followed:

| Yoga | Prose | Table |
| --- | --- | --- |
| Siddha (VN), Sun | Mūla, Uttara Āṣāḍhā (19, 21) | 20, 22 |
| Siddha (VN), Mercury | Pūrva Bhādrapadā (25) | 26 |
| Subha (VN), Saturn | Uttara Phalgunī (12) | 21 |
| Śobhana (VN), Moon | Pūrva Bhādrapadā (25) | 26 |
| Mṛtyu (second), Moon | Pūrva Āṣāḍhā (20) | 21 |
| Poor luck in ten months | Magha or Hasta with the 5th, Chitrā or Svātī with the 13th | the extracted table has the columns misaligned |

The table's asterisks (a factor that forms both an auspicious and an inauspicious yoga) suggest that in two of these (Subha Saturn, Śobhana Moon) the table may be the one that is right. The tables of the book were read from a text extraction; the printed page should be checked before these five entries are changed.

## The month strip

`/api/muhurta-strip` returns the sky of a month as stretches of equal vāra, tithi, nakṣatra, karaṇa, yoga and sign of the Moon (to the minute; the strip is one month at a time, from the first of the month at the place). The page colours them against the choices of the Muhūrta Finder:

- **green**: the value is one that is chosen (for a ready-made choice, what the book calls favourable for the purpose);
- **yellow**: the book calls it middling for the purpose (the "middling" lists of the ready-made choices);
- **red**: not chosen.

When nothing is chosen away (every value of a group chosen), no stretch of the group is red. The Tarabala and the Chandrabala rows are there when the chart has a natal Moon. The last row is the book's own judgement of the vāra/tithi/nakṣatra yogas, not the choices. A click on any row gives the moment's vāra, tithi, nakṣatra, karaṇa, yoga and the yogas it forms.

Not done: a Lagna row (the Lagna changes every two hours; Kala zooms to it), the finer scales of Kala's strip (navāṁśa, hora, muhūrta, nāḍī, minutes), the Nakṣatra Purusha and the other readings of the Muhurta Helper, the VTN yogas as a Finder condition or wish.
