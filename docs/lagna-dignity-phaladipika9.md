# The lagna and the dignity of the grahas: Phaladīpikā 9 (since v3.88)

The view ANALYSIS → Lagna and dignities is from chapter 9 of the Phaladīpikā of Mantreśvara, "Lagnaphalabheda" (the kinds of results of the lagna), 20 verses, with the Hindi commentary of the edition (`phaldipika_202310`, a scan of the print with a text layer).
The code is `src/lib/lagnaPhala.ts`, the view `src/components/LagnaPhalaPanel.tsx`.

| Verses | What |
|---|---|
| 9.1–12 | The lagna by each sign, Aries to Pisces: the body, the nature and the life |
| 9.13 | What is said of the lagna is to be said of the Moon sign too |
| 9.14–18 | A graha in its exaltation, its own sign, a friend's sign, an enemy's sign, its fall |
| 9.19 | A combust graha (soon death in its daśā, loss of wife, children and wealth); a graha in a neutral sign gives nothing special |
| 9.20 | A retrograde graha gives the result of exaltation even in an enemy's sign or its fall; a graha in a vargottama navāṁśa gives the results of its own sign |

## What the app does

* Names the lagna sign and the Moon sign and gives the result of each with its verse.
* For each of the seven grahas: its dignity by the sign it is in (exalted, own, friend's, enemy's, its fall, neutral), the result and the verse; and whether it is combust (the orbs of `combustion.ts`), retrograde (Mars to Saturn) or vargottama.

## Readings and limits

* "Friend" and "enemy" are the **natural** friendship (`dignity.ts`). The text does not say whether the temporary friendship counts; the commentary reads the sign of the lord and its natural friends.
* A graha that is exalted or in its fall is told by that, whatever the friendship. The mūlatrikoṇa is taken with the own sign (the text names the own sign only).
* The commentary adds to 9.14 that the results of an exalted graha come only when it is also well placed, in good vargas and seen by benefics; that is stated in the view, and the app does not judge it.
* The retrograde and the vargottama rules (9.20) are shown beside the dignity; the app does not replace the dignity by them, as the text says "gives the result of", and the reader weighs the two.
* Rāhu and Ketu are not in the chapter.
* The commentary quotes the Jātakābharaṇa and other books after each verse, with a result for each of the seven grahas by dignity. They are not the Phaladīpikā and are not used.
* The Sanskrit is the text layer of a scan; the plain misreadings are corrected. In 9.16 the first words of the second line and in 9.19 the first word could not be read; the verses say so.
