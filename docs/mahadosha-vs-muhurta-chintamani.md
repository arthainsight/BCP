# The Mahādoṣas of the app beside the Muhūrtacintāmaṇi

The definitions of the Mahādoṣas in `src/lib/mahadosha.ts` were first typed from Ernst Wilhelm's *Classical Muhurta*, which is a
modern book. The classics decide, so this page sets each doṣa beside the **Muhūrtacintāmaṇi** (Rāma Daivajña, 1600) — the Sanskrit
text with the *Pīyūṣadhārā* commentary (Govinda Daivajña, 1603) and the Hindi translation of Mahīdhara Śarmā (Khemrāj ed.), in
the chapter on marriage (*vivāha prakaraṇa*, verses cited as "v.") and the first chapter (*śubhāśubha prakaraṇa*, "1.46"). The OCR of
the scans is in the scratchpad of the session, not in the repository; where a verse is in a picture or the OCR is doubtful
this page says so, and nothing in doubt is implemented.

Muhūrta Mārtaṇḍa and Kālaprakāśikā are compared in `muhurta-martanda-kalaprakasika.md`.

## Changed in the app by this comparison

| Doṣa | Muhūrtacintāmaṇi | App before | App now |
|---|---|---|---|
| Saṅgraha (v. 45) | Moon with the Sun: poverty; Mars: death; **Mercury: good; Jupiter: happiness**; Venus: a rival wife; Saturn: renunciation; Rāhu/Ketu likewise; with two malefics: death | any graha with the Moon | Mercury and Jupiter no longer count |
| Viṣa Ghaṭī, nakṣatras (v. 49–51) | The table has **all 27**: Aśvinī 50, Bharaṇī 24, Kṛttikā 30, **Rohiṇī 40**, **Mṛgaśīrṣa 14**, **Ārdrā 21**, Punarvasu 30, Puṣya 20, Āśleṣā 32, Maghā 30, P. Phalgunī 20, U. Phalgunī 18, Hasta 21, Citrā 20, **Svātī 14**, Viśākhā 14, **Anurādhā 10**, Jyeṣṭhā 14, Mūla 56, P. Āṣāḍhā 24, **U. Āṣāḍhā 20**, **Śravaṇa 10**, Dhaniṣṭhā 10, Śatabhiṣā 18, P. Bhādrapadā 16, U. Bhādrapadā 24, Revatī 30 (the nāḍī at which the four poisonous nāḍīs begin). The Sanskrit gives them in bhūta-saṅkhyā words (e.g. *kha-rāma* = 30, *kṛti* = 20); the Hindi commentary agrees | 7 of the 27 had none (Wilhelm: "none of significance"), Mūla had a second (20) | all 27, Mūla 56 only |
| Dagdha tithi (v. 66) | The tithi burnt by the Sun's sign: Sun in Sagittarius/Pisces the 2nd, Taurus/Aquarius the 4th, Cancer/Aries the 6th, Gemini/Virgo the 8th, Leo/Scorpio the 10th, Capricorn/Libra the 12th; "described for Madhyadeśa" | not there | new doṣa `dagdha` (bound to Madhyadeśa when the region is named) |
| Afflictions of Jupiter and Venus (1.46–51) | Works are not done in the asta, childhood and old age of Jupiter and Venus (1.46, 47); the same is forbidden with Jupiter in Leo or Capricorn (1.48); the Leo fault is lifted in three ways (below) | The presets claimed "Udayāsta" was this, which is **wrong**: the Udayāsta Śuddhi is the purity of the Lagna and the 7th | new doṣa `jupiterVenus` (asta by the usual orbs; Jupiter in Leo or Capricorn); the three presets use it |

## Neutralisations (pariharas) added

Each is a selectable level (`parihara=off|named|broad|all`), `named` at the start. A graha is "strong" when in its own sign, its
exaltation or a friend's sign, neither combust nor (for the Moon) in the dark half — the verses do not say what strong is, and
Ṣaḍbala is not worked out for every minute of a search.

