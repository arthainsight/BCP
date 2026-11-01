# The effects of the lords of the houses (BPHS 24), after the Sanskrit

Source: Bṛhat Parāśara Horā Śāstra, chapter 24 "Bhāveśa-phala", in Devanagari with the verse numbers (the text of enjoylearningsanskrit.com), 148 verses. The code is
`src/lib/bhavaLordEffects.ts` and the verses `src/lib/bhavaLordEffectsData.ts`; the view is ANALYSIS → Bhāveśa (v3.77). This is what Kala calls its "144 Bhava Yogas".

## The text

* **24.1–144**: the lord of each house in each of the twelve houses, 12 × 12 = 144, in the order of the houses: first the lord of the 1st (lagneśa) in the 1st, 2nd … 12th, then the lord of the 2nd (dhaneśa), the 3rd
  (sahajādhīśa), the 4th (sukheśa), the 5th (suteśa), the 6th (ṣaṣṭheśa), the 7th (dāreśa), the 8th (aṣṭameśa / randhreśa), the 9th (bhāgyeśa), the 10th (karmeśa / rājyeśa), the 11th (lābheśa) and the 12th (vyayeśa).
* **24.145–148**: the use. "Declare all these by discerning the strengths and weaknesses" (145). A lord of two signs gives the effect of both; if the two are equal and contradictory both are destroyed; if they differ both are
  certainly obtained (146–147). A lord of full strength gives the full effect, of half strength a half, "a weak one" a quarter (147–148).

## What the app does

* For each house it finds the lord, where the lord stands (the house from the Lagna) and shows that verse: the Sanskrit as the text has it, the IAST, and a one-line summary.
* A lord of two signs (Mars, Mercury, Jupiter, Venus, Saturn) gets the verse of its other house too, with the lord standing in the same house (146–147). The Sun and the Moon have one house each; Rāhu and Ketu have no verses.
* The verses are checked in a test: the lord and the house that each verse names in its first words are the lord and house the verse stands for, for all 144.

## What the text leaves, and what is not done

* **How much of an effect is given** (full, half, a quarter by the strength of the lord, 147–148) is not worked out. The text gives no measure of "full", "half" or "weak"; the Ṣaḍbala (minimums of the Phaladīpikā) could be one, but that would be a choice.
* **Equal and contradictory effects destroying each other** (146) is left to the reader: whether two summaries contradict is a judgement.
* **The conditions inside the verses** (for example "if the lord is a malefic", "if afflicted by malefics and without benefic aspect", "with Jupiter in its own or exaltation sign") are in the verse and the summary, not evaluated by the code.
* **Verse 37 is irregular in the print.** It reads "sukheśe dhanage" (the 4th lord in the 2nd), and so does verse 38. By the order the 4th lord in the 1st house would otherwise have no verse and the 2nd would have two, and the content of 37
  (learning, land, vehicles, the mother) fits the 1st; so 37 is placed in the 1st house, and says so in the view. Verse 38 stays the 2nd.
* **The summaries are mine**, short and from the first clause of the verse; they leave out some of the qualifications. The verse decides. The English translation of the site was used only to read the verses, not copied.
