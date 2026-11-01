# Grahas in the houses: Phaladīpikā 8 (since v3.86)

The view ANALYSIS → Grahas in houses gives the result of each graha in the house it stands in from the lagna, from chapter 8 of the Phaladīpikā of Mantreśvara, "Grahabhāvaphalabheda" ("the kinds of results of the grahas by the houses"),
35 verses, with the Hindi commentary of the edition (`phaldipika_202310`, a scan of the print with a text layer). The code is `src/lib/grahaBhavaPhala.ts`, the view `src/components/GrahaBhavaPanel.tsx`.

## The text

| Verses | What |
|---|---|
| 8.1–4 | The Sun in the 1st (by the sign of the lagna), 2nd–4th, 5th–8th, 9th–12th |
| 8.5–7 | The Moon in the 1st–3rd (the waxing Moon as given, the waning the opposite), 4th–7th, 8th–12th |
| 8.8–10 | Mars; 8.11–13 Mercury; 8.14–16 Jupiter; 8.17–19 Venus: each in four houses at a time |
| 8.20–24 | Saturn: the lagna (in its own or exaltation sign like a king, in another sign poor and dirty), the 2nd–3rd, 4th–7th, 8th, 9th–12th |
| 8.25–27 | Rāhu in the 1st–4th, 5th–8th, 9th–12th |
| 8.28–33 | Ketu in the 1st–2nd, 3rd–4th, 5th–6th, 7th–8th, 9th–10th, 11th–12th |
| 8.34–35 | A graha at the degree of the lagna (the middle of the house) gives the whole result of the house, and less or more the farther or nearer it is; Rāhu gives like Saturn and Ketu like Mars |

## What the app does

* For each of the nine grahas in the chart: the house from the lagna (whole signs), the verse and a short result written from the Sanskrit and the commentary (108 results in all), and the verse in Devanagari under a fold.
* Reads the three variants the verses name: the Sun in the lagna by the sign of the lagna (8.1: Aries, Cancer, Leo, Libra), the Moon in the lagna by its phase (8.5), Saturn in the lagna by its sign (8.20).
* Gives the distance of the graha from the middle of the house (8.34–35): the degree of the lagna repeated in each sign, as the commentary explains.

## Readings and limits

* The house is the whole-sign house from the lagna. The Bhāva Chalit view is another system and is not used here.
* 8.34–35 give no measure, so no fraction of the result is applied; the distance is shown and the text's rule is stated.
* In 8.5 and 8.27 the Sanskrit and the Hindi differ in small things (the Moon in the 2nd: the Sanskrit "wealthy, defective in speech", the commentary "learned, soft-spoken, with a defective body"; Rāhu in the 9th: the Sanskrit "without merit", the commentary "very meritorious"). The results follow the Sanskrit and say so where the commentary differs.
* The Sanskrit is the text layer of a scan; the plain misreadings (stray signs, the avagraha) are corrected. In 8.15 the first word and in 8.31 one word are restored from the commentary and in 8.26 part of the last line could not be read; those verses say so.
* The commentary quotes the Sārāvalī and the Jātakābharaṇa after each verse. They differ in places and are not used.
* Not in this chapter and not built: the results of the lagna by sign (Phaladīpikā 9), of the lords of the houses (Phaladīpikā 15, 16; BPHS 24 is already in the app) and the results of the grahas in the houses by other classics.