| Level | Verse | The fault | What destroys it |
|---|---|---|---|
| named | v. 68 | Ekārgalā, Upagraha, Pāta, Lattā, Yāmitrī, Kartarī, Udayāsta | the Sun **and** the Moon strong ("as the dark of night at sunrise") |
| named | v. 88 | Kartarī (Lagna, 7th) | the malefics that make it in the sign of an enemy, in their fall or combust |
| named | v. 88 | Bhṛgu ṣaṭka | Venus in the sign of an enemy or in its fall |
| named | v. 88 | Aṣṭama Kuja | Mars combust, in the sign of an enemy or in its fall |
| named | v. 88 | Moon in the 6th, 8th, 12th | the Moon in its fall or in the Navāṁśa of its fall |
| named | v. 46 | Aṣṭama Lagna | the lords of the two signs one (Aries/Scorpio, Taurus/Libra) or friends of each other |
| named | v. 45 (other view in the commentary) | Saṅgraha | the Moon in a friend's, its own or its exalted sign, or Vargottama |
| named | commentary on v. 43 | Gaṇḍānta | the Moon strong for the tithi's, Jupiter strong for the Lagna's |
| named | commentary on v. 49–51 | Viṣa Ghaṭī | the Moon in an angle or a trine but not the Lagna |
| named | v. 49, 51 | Jupiter in Leo | the Sun in Aries (the solar Vaiśākha) |
| broad | v. 89, 90 | the faults of the tithi (Riktā, Śūnya), the blind/deaf/lame Lagna, the Moon with a malefic (Saṅgraha), the Navāṁśa joined by a malefic (Kunavāṁśa) | Mercury, Venus or Jupiter strong in an angle or a trine; or Jupiter there; or the Sun in the 11th; or the Moon in an upachaya (3, 6, 10, 11) or Vargottama |
| broad | v. 90 | Dūrmuhūrta, Kunavāṁśa | the Moon in the 11th |
| all | v. 91 | every fault but Jupiter and Venus themselves | Mercury (100 faults), Venus (200), Jupiter (100,000) in an angle (not the 7th) or a trine, or the lord of the Lagna or of its Navāṁśa in the 11th or an angle |

Measured (40 days from 2027-03-01 in Helsinki, every vāra, tithi and nakṣatra allowed): with six faults ticked (Pañcāṅga Doṣa, Kartarī, Saṅgraha, Gaṇḍānta, Viṣa Ghaṭī, Dūrmuhūrta) 5 % of the time is free with `off`, 7 % with `named`, 12 % with `broad` and 78 % with `all`. With all 29 ticked it is 0 %, 0.3 %, 0.5 % and 42 %. So the named exceptions loosen the search a little, the broad verses about twice, and v. 91 lets most times through (it is the verse of the boast "Jupiter destroys 100,000 faults"); the pariharas do not by themselves make the wedding of every fault ticked possible.

## Regions (v. 50, 51, 66, 69)

The place of the muhūrta is named by ticking the countries it is in; with none ticked every fault counts everywhere.

| Fault | Country |
|---|---|
| Dagdha tithi | Madhyadeśa (v. 66) |
| Upagraha nakṣatra | Kuru and Bāhlīka, the north-west (v. 69) |
| Pāta | Vaṅga and Kaliṅga (the Sanskrit), Magadha and the like (the commentary), the east (v. 69) |
| Lattā | Saurāṣṭra and Śālva, the west (v. 69) |
| Yāmitra | the country of the Yamunā (v. 69, "somewhere") |
| Jupiter in Leo, all of the sign | between the Gaṅgā and the Godāvarī (v. 50); Kaliṅga, Gauḍa, Gurjara (v. 51). Elsewhere only the first five pādas, Maghā and the first of P. Phalgunī (the first 16°40′ of Leo) |

Vedha is forbidden "everywhere" (v. 69) and is not worked out (below).

## Where the app still differs, and why it is left

