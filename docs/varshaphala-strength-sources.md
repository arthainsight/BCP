# Tājika Varṣaphala: annual strength methods

The annual chart endpoint now returns three separate strength views: the existing **Pañcavargīya Bala**, **Harṣa Bala**, and **Dvādaśavargīya Bala**. These are not collapsed into one score.

## Harṣa Bala

Following K. S. Charak, *A Textbook of Varshaphala*, chapter VI, each of the seven classical planets can receive four independent five-point factors:

- Positional: Sun in 9, Moon in 3, Mars in 6, Mercury in 1, Jupiter in 11, Venus in 5, Saturn in 12.
- Own or exaltation sign: five points.
- Gender: male planets (Sun, Mars, Jupiter) in masculine houses 4, 5, 6, 10, 11, 12; female planets (Moon, Mercury, Venus, Saturn) in feminine houses 1, 2, 3, 7, 8, 9.
- Day/night: male planets receive five when the solar return occurs by day; female planets receive five when it occurs by night.

The score ranges from 0 to 20. The day/night state is determined from the annual chart location's local sunrise and sunset.

## Dvādaśavargīya Bala

The twelve factors are Rāśi, Horā, Drekkāṇa, Chaturthāṁśa, Pañchāṁśa, Ṣaṣṭhāṁśa, Saptāṁśa, Aṣṭāṁśa, Navāṁśa, Daśāṁśa, Ekādaśāṁśa and Dvādaśāṁśa.

For each factor, the planet is classified as benefic, malefic or neutral. Own sign and exaltation are benefic; debilitation is malefic; otherwise the relationship with the relevant divisional lord is read by Tājika mutual house relationship in the annual rāśi chart: 3/5/9/11 friend, 1/4/7/10 enemy, 2/6/8/12 equal. Exaltation/debilitation override the ordinary relationship.

Pañchāṁśa uses Charak's special five-planet sequence rather than the ordinary Parāśara D5 sign mapping: odd signs assign Mars, Saturn, Jupiter, Mercury, Venus to successive six-degree portions; even signs reverse the sequence.

The report shows the benefic, malefic and neutral counts out of twelve, their net difference, and the reason for every individual varga factor. The resulting classification is a summary of these twelve categorical judgments, not a weighted numerical bala.

## Sources and scope

K. S. Charak, *A Textbook of Varshaphala*, Chapter VI, “Of Planetary Strengths”, sections “The Harsha Bala” and “The Dwadashavargiya Bala”. The implementation uses the rules in that chapter; it does not claim these methods are the only Tājika lineage.
