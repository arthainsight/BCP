# The Phaladīpikā's chapters 6 and 7 (the yogas) against the yogas of the app

Chapter 6 of the Phaladīpikā of Mantreśvara (rāja-yoga-bheda, 70 verses) and chapter 7 (mahārāja-yoga-bheda, 30 verses) are the book's list of yogas. This is a comparison with the 99 yogas that ANALYSIS → Grahas computes (`src/lib/yogas.ts`, `yogasClassical.ts`, `yogasBphs.ts`).

**How it was done.** The Sanskrit of the verses is in the text layer of a scan (`phaldipika_202310`) with the Hindi commentary of the edition beside it; the definitions below are read from the verses and that commentary (and checked against the Sanskrit lines where the commentary is short). The app's side is read from the rule text and the code of each yoga.
It is a comparison of *definitions*, not of results: no chart was run against another program. Chapter 7 was read at the level of the commentary's summary of each verse and not verse by verse in the Sanskrit.

## 1. In the app, and the definition agrees

| Phaladīpikā | Yoga | App |
|---|---|---|
| 6.1-3 | Ruchaka, Bhadra, Hamsa, Mālavya, Śaśa: Mars, Mercury, Jupiter, Venus, Saturn in own sign or exaltation in a kendra | `ruchaka`, `bhadra`, `hamsa`, `malavya`, `shasha` (from the lagna; see 2.1) |
| 6.5-6 | Sunaphā, Anaphā, Durudhurā, Kemadruma: the grahas other than the Sun in the 2nd, the 12th, both, or neither from the Moon | `sunapha`, `anapha`, `durudhara`, `kemadruma` (the eligible grahas are Mars, Mercury, Jupiter, Venus, Saturn: the same) |
| 6.5 | Kemadruma is cancelled by a graha with the Moon or in a kendra from it | `kemadruma-bhanga` |
| 6.7-9 | Vesi (2nd from the Sun), Vosi/Vāsi (12th), Ubhayacarī (both) | `vesi`, `vosi`, `ubhayachari` (see 2.2) |
| 6.12-13 | Amalā: a benefic in the 10th from the lagna or from the Moon | `amala-lagna`, `amala-moon` |
| 6.14 | Adhama, Sama, Variṣṭha: the Moon in a kendra, paṇaphara or āpoklima from the Sun | `adhama`, `sama`, `varishta` |
| 6.16 | Kesarī (Gajakesarī) | `gajakesari` |
| 6.17 | Śakaṭa (both of the forms the commentary names: all grahas in the lagna and 7th; the Moon in the 6th or 8th from Jupiter) | `nabhasa-sakata`, `sakata` |
| 6.39-41 | The seven saṅkhyā yogas: Vīṇā, Dāma, Pāśa, Kedāra, Śūla, Yuga, Gola | `nabhasa-veena`, `-dama`, `-pasha`, `-kedara`, `-shoola`, `-yuga`, `-gola` |
| 6.42-43 | Adhi: the benefics in the 6th, 7th and 8th from the lagna or the Moon | `adhi` (from the Moon only; see 2.4) |
| 7.26-30 | Nīcabhaṅga rāja-yoga (several readings of "the lord of its exaltation") | `neecha-bhanga` |

## 2. In the app, but the app takes it narrower or differently

1. **The five mahāpuruṣa yogas from the Moon (6.4).** The verse says "of the lagna and of the Moon" (`lagnendvor api yogapañcakam`): the five yogas are read from the Moon too, and the *number* of them tells the rank: one gives fortune, two a king's wealth, three a king, four an emperor, five the lord of the earth. The app reads them from the lagna only and does not count them.
2. **Śubha and aśubha Vesi, Vāsi and Ubhayacarī (6.8-6.11).** The verse splits each by the grahas in it: benefics (Mercury, Jupiter, Venus) give the good results, malefics the bad; mixed give mixed (6.13). The app's three yogas say only which grahas flank the Sun, without the split.
3. **Vasumat (6.19, "all benefics in the upacayas from the lagna or the Moon") against the app's Vasumati (BPHS 37.6, the count of three, two or one of Jupiter, Venus and Mercury in the upacayas from the Moon).** The two are different yogas under nearly one name.
4. **Adhi (6.42-43).** The Phaladīpikā reads it from the lagna as well as the Moon; the app, from the Moon only. The results by rank (a leader, a minister, a king) are the same in both.
5. **Lakṣmī (6.21).** The Phaladīpikā: Venus and the lord of the 9th, each in its own sign or exaltation, in a kendra or trine. The app (BPHS): the 9th lord alone in a kendra in its own or exalted sign, with a strong lagna lord. The commentary of the edition itself says the other books differ.
6. **Cāmara, Musala, Pārijāta, Chatra, Śrīnātha, Mālā: the same names, other yogas.** Chapter 6 uses these names for yogas the app has under other definitions, so a person who reads "Cāmara" in the app and in the Phaladīpikā reads two yogas:
   * **Cāmara, Dhenu, Śaurya, Jalādhi, Chatra, Astra, Kāma, Āsura, Bhāgya, Khyāti, Pārijāta, Musala (6.44)** are not twelve single yogas but the twelve *houses*: for each house from the lagna, a benefic joined to or seeing it, and its lord bright (not combust), in its own or exalted sign or in a kendra or trine, makes that house's yoga (the 1st Cāmara, the 2nd Dhenu, ... the 12th Musala). The app's `chamara`, `parijata`, `nabhasa-chatra` and `nabhasa-musala` are other yogas (the lagna lord exalted in a kendra seen by Jupiter; the dispositors of the lagna lord; the seven grahas in seven houses; the fixed signs).
   * **Śrīnātha (6.28):** Venus, Mercury and the 9th lord in kendras or trines in good signs; the app's `srinatha` is the 7th lord in the 10th with an exalted 10th lord.
   * **Mālā (6.21):** benefics in a row in the 5th, 6th and 7th (Śubhamālā) or the 6th, 8th, 12th (Aśubhamālā); the app's `nabhasa-maala` is the benefics in three kendras.