| Doṣa | Muhūrtacintāmaṇi | Why not changed |
|---|---|---|
| Kartarī (v. 44) | the malefic in the 2nd **retrograde** and the one in the 12th **direct**; also from the 7th and the Moon | the condition is plain in the text and stricter than the app's; the speed of the grahas is now in the sky (`retro`), so it can be an option on request |
| Lattā (v. 59), Pāta (v. 60) | the Lattā is turned round when the graha is retrograde; the Pāta differs in its formula | OCR of the formulae is not clear enough to type |
| Upagraha | the list of nakṣatras of the text has not been read to the end against the app's 13 positions | not typed from the OCR |
| Jāmitra (v. 67) | the 7th from the Lagna or the Moon, and a sharper test by the Navāṁśa; the commentary adds that in other books the yāmitra of benefics is good | the app takes every graha, as before |
| Dūrmuhūrta | v. 52–54: the day has 15 muhūrtas of 2 ghaṭīs, named by gods; the forbidden ones per weekday: Sunday Aryaman, Monday Brahmā and Rākṣasa, Tuesday Agni and Pitṛ, Wednesday Abhijit, Thursday Toya and Rākṣasa, Friday Brahmā and Pitṛ, Saturday Īśa and Sarpa | not the tithyaṁśa of Wilhelm's book. Clear in the Sanskrit; Agni on Tuesday is not in the list of the day (only Indrāgnī), so it is left for a decision |
| Kulika (v. 65) | a table per weekday | OCR of the table is not trusted |
| Vedha, Bāṇa, Yuti (v. 56–57, 69) | Pañcaśalākā, Saptaśalākā, Vedha | the cakras are pictures |
| Gaṇḍānta (v. 43) | nakṣatra: 2 ghaṭīs on each side (the app's "2 ghaṭīs" choice); tithi: **1** ghaṭī on each side (the app takes 2, as Wilhelm does); Lagna: half a ghaṭī (of time, about 3°) | choose "2 ghaṭīs" to follow the Muhūrtacintāmaṇi for the nakṣatra; the tithi's 24′ against 12′ is a difference between sources |
| Viṣa Ghaṭī, tithis (v. 49–51) | the table of the tithis is a picture | the app keeps Wilhelm's table, uncompared |
| Aṣṭama Lagna (v. 47, 48) | further pairs of signs, the 12th, the Navāṁśa; the 8th lord in an angle or exaltation as other view | the OCR of v. 47 is garbled |
| Jupiter/Venus childhood and old age (1.47) | Venus 3 days (east) or 10 (west) after rising, 15 (east) or 5 (west) before setting; Jupiter 15 and 15 | needs the rising and setting, not just the distance from the Sun; not done |
| Guru–Āditya, Viśvaghasra (1.48) | other views | left out as the text calls them other views |

## The other two classics (summary of `muhurta-martanda-kalaprakasika.md`)

The two texts do not always agree with the Muhūrtacintāmaṇi, so a rule from one is not the rule of "the classics". What the comparison found:

* **Regions differ by text.** The Muhūrta Mārtaṇḍa (v. 16 of the marriage chapter) binds the Lattā to Mālava, the Pāta to Kosala and the Ekārgalā to Kashmir; the Kālaprakāśikā binds Śūla, the adhimāsa, Ekārgalā and the blind nakṣatras to the north of the Sone, Paṅgu, Andha, Kāṇa and the Śūnya month to Magadha and Gauḍa, and Samadṛṣṭi to the north of the Narmadā. The regions the app offers are the Muhūrtacintāmaṇi's alone.
* **Viṣanāḍī of the nakṣatras.** The Kālaprakāśikā gives a figure for the seven nakṣatras that the app lacked, and says they "have no Thyajyam"; the Muhūrtacintāmaṇi gives all 27 without that remark. The app now follows the Muhūrtacintāmaṇi.
* **Tārābala.** The Mārtaṇḍa (Gocara v. 1) forbids only the remainders 3, 5, 7 (the Janma tārā is not forbidden); the Kālaprakāśikā has the faults full in the first cycle of nine, half in the second and none in the third. The app counts the three cycles as one.
* **Ardhayāma and Kāla.** The app's Ardhayāma is the Mārtaṇḍa's; the Kālaprakāśikā has another table, and also the Kāla table the app says is "not in the text". The Kālaprakāśikā says Gulika is no fault.
* **Pañcaka (Bāṇa).** Both give the arithmetic (the sum of the tithi, vāra, nakṣatra and Lagna with a number for the kind, divided by 9); the app calls it dependent on the purpose and does not work it out.
* **Vedha of the nakṣatras of marriage.** The Mārtaṇḍa gives the Saptaśalākā and the rule of the pāda (v. 14, 15), which the app lists as having no definition.
* **Eclipse.** The Mārtaṇḍa's days depend on the size of the eclipse; the app's 7 and 3 days are from Wilhelm.
* **Jupiter and Venus.** Bālya and vārdhakya are 7 days each in the Mārtaṇḍa and 15, 10, 10, 8 or 7, 8, 15 in the Kālaprakāśikā; the two do not agree with each other, so they are not implemented.
* **Moon good houses.** The Mārtaṇḍa adds the 2nd, 5th and 9th in the bright half to the app's six.