7. **Harṣa, Sarala and Vimala (6.57, 6.63, 6.65, 6.69).** The Phaladīpikā's twelve yogas are one for each house: the house joined or seen by a malefic *and* its lord in the 6th, 8th or 12th. For the 6th, 8th and 12th (Harṣa, Sarala, Vimala) the result is good, as the viparīta yogas are. The app's `harsha`, `sarala` and `vimala` ask only that the lord of the 6th, 8th or 12th stand in the 6th, 8th or 12th, without the clause that the house itself is afflicted. The app's rule is the looser of the two.

## 3. Not in the app

From chapter 6:

* **Mahābhāgya (6.14-15):** by day, a man with the lagna, the Sun and the Moon all in odd signs; by night, a woman with them all in even signs.
* **Puṣkala (6.19-20):** the lagna lord and the Moon-sign lord in an adhimitra sign or a kendra, with the lagna seen by a strong benefic.
* **Śubhamālā and Aśubhamālā (6.21-23):** see 2.6.
* **Gaurī (6.21, 25):** the Lakṣmī condition of 2.5 with the Moon in its own or exalted sign in a kendra or trine, seen by Jupiter.
* **Sarasvatī (6.26-27):** Venus, Jupiter and Mercury in kendras, trines or the 2nd, with Jupiter in its own, exalted or a friend's sign and strong.
* **Śrīkaṇṭha and Viriñci (6.28):** the lagna lord, the Sun and the Moon (Śrīkaṇṭha) or Jupiter, the Sun and the 5th lord (Viriñci) in kendras or trines in own, exalted or friend's signs.
* **Śaṅkha (6.37, in the Phaladīpikā's form):** the lord of a kendra with the lord of a trine in a good place. (The app has `shankha`, the BPHS form; the two differ.)
* **The twelve house yogas of 6.44** (Cāmara to Musala, as the houses; see 2.6) and **the nine bad house yogas of 6.57** (Ava, Niḥsva, Mṛti, Kuhū, Pāmara, Duṣkṛti, Nirbhāgya, Durdoga, Daridra; the other three are in 2.7).

From chapter 7 (the mahārāja yogas; the app has none of them as such):

* Three, five or more grahas in their own or exalted signs in kendras (7.1-2); one graha, even fallen and retrograde, in a good house (7.3); two, three, four or five grahas with directional strength (7.4); a varga-uttama lagna or the Moon in it seen by four grahas (7.5-6); the bright Moon in its own or exalted sign seen by an exalted or own-sign graha (7.7);
  Venus in Aśvinī in the lagna seen by three grahas (7.8); Mars in a fire-sign lagna seen by friends (7.9); the combinations of a full Moon, of the Moon in Pisces or Cancer, of the Moon in a water navāṁśa and others that produce a king from a humble birth (7.10-23); the four rāja yogas of 7.24 (malefics in the 3rd, 6th and 11th from the lagna lord and so on);
  one of the lords of the 11th, 9th and 2nd in a kendra from the Moon, with Jupiter as the lord of the 5th or 11th (7.25; as the commentary has it).

## 4. What it would be worth doing, in order

1. **The Moon's five mahāpuruṣa yogas and their count** (2.1). One verse, a small change, and it answers a question the table gets wrong today (the table shows a chart with the Moon's Ruchaka as having none).
2. **Śubha and aśubha Vesi, Vāsi, Ubhayacarī** (2.2): the split is in the verse and the app already knows which grahas are benefic.
3. **Mahābhāgya** and **Puṣkala** (3): two rules each, no new data.
4. **The twelve house yogas of 6.44 and the twelve of 6.57** (with Harṣa, Sarala and Vimala made as the verse has them): 24 rules of one form (a house, its lord, the benefics or malefics on it). They fit the topic yogas better than the yoga table, because they are about a house; it would be a topic of its own, "The yogas of the houses (Phaladīpikā 6)".
5. **The mahārāja yogas of chapter 7** as a topic, as the rules need the Moon's brightness, the directional strength and the varga-uttama navāṁśa, all of which the app computes.
6. **The names (2.6)**: whatever is built, the table should say which book a yoga's definition is from, since Cāmara, Musala, Pārijāta, Lakṣmī, Śrīnātha, Śaṅkha and Mālā exist in two forms.

What is *not* worth doing yet: the Sārāvalī's counts of the forms of Sunaphā and Anaphā (31) and Durudhurā (180), which the commentary quotes (6.5), because they add a name to a fact the table already shows (which grahas are there).
