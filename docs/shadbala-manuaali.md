# Ṣaḍbala ja Bhāva Bala: miten jokainen luku lasketaan

Tämä on näkymien ANALYYSI → Bala → Ṣaḍbala ja Bhāva Bala manuaali. Se kertoo vaihe vaiheelta, miten kukin luku muodostuu, jotta kuka tahansa voi toistaa laskun käsin tai taulukkolaskennassa ja saada saman tuloksen. Jokainen vaihe on laskettu yhdelle kartalle, **vertailukartalle**, jonka luvut ovat samalla testien odotusarvot (`src/lib/shadbala.fixture.ts`). Missä lähteet ovat eri mieltä tai säkeet vaikenevat, manuaali sanoo sen ja merkitsee kohdan **valintakohdaksi** (C1, C2 …); lopun taulukko luettelee ne vaihtoehtoineen.

Mistä kukin sääntö on peräisin, säe säkeeltä, kerrotaan tiedostossa [shadbala-sources.md](shadbala-sources.md) (englanniksi). Koodi on tiedostoissa `src/lib/shadbala.ts`, `shadbalaAspects.ts`, `shadbalaCheshta.ts`, `shadbalaTime.ts` ja `bhavaBala.ts`. Englanninkielinen versio tästä manuaalista on [shadbala-manual.md](shadbala-manual.md); jos ne eroavat, korjataan molemmat.

## 0. Sopimukset

- Voimat ovat **virūpoina**. 60 virūpaa on yksi **rūpa**. Kokonaisvoima on kuuden balan summa virūpoina; rūpina se on summa jaettuna 60:llä.
- Pituusasteet ovat sideerisiä asteita 0–360 kartan ayanamsassa (Aries 0°–30° on merkki 0). Missä sääntö tarvitsee tropiikkisen (sāyana) pituuden, se on pituus plus ayanamsa.
- "Merkin järjestysnumero" on Aries 0, Taurus 1, Gemini 2, Cancer 3, Leo 4, Virgo 5, Libra 6, Scorpio 7, Sagittarius 8, Capricorn 9, Aquarius 10, Pisces 11.
- Kahden pituuden etäisyys on aina lyhyempi kaari, 0–180°.
- Planeetat ovat seitsemän grahaa. Rahulla ja Ketulla ei ole Ṣaḍbalaa, mutta ne lasketaan pahoiksi Merkuriuksen seuralaisina (§7).
- Merkkien ja grahojen nimet ovat samat englanninkieliset nimet kuin sovelluksessa.

## 1. Vertailukartta

13. lokakuuta 1987, klo 00:15 EET (UTC+2), Kotka (60,46667° N, 26,94583° E), Lahiri-ayanamsa 23,6864°. Syntymä on yöllä ennen auringonnousua, ja nouseva merkki on Cancer.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Pituus | 175,3595 | 65,1636 | 158,9588 | 198,7067 | 1,7542 | 188,8783 | 233,1488 |
| Merkki | Virgo | Gemini | Virgo | Libra | Aries | Libra | Scorpio |

Ascendentti 114,5441° (Cancer), midheaven 359,7065°, joten nadir on 179,7065° ja descendentti 294,5441°. Auringonnousu 06:45:51 ja -lasku 17:10:08 (paikallinen kellonaika), edellinen auringonnousu 17,28 tuntia ennen keskiyötä (−17,2774 h). Juliaaninen päivä 2447081,4271. Kuu on 249,80° Auringon edellä, joten se on vähenevä.

## 2. Sthāna Bala (asemavoima)

Viiden osan summa: Uccha, Saptavargaja, Ojhayugma, Kendradi ja Drekkana.

### 2.1 Uccha Bala (BPHS 27.1–2)

Grahan etäisyys sen heikkenemispisteestä jaettuna kolmella. Heikkenemispiste on korotuspiste plus 180°. Korotuspisteet ovat Sun 10° (Aries), Moon 33° (Taurus 3°), Mars 298° (Capricorn 28°), Mercury 165° (Virgo 15°), Jupiter 95° (Cancer 5°), Venus 357° (Pisces 27°), Saturn 200° (Libra 20°).

Uccha = 60 × (1 − d / 180), missä d on etäisyys korotuspisteestä.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| d | 165,36 | 32,16 | 139,04 | 33,71 | 93,25 | 168,12 | 33,15 |
| Uccha | 4,88 | 49,28 | 13,65 | 48,76 | 28,92 | 3,96 | 48,95 |

### 2.2 Saptavargaja Bala (27.2–4)

1. Etsi grahan merkki seitsemässä jakokartassa: rāśi (D1), hora (D2), drekkāṇa (D3), saptāṃśa (D7), navāṃśa (D9), dvādaśāṃśa (D12) ja triṃśāṃśa (D30). Kartat ovat samat kuin näkymässä ANALYYSI → Varga (hora on Parāśaran: parittomassa merkissä merkin ensimmäiset 15° kuuluvat Auringon horalle, Leolle, ja loput Kuun horalle, Cancerille; parillisessa merkissä toisin päin).
2. Pisteytä kukin merkki:
   - **45**, jos se on grahan oma mūlatrikoṇa, **vain rāśissa** (C3); rajat ovat Sun Leo 0–20°, Moon Taurus 3–30°, Mars Aries 0–12°, Mercury Virgo 15–20°, Jupiter Sagittarius 0–10°, Venus Libra 0–15°, Saturn Aquarius 0–20° (3.51–54).
   - **30**, jos se on yksi grahan omista merkeistä (myös mūlatrikoṇa-merkki muissa kuudessa vargassa ja rāśissa rajan ulkopuolella).
   - Muuten **yhdistetyn suhteen** mukaan merkin herraan (3.55–58): adhimitra **20**, mitra **15**, sama **10**, śatru **4**, adhiśatru **2**. Korotukselle tai heikkenemiselle ei ole omaa pistettä.
3. Laske seitsemän pistettä yhteen. Enimmäismäärä on 315. Summaa **ei** jaeta seitsemällä.

Yhdistetty suhde on luonnollinen ja tilapäinen suhde yhdessä, molemmat rāśi-kartasta:

| Luonnollinen suhde herraan | Herra on grahasta laskien 2., 3., 4., 10., 11. tai 12. merkissä (tilapäinen ystävä) | Muualla (tilapäinen vihollinen) |
|---|---|---|
| Ystävä | adhimitra | sama |
| Neutraali | mitra | śatru |
| Vihollinen | sama | adhiśatru |

Luonnolliset ystävät ovat Sun: Moon, Mars, Jupiter · Moon: Sun, Mercury · Mars: Sun, Moon, Jupiter · Mercury: Sun, Venus · Jupiter: Sun, Moon, Mars · Venus: Mercury, Saturn · Saturn: Mercury, Venus. Luonnolliset viholliset ovat Sun: Venus, Saturn · Moon: ei ketään · Mars: Mercury · Mercury: Moon · Jupiter: Mercury, Venus · Venus: Sun, Moon · Saturn: Sun, Moon, Mars. Muut ovat neutraaleja.

Esimerkki, Auringon D1: Aurinko on Virgossa, jonka herra on Mercury. Mercury on Auringolle neutraali (Auringon ystävät ovat Moon, Mars ja Jupiter ja viholliset Venus ja Saturn). Rāśissa Mercury on Librassa, yhden merkin Virgon jälkeen eli Auringosta laskien 2. paikalla, tilapäinen ystävä. Neutraali + tilapäinen ystävä = mitra, 15. Kaikkien grahojen koko lasku seuraa.

| | D1 | D2 | D3 | D7 | D9 | D12 | D30 | Summa |
|---|---|---|---|---|---|---|---|---:|
| Sun | Virgo 15 (Mercury, mitra) | Leo 30 | Taurus 10 (Venus, sama) | Leo 30 | Leo 30 | Cancer 20 (Moon, adhimitra) | Scorpio 10 (Mars, sama) | **145** |
| Moon | Gemini 10 (Mercury, sama) | Leo 20 (Sun, adhimitra) | Gemini 10 | Cancer 30 | Scorpio 15 (Mars, mitra) | Leo 20 | Aquarius 4 (Saturn, śatru) | **109** |
| Mars | Virgo 10 (Mercury, sama) | Cancer 20 (Moon, adhimitra) | Virgo 10 | Taurus 15 (Venus, mitra) | Pisces 10 (Jupiter, sama) | Sagittarius 10 | Virgo 10 | **85** |
| Mercury | Libra 10 (Venus, sama) | Cancer 2 (Moon, adhiśatru) | Aquarius 15 (Saturn, mitra) | Aquarius 15 | Pisces 4 (Jupiter, śatru) | Taurus 10 (Venus, sama) | Gemini 30 | **86** |
| Jupiter | Aries 10 (Mars, sama) | Leo 10 (Sun, sama) | Aries 10 | Aries 10 | Aries 10 | Aries 10 | Aries 10 | **70** |
| Venus | Libra **45** (mūlatrikoṇa) | Leo 10 (Sun, sama) | Libra 30 | Sagittarius 4 (Jupiter, śatru) | Sagittarius 4 | Capricorn 20 (Saturn, adhimitra) | Aquarius 20 (Saturn, adhimitra) | **133** |
| Saturn | Scorpio 10 (Mars, sama) | Leo 10 (Sun, sama) | Cancer 2 (Moon, adhiśatru) | Libra 20 (Venus, adhimitra) | Capricorn 30 | Leo 10 (Sun, sama) | Capricorn 30 | **112** |

### 2.3 Ojhayugma Bala (27.5)

15 virūpaa rāśista ja 15 navāṃśasta, kun se on grahan lajin merkissä: **Moon ja Venus parillisissa merkeissä** (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces), **kaikki muut parittomissa merkeissä** (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius). Mercury ja Saturn kuuluvat muihin; monet kirjat antavat niille molemmat lajit, mutta säe sanoo *anye*, "muut".

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Rāśi / navāṃśa | Virgo ✗ / Leo ✓ | Gemini ✗ / Scorpio ✓ | Virgo ✗ / Pisces ✗ | Libra ✓ / Pisces ✗ | Aries ✓ / Aries ✓ | Libra ✗ / Sagittarius ✗ | Scorpio ✗ / Capricorn ✗ |
| Ojhayugma | 15 | 15 | 0 | 15 | 30 | 0 | 0 |

### 2.4 Kendradi Bala (27.5)

Talon mukaan, jossa graha on (kokonaiset merkit Lagnasta): kendra (1, 4, 7, 10) **60**, panapara (2, 5, 8, 11) **30**, apoklima (3, 6, 9, 12) **15**.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Talo | 3 | 12 | 3 | 4 | 10 | 4 | 5 |
| Kendradi | 15 | 15 | 15 | 60 | 60 | 60 | 30 |

### 2.5 Drekkana Bala (27.6, 3.19)

15 virūpaa, kun graha on sen lajia vastaavassa dekaanassa: miehet (Sun, Mars, Jupiter) ensimmäisessä dekaanassa (merkin 0–10°), neutrit (Mercury, Saturn) toisessa (10–20°) ja naiset (Moon, Venus) kolmannessa (20–30°). Santhanamin tekstipainoksessa naiset ovat toisessa ja neutrit kolmannessa; sovellus seuraa sanskritia ja Ramania.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Aste merkissä | 25,4 | 5,2 | 9,0 | 18,7 | 1,8 | 8,9 | 23,1 |
| Drekkana | 0 | 0 | 15 | 15 | 15 | 0 | 0 |

### 2.6 Sthāna Balan summa

| | Uccha | Saptavargaja | Ojhayugma | Kendradi | Drekkana | **Sthāna** |
|---|---:|---:|---:|---:|---:|---:|
| Sun | 4,88 | 145 | 15 | 15 | 0 | **179,9** |
| Moon | 49,28 | 109 | 15 | 15 | 0 | **188,3** |
| Mars | 13,65 | 85 | 0 | 15 | 15 | **128,7** |
| Mercury | 48,76 | 86 | 15 | 60 | 15 | **224,8** |
| Jupiter | 28,92 | 70 | 30 | 60 | 15 | **203,9** |
| Venus | 3,96 | 133 | 0 | 60 | 0 | **197,0** |
| Saturn | 48,95 | 112 | 0 | 30 | 0 | **191,0** |

## 3. Dig Bala (suuntavoima, 27.7–8)

Jokaisella grahalla on horisontti–meridiaani-ristin piste, jossa se on voimaton, ja vastakkaisessa pisteessä täysi. Säe nimeää talon, josta voima vähennetään. Kulmat ovat kartan neljä kulmaa (C4):

| Graha | Voimaton | Täysi |
|---|---|---|
| Sun, Mars | nadir (4.) | midheaven (10.) |
| Moon, Venus | midheaven (10.) | nadir (4.) |
| Jupiter, Mercury | descendentti (7.) | ascendentti (1.) |
| Saturn | ascendentti (1.) | descendentti (7.) |

Dig = (etäisyys voimattomasta pisteestä, 0–180°) / 3. Vertailukartta: ascendentti 114,544°, nadir 179,706°, descendentti 294,544°, midheaven 359,706°.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Voimaton piste | nadir 179,71 | MC 359,71 | nadir 179,71 | desc 294,54 | desc 294,54 | MC 359,71 | asc 114,54 |
| Etäisyys | 4,36 | 65,46 | 20,75 | 95,84 | 67,20 | 170,82 | 118,60 |
| **Dig** | **1,45** | **21,82** | **6,92** | **31,95** | **22,40** | **56,94** | **39,53** |

## 4. Kāla Bala (ajallinen voima)

Natonnatan, Pakṣan, Tribhāgan, Varṣa-Māsa-Dina-Horān ja Ayanan summa. (Yuddha Balaa, grahasotaa, ei lasketa mukaan; lähteet ovat siitä ristiriidassa, eikä vertailukartan yksikään graha ole sodassa.)

### 4.1 Natonnata Bala (27.8–9)

Voima kellonajan mukaan: Sun, Jupiter ja Venus ovat vahvimmillaan keskipäivällä ja voimattomia keskiyöllä; Moon, Mars ja Saturn päinvastoin; Mercurylla on aina 60. Tunnit mitataan paikallisesta keskipäivästä, joka on todellisen auringonnousun ja -laskun puoliväli:

päivävoima = 60 × (1 − h / 12), missä h on syntymän etäisyys paikallisesta keskipäivästä tunteina, 0–12; yöllä vahvoilla grahoilla on 60 − tämä.

Vertailukartta: paikallinen keskipäivä = (6,7642 + 17,1689) / 2 = 11,9666 h; syntymä, 0,25 h, on 11,7166 h päässä; päivävoima 1,42, yövoima 58,58.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Natonnata | 1,42 | 58,58 | 58,58 | 60 | 1,42 | 1,42 | 58,58 |

### 4.2 Pakṣa Bala (27.10–11)

Kuun etäisyys Auringosta (0–180°) jaettuna kolmella on **hyvien ryhmän** (Moon, Mercury, Venus, Jupiter) voima; muilla (Sun, Mars, Saturn) on 60 miinus tämä. Kuu on tässä aina ensimmäisessä ryhmässä, vaikka se luokiteltaisiin muualla toisin. Kuun Pakṣa Balaa **ei kahdenneta** (C7).

Vertailukartta: Kuu on 249,80° edellä, eli lyhyempää kaarta 110,20° Auringosta; 110,20 / 3 = 36,73. Sun, Mars ja Saturn saavat 60 − 36,73 = 23,27.

### 4.3 Tribhāga Bala (27.12)

Päivä (auringonnoususta -laskuun) ja yö (auringonlaskusta seuraavaan auringonnousuun) jaetaan kumpikin kolmeen yhtä pitkään osaan. Osan herralla on 60: päivän kolmea osaa hallitsevat Mercury, Sun ja Saturn, yön osia Moon, Venus ja Mars. Jupiterilla on aina 60.

Vertailukartta: syntymä on ennen auringonnousua yössä, joka alkoi edellisen illan auringonlaskussa ja päättyy auringonnousuun klo 6,76; yö on 13,64 h pitkä (auringonlasku 17,17 h – seuraava auringonnousu 30,81 h), joten se alkoi 6,76 − 13,64 = −6,87 h; kolmannes on 4,55 h, ja klo 00:15 on 7,12 h sen sisällä eli toisessa kolmanneksessa: **Venus** 60 ja Jupiter 60.

### 4.4 Varṣa-Māsa-Dina-Horā Bala (27.13)

15 virūpaa vuoden herralle (abda), 30 kuukauden herralle (masa), 45 päivän herralle (vara) ja 60 tunnin herralle (hora). Säe antaa voimat; herrat löytyvät kommentaarien menetelmällä (Santhanam säkeestä 27.13, Raman artikkelit 58–63), joka antaa molempien kirjoittajien omat esimerkit:

1. **Ahargaṇa** A = 714 404 108 573 + päivät 1. tammikuuta 1860:stä (vedisen päivän siviilipäivämäärä).
2. **Vuoden** herra = viikonpäivä numero ((⌊A / 360⌋ × 3 + 1) mod 7), kun sunnuntai on 1 … lauantai 7 (jäännös 0 on lauantai).
3. **Kuukauden** herra = viikonpäivä numero ((⌊A / 30⌋ × 2 + 1) mod 7).
4. **Päivän** herra = viikonpäivä numero (A mod 7).
5. **Tunnin** herra: vedinen päivä kulkee auringonnoususta auringonnousuun, joten ennen auringonnousua syntynyt kuuluu edelliseen päivään. Tunnit lasketaan tuon päivän auringonnoususta kellotunteina; ensimmäinen tunti kuuluu päivän herralle, ja seuraavat noudattavat järjestystä Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars.

Vertailukartta: syntymä on ennen auringonnousua, joten vedinen päivä on maanantai 12. lokakuuta 1987 (A = 714 404 155 243); vuoden herra Saturn, kuukauden Mercury, päivän Moon. Syntymä on 0,25 − (−17,2774) = 17,53 h tuon päivän auringonnoususta, 18. tunti, kun lasketaan Kuusta: Moon, Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon … 18. on **Mars**.

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Herra | – | päivä | tunti | kuukausi | – | – | vuosi |
| Voima | 0 | 45 | 60 | 30 | 0 | 0 | 15 |

### 4.5 Ayana Bala (27.15–17)

1. Grahan tropiikkinen pituus λ = pituus + ayanamsa.
2. Sen deklinaatio δ säkeen taulukosta. Otetaan λ:n etäisyys x lähimmästä päiväntasauksesta (0–90°), ja ekliptikan kallistuksen 24° jaetaan neljänneksen kolmelle merkille osissa 45 : 33 : 12 (yhdeksänkymmentä osaa), merkin sisällä suhteessa interpoloiden: δ = 24° × (osat x:ään asti) / 90, pohjoiseen kun λ on 0°–180°, muuten etelään.
3. Sun, Mars, Jupiter ja Venus: Ayana = 60 × (24° + δ) / 48°; Moon ja Saturn: 60 × (24° − δ) / 48°; Mercury: 60 × (24° + |δ|) / 48°.
4. **Aurinkoa ei kahdenneta** (C6). Kirjojen kahdennus on tapa, jolla ne laskevat Auringon Cheṣṭā Balan mukaan kokonaisuuteen (§5).

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| λ | 199,05 | 88,85 | 182,65 | 222,39 | 25,44 | 212,57 | 256,84 |
| δ | −7,62 | +23,88 | −1,06 | −15,64 | +10,18 | −12,75 | −22,60 |
| Ayana | 20,48 | 0,15 | 28,68 | 49,54 | 42,72 | 14,06 | 58,24 |

Taulukko käyttää vain pituutta, ei grahan ekliptikaalista leveyttä, joten Kuulle, jonka todellinen deklinaatio on +28,7°, tulee +23,9°. Jos kartassa ei ole ayanamsaa, tilalla on todellinen deklinaatio (rajattuna väliin 0–60).

### 4.6 Kāla Balan summa

| | Natonnata | Pakṣa | Tribhāga | Abda… | Ayana | **Kāla** |
|---|---:|---:|---:|---:|---:|---:|
| Sun | 1,42 | 23,27 | 0 | 0 | 20,48 | **45,2** |
| Moon | 58,58 | 36,73 | 0 | 45 | 0,15 | **140,5** |
| Mars | 58,58 | 23,27 | 0 | 60 | 28,68 | **170,5** |
| Mercury | 60 | 36,73 | 0 | 30 | 49,54 | **176,3** |
| Jupiter | 1,42 | 36,73 | 60 | 0 | 42,72 | **140,9** |
| Venus | 1,42 | 36,73 | 60 | 0 | 14,06 | **112,2** |
| Saturn | 58,58 | 23,27 | 0 | 15 | 58,24 | **155,1** |

## 5. Cheṣṭā Bala (liikevoima, 27.18, 27.24–25)

- **Auringon** Cheṣṭā Bala on sen Ayana Bala ja **Kuun** sen Pakṣa Bala (27.18). Säkeet laskevat Cheṣṭān yhdeksi niistä kuudesta balasta, jotka lasketaan yhteen (27.25), joten nämä kaksi ovat summassa kahdesti: kerran Kālassa ja kerran tässä (C5). JHora ja Ramanin laskuesimerkki jättävät ne summasta pois; kirjat puhuvat Auringon Ayanan ja Kuun Pakṣan "kahdentamisesta", mikä on sama asia laskettuna Kālan sisällä.
- **Mars, Mercury, Jupiter, Venus ja Saturn**: cheṣṭā-kendra. Otetaan **śīghrocca** (grahan nopean liikkeen apogeum) ja vähennetään siitä grahan keski- ja todellisen pituuden keskiarvo; jos tulos on yli 180°, se vähennetään 360°:sta; jaetaan kolmella. Marsilla, Jupiterilla ja Saturnuksella śīghrocca on keskiaurinko ja grahan keskipituus on sen oma keskipituus; Mercurylla ja Venuksella keskipituus on keskiaurinko ja śīghrocca on grahan oma.

Keskipituudet ovat B. V. Ramanin taulukoiden (Kedarnath Duttin *Book of Fate*) Lahirin vyöhykkeessä: 1. tammikuuta 1900 klo 0 Ujjainin (76° E) keskiyönä keskiaurinko on 257,4568°, Mars 270,22°, Jupiter 220,04°, Saturn 236,74° sekä Mercuryn śīghrocca 164° ja Venuksen 328,51°; päivittäiset liikkeet ovat 0,98560265°, 0,52402°, 0,0830967°, 0,03344°, 4,09232° ja 1,602147°; ja Mercurylla, Jupiterilla, Venuksella ja Saturnuksella on vuosikorjaus (t = vuosi − 1900): Mercury + (6,67 − 0,00133 t), Jupiter − (3,33 + 0,0067 t), Venus − (5 + 0,001 t), Saturn + (5 + 0,001 t). Todellinen pituus siirretään ensin Lahirin vyöhykkeeseen, joten voima ei riipu kartan ayanamsasta.

Vertailukartta: 32061,138 päivää epookista.

| | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|
| Keskiaurinko | 177,000 | 177,000 | 177,000 | 177,000 | 177,000 |
| Keskipituus (Mercuryllä ja Venuksella śīghrocca) | 150,898 | 334,991 | 0,302 | 210,079 | 233,951 |
| Todellinen | 158,959 | 198,707 | 1,754 | 188,878 | 233,149 |
| Pelkistetty kendra | 22,07 | 147,14 | 175,97 | 27,14 | 56,55 |
| **Cheṣṭā** (÷ 3) | **7,36** | **49,05** | **58,66** | **9,05** | **18,85** |

(Säkeiden 27.21–23 kahdeksaa nimettyä liikettä — vakra 60, anuvakra 30 ja niin edelleen — ei käytetä: säkeet eivät anna tiloille nopeuksia, ja Santhanam osoittaa laskennassa kendraan. Testi sallii ±0,1 virūpaa Marsin–Saturnuksen JHora-vertailuissa.)

Toinen taulukko, jonka valitaan asetuksella C13, on Sūrya Siddhāntan oma: grahan keskipituus on (kalpan kierrokset ÷ 1 577 917 828 000 päivää) × Kali-yugan keskiyöstä Ujjainissa (juliaaninen päivä 588 465,5, 76° E) kulunut aika päivinä; kierroksia on keskiauringolla 4 320 000 000, Marsilla 2 296 832 000, Mercuryn śīghroccalla 17 937 060 000, Jupiterilla 364 220 000, Venuksen śīghroccalla 7 022 376 000 ja Saturnuksella 146 568 000. Vuoden 1900 alussa se antaa täsmälleen Ramanin taulukon alkuarvot (aurinko 257,457°, Mars 270,216°, Mercury 163,985°, Jupiter 220,040°, Venus 328,509°); Ramanin taulukko on sama Duttin vuosikorjauksilla lisättynä, ja Saturnuksen alkuarvo 236,74° on 2° puhtaasta 238,735°:sta. Marsilla taulukot ovat samat; auditoinnin kolmessa kartassa Mercury eroaa enintään 2,2 virūpaa, Venus 1,7, Jupiter 0,7 ja Saturn 0,5.

## 6. Naisargika Bala (27.14)

Grahan mukaan kiinteä: 60/7 kertaa 1–7 järjestyksessä Saturn, Mars, Mercury, Jupiter, Venus, Moon, Sun.

| Saturn | Mars | Mercury | Jupiter | Venus | Moon | Sun |
|---:|---:|---:|---:|---:|---:|---:|
| 8,571 | 17,143 | 25,714 | 34,286 | 42,857 | 51,429 | 60 |

## 7. Dṛg Bala (aspektivoima, 27.19, 26.6–12)

1. Jokaiselle toiselle grahalle **aspektin arvo** (sphuṭa dṛṣṭi) kulmassa: aspektoidun grahan pituus miinus aspektoivan grahan pituus, 0–360°. Yleinen taulukko (26.6–8):

   | Kulma | Arvo |
   |---|---|
   | alle 30° ja 300°:sta alkaen | 0 |
   | 30°–60° | (kulma − 30) / 2 |
   | 60°–90° | kulma − 45 |
   | 90°–120° | 30 + (120 − kulma) / 2 |
   | 120°–150° | 150 − kulma |
   | 150°–180° | 2 × (kulma − 150) |
   | 180°–300° | (300 − kulma) / 2 |

   Saturnuksella, Marsilla ja Jupiterilla on joillakin väleillä erikoisarvot, jotka korvaavat yleisen (26.9–12): Saturn 30–60°: 2(kulma − 30), 60–90°: 60 − (kulma − 60)/2, 240–270°: (kulma − 240) + 30, 270–300°: 2(300 − kulma); Mars 60–90°: 1,5(kulma − 60) + 15, 90–120°: 60 − (kulma − 90), 180–210°: 60, 210–240°: 60 − (kulma − 210); Jupiter 90–120°: (kulma − 90)/2 + 45, 120–150°: 60 − (kulma − 120), 210–240°: (kulma − 210)/2 + 45, 240–270°: 60 − (kulma − 240).
2. Aspekti on **hyvä**, jos aspektoiva graha on hyvä, ja **paha** muuten. Jupiter ja Venus ovat hyviä; Sun, Mars ja Saturn pahoja; **Kuu** on hyvä kasvaessaan ja paha vähetessään (3.11, 34.9): kirkas puolisko, uusikuu pois lukien ja täysikuu mukaan lukien, on kasvava (C1); **Mercury** on paha, kun se on samassa merkissä pahan kanssa (Sun, Mars, Saturn, Rahu, Ketu tai vähenevä Kuu), ja muuten hyvä (C2).
3. Dṛg = ¼ × (hyvien aspektien arvojen summa − pahojen arvojen summa). Mercuryn ja Jupiterin aspekteja **ei** lisätä vielä kerran kokonaisina (C8).

Vertailukartta: Kuu on vähenevä (249,8°) ja Mercury, joka on yksin Librassa Venuksen kanssa, on hyvä. Siis Jupiter, Venus ja Mercury ovat hyviä, Sun, Moon, Mars ja Saturn pahoja.

Sarakkeen grahan aspektin arvo rivin grahaan (virūpaa):

| mihin ↓ / keneltä → | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn | hyvien summa | pahojen summa | **Dṛg** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Sun | – | 34,90 | 0 | 0 | 47,21 | 0 | 0 | 47,21 | 34,90 | **3,08** |
| Moon | 25,10 | – | 16,90 | 36,77 | 18,41 | 31,86 | 53,99 | 87,04 | 95,99 | **−2,24** |
| Mars | 0 | 43,10 | – | 0 | 14,41 | 0 | 28,38 | 14,41 | 71,48 | **−14,27** |
| Mercury | 0 | 16,46 | 4,87 | – | 51,52 | 0 | 0 | 51,52 | 21,33 | **7,55** |
| Jupiter | 56,80 | 1,70 | 60,00 | 26,09 | – | 45,75 | 21,39 | 71,85 | 139,90 | **−17,01** |
| Venus | 0 | 26,29 | 0 | 0 | 56,44 | – | 0 | 56,44 | 26,29 | **7,54** |
| Saturn | 13,89 | 35,97 | 36,28 | 2,22 | 55,70 | 7,14 | – | 65,05 | 86,15 | **−5,27** |

(Esimerkiksi Kuun aspekti Saturnukseen: kulma on Saturn − Moon = 233,15 − 65,16 = 167,99°, välillä 150°–180°, joten 2 × (167,99 − 150) = 35,97. Auringon Dṛg: hyvät Jupiter 47,21, pahat Moon 34,90, joten ¼ × (47,21 − 34,90) = 3,08.)

## 8. Kokonaisvoima ja vaadittu voima

Kokonaisvoima = Sthāna + Dig + Kāla + Cheṣṭā + Naisargika + Dṛg virūpoina. Graha on vahva, kun summa yltää sen vaadittuun Ṣaḍbalaan (27.32–33): Sun 390, Moon 360, Mars 300, Mercury 420, Jupiter 390, Venus 330, Saturn 300 virūpaa. Näkymässä alle 100 % vaaditusta on heikko (✕), 120 %:iin asti kelpo (!), sen yli vahva (✓).

| | Sthāna | Dig | Kāla | Cheṣṭā | Naisargika | Dṛg | **Summa** | Vaadittu | |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Sun | 179,9 | 1,4 | 45,2 | 20,5 | 60,0 | 3,1 | **310,0** | 390 | heikko |
| Moon | 188,3 | 21,8 | 140,5 | 36,7 | 51,4 | −2,2 | **436,5** | 360 | vahva |
| Mars | 128,7 | 6,9 | 170,5 | 7,4 | 17,1 | −14,3 | **316,4** | 300 | kelpo |
| Mercury | 224,8 | 31,9 | 176,3 | 49,0 | 25,7 | 7,6 | **515,3** | 420 | vahva |
| Jupiter | 203,9 | 22,4 | 140,9 | 58,6 | 34,3 | −17,0 | **443,1** | 390 | kelpo |
| Venus | 197,0 | 56,9 | 112,2 | 9,1 | 42,9 | 7,5 | **425,6** | 330 | vahva |
| Saturn | 191,0 | 39,5 | 155,1 | 18,9 | 8,6 | −5,3 | **407,8** | 300 | vahva |

## 9. Bhāva Bala (talojen voima, 27.26–31)

Talot ovat kokonaisia merkkejä Lagna-merkistä laskien, ensimmäinen talo alkaa Lagna-merkin 0°:sta (LagnaOnen tasatalot); kunkin talon keskipiste, jonka mukaan aspektit ja Dig Bala lasketaan, on 15° merkin sisällä (C9). Vertailukartan nouseva merkki on Cancer, joten 1. talo on Cancer (keskipiste 105°), 2. Leo (135°), 3. Virgo (165°) ja niin edelleen.

Talon voima on viiden osan summa:

1. **Bhāvādhipati Bala**: merkin herran kokonaisvoima Ṣaḍbalassa virūpoina (§8).
2. **Bhāva Dig Bala** (27.26–28): talon keskipisteen etäisyys sen voimattomasta kulmasta jaettuna kolmella. Kulma riippuu merkistä: Gemini, Virgo, Libra, Aquarius ja Sagittariuksen ensimmäinen puolisko — **descendentti**; Aries, Taurus, Leo, Capricornin ensimmäinen puolisko ja Sagittariuksen toinen puolisko — **nadir**; **Cancer ja Scorpio — ascendentti** (C10); Capricornin toinen puolisko ja Pisces — **midheaven**. Koska kokonaisen merkin talon keskipiste on aina 15°, joka luetaan toiseen puoliskoon, Sagittarius lasketaan nadirin ja Capricorn midheavenin kanssa.
3. **Bhāva Dṛṣṭi Bala** (27.28–29): aspektit talon keskipisteeseen §7:n taulukon mukaan: neljännes kustakin aspektista (hyvä positiivinen, paha negatiivinen), mutta **Mercuryn ja Jupiterin kokonaan** (C8), yhteen laskettuna.
4. **Asukkaat** (27.30): +60 virūpaa (yksi rūpa) kustakin Mercuryn ja Jupiterin talossa, −60 kustakin Saturnuksen, Marsin ja Auringon. Kuu ja Venus eivät lisää mitään.
5. **Bhāva Kāla Bala** (27.31): +15 virūpaa, jos talon merkki nousee pää edellä (śīrṣodaya: Gemini, Leo, Virgo, Libra, Scorpio, Aquarius) ja syntymä on päivällä, jos se nousee molemmin päin (ubhayodaya: Pisces) ja syntymä on hämärässä, tai jos se nousee selkä edellä (pṛṣṭhodaya: Aries, Taurus, Cancer, Sagittarius, Capricorn) ja syntymä on yöllä. Hämärä on viisi ghaṭīa eli kaksi tuntia auringonnousun ja -laskun kummallakin puolella (46.44–47); päivä on muu aika niiden välillä (C11).

Vertailukartta: yösyntymä (00:15, yli kaksi tuntia auringonnoususta klo 06:46 ja -laskusta klo 17:10), joten pṛṣṭhodaya-merkit saavat 15.

| Talo | Merkki | Herra | Bhāvādhipati | Dig (mistä) | Dṛṣṭi | Asukkaat | Kāla | **Summa** |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Cancer | Moon | 436,5 | 3,18 (Asc) | 60,42 | 0 | 15 | **515,1** |
| 2 | Leo | Sun | 310,0 | 14,90 (Nadir) | 29,44 | 0 | 0 | **354,4** |
| 3 | Virgo | Mercury | 515,3 | 43,18 (Desc) | 12,40 | Sun, Mars −120 | 0 | **450,9** |
| 4 | Libra | Venus | 425,6 | 33,18 (Desc) | 47,58 | Mercury +60 | 0 | **566,4** |
| 5 | Scorpio | Mars | 316,4 | 36,82 (Asc) | 39,00 | Saturn −60 | 0 | **332,2** |
| 6 | Sagittarius | Jupiter | 443,1 | 25,10 (Nadir) | 29,26 | 0 | 15 | **512,5** |
| 7 | Capricorn | Saturn | 407,8 | 24,90 (MC) | 24,42 | 0 | 15 | **472,1** |
| 8 | Aquarius | Saturn | 407,8 | 6,82 (Desc) | 13,67 | 0 | 0 | **428,2** |
| 9 | Pisces | Jupiter | 443,1 | 4,90 (MC) | −29,09 | 0 | 0 | **418,9** |
| 10 | Aries | Mars | 316,4 | 54,90 (Nadir) | 38,75 | Jupiter +60 | 15 | **485,0** |
| 11 | Taurus | Venus | 425,6 | 44,90 (Nadir) | 37,50 | 0 | 15 | **523,0** |
| 12 | Gemini | Mercury | 515,3 | 46,82 (Desc) | 46,53 | 0 | 0 | **608,6** |

Esimerkki, 1. talo: Cancer, herra Moon, jonka Ṣaḍbala on 436,5. Cancer mitataan ascendentista (114,54°); talon keskipiste, 105°, on 9,54° päässä, joten Dig = 9,54 / 3 = 3,18. Dṛṣṭi: aspektit pisteeseen 105°, kulma 105° − grahan pituus:

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn |
|---|---:|---:|---:|---:|---:|---:|---:|
| Kulma | 289,64 | 39,84 | 306,04 | 266,29 | 103,25 | 276,12 | 231,85 |
| Arvo | 5,18 | 4,92 | 0 | 16,85 | 51,62 | 11,94 | 34,07 |
| Luonne | paha | paha | paha | hyvä | hyvä | hyvä | paha |
| Paino | ¼ | ¼ | ¼ | kokonaan | kokonaan | ¼ | ¼ |

Dṛṣṭi = −¼ × (5,18 + 4,92 + 0 + 34,07) + 16,85 + 51,62 + ¼ × 11,94 = −11,04 + 68,47 + 2,99 = 60,42. (Jupiterin arvo on sen erikoisarvo: välillä 90°–120° (103,25 − 90) / 2 + 45 = 51,62.) Cancerissa ei ole grahoja. Cancer nousee selkä edellä ja syntymä on yöllä: Kāla +15. Summa 436,5 + 3,18 + 60,42 + 0 + 15 = 515,1.

## 10. Valintakohdat

Näissä kohdissa säkeet vaikenevat tai lähteet ovat eri mieltä. "Käytössä"-sarake on oletus, sanskritin tekstin lukutapa, ja se on kunkin asetuksen ensimmäinen vaihtoehto. **Kaikki muut vaihtoehdot voi valita Bala-näkymissä kohdasta "Laskennan valinnat"** (Ṣaḍbalan ja Bhāva Balan yläpuolella; valinnat tallentuvat tähän selaimeen eivätkä muuta muuta kuin näitä kahta näkymää). C1–C11 ja C13–C16 ovat asetuksia; C6 ja C7 (Auringon Ayanan ja Kuun Pakṣan kahdennus) ovat C5:n kolmannessa vaihtoehdossa; C12 (Yuddha Bala) ei ole asetus.

| | Kysymys | Käytössä | Vaihtoehdot ja kuka niitä pitää |
|---|---|---|---|
| C1 | Milloin Kuu on paha? | Tumma puolisko ja uusikuu (Santhanam, Saravali-ohjelmiston dokumentaatio) | Hyvä kirkkaan puoliskon kahdeksannesta tithistä tumman puoliskon kahdeksanteen, muuten paha (B. V. Raman, JHora) |
| C2 | Milloin Mercury on paha? | Samassa merkissä pahan kanssa (3.11 *krūra-yuta*; teksti ei anna orbia) | Vain kun hyvät sen merkissä eivät ole pahoja useampia (P. V. R. Narasimha Rao); tai aina hyvä |
| C3 | Saptavargajan pisteet ja mūlatrikoṇa | Säkeen 45/30/20/15/10/4/2; mūlatrikoṇan 45 vain rāśissa (Raman); suhteet rāśi-kartasta (Santhanam) | Ramanin 45/30/22,5/15/7,5/3,75/1,875 (JHora); 45 kaikissa vargoissa (Santhanam, Saravali-dokumentaatio); suhteet kustakin vargasta |
| C4 | Mistä "taloista" Dig Bala mitataan | Neljä kulmaa: ascendentti, descendentti, midheaven, nadir (Santhanam, Raman) | Tasatalot Lagnasta (JHoran työpöytäversio) |
| C5 | Auringon ja Kuun Cheṣṭā Bala | Summassa, kerran Ayanana/Pakṣana Kālassa ja kerran Cheṣṭānä (27.18, 27.25) | Jätetään summasta pois (JHora, Ramanin esimerkki); tai Ayana ja Pakṣa kahdennetaan Kālassa ja Cheṣṭā-sarake jää tyhjäksi (kommentaarit) |
| C6 | Ayana Bala | Säkeen taulukon deklinaatio pituudesta, Aurinkoa ei kahdenneta | Todellinen deklinaatio (Santhanam: "nykyaikaisesta efemeridistä"); Auringon Ayana Bala kahdennettuna |
| C7 | Kuun Pakṣa Bala | Ei kahdennettu (27.10–11) | Kahdennettu (Raman art. 55, Santhanam) |
| C8 | Mercuryn ja Jupiterin aspektit (*jñejya-dṛk-yuktam*, 27.19, 27.29) | Ṣaḍbala: vain neljännes (Raman, JHora). Bhāva Bala: kokonaan neljänneksen tilalle (Raman) | Ṣaḍbala: lisätään kokonaan päälle (Santhanam, Sharma). Bhāva Bala: lisätään kokonaan neljänneksen päälle |
| C9 | Bhāva Balan talot | Kokonaiset merkit Lagna-merkistä; keskipiste 15° (LagnaOne) | Śrīpatin (Porphyry) keskipisteet ja keskipisteen merkin herra (Raman); tasatalot Lagnan asteesta |
| C10 | Cancerin voimaton kulma Bhāva Dig Balassa | Ascendentti (27.27, Santhanam, Sharma) | Midheaven yhdessä Piscesin ja Capricornin toisen puoliskon kanssa (Raman, Śrīpatin vesimerkkien ryhmittely) |
| C11 | Bhāva Balan osat; hämärä | Säkeiden 27.26–31 viisi osaa; hämärä kaksi tuntia auringonnousun ja -laskun kummallakin puolella (46.44–47) | Ramanin kolme osaa ilman asukkaita ja Kāla Balaa; muut hämärän pituudet |
| C12 | Yuddha Bala | Jätetty pois | Ramanin sääntö (Ṣaḍbalojen erotus jaettuna kiekkojen erotuksella, voittaja pienempi pituus); Saravali-dokumentaatio (voittaja suurempi pituus) |
| C13 | Cheṣṭā Balan keskipituudet | Ramanin taulukot (Dutt, vuosikorjauksineen), Lahirin vyöhykkeessä | Sūrya Siddhāntan omat kierrokset Kali-yugasta ilman korjauksia (Mars sama; Mercury enintään 2,2 virūpaa eri) |
| C14 | Dekaanien järjestys Drekkana Balassa (27.6) | Miehet, neutrit, naiset: sanskritin teksti ja Raman | Miehet, naiset, neutrit: Santhanamin (Sitaram Jhan painos) ja Sharman käännökset |
| C15 | Iṣṭa- ja Kaṣṭa-phalan kaava (28.6) | Uccha Balan ja Cheṣṭā Balan keskiarvo; Kaṣṭa on se, mikä jää kuudestakymmenestä (säe) | Kahden tulon neliöjuuri; Kaṣṭa siitä, mitä kummaltakin puuttuu kuudestakymmenestä (B. V. Raman) |
| C16 | Heikentymismerkissä oleva graha Vimśopaka Balassa (7.11, 7.24–25) | Ei mitään, kuten 7.11:ssä | Suhteen mukaiset pisteet merkin herraan, kuten muillakin merkeillä |

## 11. Valintojen muuttaminen

Ṣaḍbalan ja Bhāva Balan yläpuolella on suljettu rivi **Laskennan valinnat**. Se avaa yhden valinnan jokaiselle §10:n valintakohdalle, joka kuuluu näkymään (Bhāva Bala näyttää myös Ṣaḍbalan valinnat, koska se muodostuu herrojen Ṣaḍbalasta), lähteineen ja huomautuksineen. Kunkin ensimmäinen vaihtoehto on sanskritin lukutapa. Merkki kertoo, jos jokin valinta poikkeaa siitä, ja **Takaisin sanskritin lukutapaan** palauttaa kaikki. Tämän manuaalin vertailukartan luvut ovat sanskritin lukutavalle; JHoran valinnoilla (Kuu kahdeksannen tithin mukaan, Ramanin pisteet, tasatalot Dig Balassa, Auringon ja Kuun Cheṣṭā Bala pois summasta) sovellus antaa vertailukartalle JHoran omat Dṛg Balan ja Marsin–Saturnuksen Cheṣṭā Balan luvut, Auringon Dig Balan ja Ramanin Saptavargaja-pisteet (testattu tiedostossa `src/lib/balaOptions.test.ts`).

## 12. Miten luvun voi tarkistaa käsin

1. Ota pituudet, ascendentti, midheaven, ayanamsa, auringonnousu ja -lasku sekä syntymäaika kartan graha-taulukon alla olevalta suljetulta "calculation details" -riviltä ja itse graha-taulukosta.
2. Valitse osa, etsi sen kohta yltä ja seuraa vaiheita; jokainen kohta päättyy vertailukartan lukuihin, joten voit ensin tarkistaa menetelmäsi niitä vasten.
3. Grahan summa saadaan laskemalla sen kuusi osaa yhteen (§8); talon summa laskemalla sen viisi osaa (§9). Taulukoiden työkaluvihjeet näyttävät Sthānan ja Kālan osat.
4. Sama laskenta on testeissä: `src/lib/shadbala.test.ts` ja `src/lib/bhavaBala.test.ts`, vertailukartta tiedostossa `src/lib/shadbala.fixture.ts`.

## 13. Mitä ei ole mukana

- Yuddha Bala (C12).
- Luvun 28 loppuosa (28.7–20) §14:n Iṣṭa- ja Kaṣṭa-phalan jälkeen.
- Ṣaḍbalan osien vähimmäisvoimat (27.34–36: Jupiterille, Mercurylle ja Auringolle Sthāna 165, Dig 35, Kāla 50, Cheṣṭā 112, Ayana 30 virūpaa; Kuulle ja Venukselle 133, 50, 30, 100, 40; Marsille ja Saturnukselle 96, 30, 40, 67, 20). Näkymä näyttää vain kokonaisvoiman suhteessa vaadittuun.
- Talon vähimmäisvoima: säkeet eivät anna sellaista.
- Painos: sanskrit on yhdestä verkkopainoksesta, ja sanskritin lukijan kannattaa tarkistaa tiedoston [shadbala-sources.md](shadbala-sources.md) luettelemat säkeet.

## 14. Iṣṭa-phala ja Kaṣṭa-phala (BPHS 28.2–6)

Luku 28 muuttaa kaksi voimaa mitaksi siitä, kuinka paljon hyvää ja kuinka paljon pahaa grahan daśā todennäköisesti tuo. Se näytetään Ṣaḍbala-taulukon alla. Säkeet käyttävät "säteitä" (*raśmi*):

1. **Uccha-säde (28.2).** Grahan etäisyys heikentymispisteestään, enintään 180°, merkkeinä, plus yksi merkki, ja jäljelle jäävät asteet kaksinkertaisina (eli asteet jaettuna 30:llä). Kun säteestä vähennetään yksi ja tulos kerrotaan kymmenellä, saadaan kulma jaettuna kolmella: se on §2.1:n Uccha Bala.
2. **Cheṣṭā-säde (28.3–4).** Sama cheṣṭā-kendrasta: Marsille–Saturnukselle §5:n kendra; Auringolle sāyana-Aurinko ja kolme merkkiä (28.4); Kuulle Kuu miinus Aurinko. Kukin supistetaan enintään 180°:een; Cheṣṭā-voima on kendra jaettuna kolmella. Auringon ja Kuun Cheṣṭā ei siis ole tässä niiden Ayana Bala ja Pakṣa Bala (§5), eikä asetus C5 vaikuta siihen.
3. **Iṣṭa-phala (28.6).** Vähennä kustakin säteestä yksi, kerro kumpikin kymmenellä, laske yhteen ja puolita: tämä on **Uccha Balan ja Cheṣṭā Balan keskiarvo** virūpoina (0–60). **Kaṣṭa-phala** on se, mikä jää kuudestakymmenestä. (28.5 antaa myös "suotuisan säteen", kahden säteen summan puolikkaan, ja "epäsuotuisan säteen", sen mikä jää kahdeksasta; sovellus näyttää 28.6:n virūpa-muodon.)
4. **Kumpi on suurempi** kertoo, voittaako hyvä vai paha; säkeen kaavalla kaksi on yhteensä aina 60, joten Iṣṭa yli 30 on sama kuin Iṣṭa suurempi kuin Kaṣṭa.

**Valintakohta C15.** B. V. Raman (artikkelit 138–139) ottaa Iṣṭa-phalaksi Uccha Balan ja Cheṣṭā Balan tulon neliöjuuren ja Kaṣṭa-phalaksi sen tulon neliöjuuren, joka saadaan siitä, mitä kummaltakin puuttuu kuudestakymmenestä. Hänen kaavallaan kaksi ei ole yhteensä 60 (Ramanin Kuu: 38,13 ja 20,66). Säe on keskiarvo, joka on oletus; Ramanin kaava on valinta kohdassa "Laskennan valinnat".

**Laskettuna vertailukartalle** (viidelle grahalle Sūrya Siddhāntan keskipituudet, C13; oletuksena oleva Ramanin taulukko siirtää Mercurya ja Venusta hieman):

| Graha | Uccha | Cheṣṭā (kendra) | Iṣṭa (säe) | Kaṣṭa (säe) | Iṣṭa (Raman) | Kaṣṭa (Raman) |
|---|---:|---:|---:|---:|---:|---:|
| Sun | 4,88 | 23,65 | 14,27 | 45,73 | 10,74 | 44,76 |
| Moon | 49,28 | 36,73 | 43,01 | 16,99 | 42,55 | 15,79 |
| Mars | 13,65 | 7,36 | 10,51 | 49,49 | 10,02 | 49,39 |
| Mercury | 48,76 | 46,84 | 47,80 | 12,20 | 47,79 | 12,16 |
| Jupiter | 28,92 | 58,01 | 43,46 | 16,54 | 40,96 | 7,87 |
| Venus | 3,96 | 10,74 | 7,35 | 52,65 | 6,52 | 52,54 |
| Saturn | 48,95 | 18,33 | 33,64 | 26,36 | 29,96 | 21,46 |

Testit ovat tiedostossa `src/lib/ishtaKashta.test.ts`: Ramanin painetut esimerkit (61–64) ja auditoinnin kolme karttaa erillisellä ohjelmalla lasketuja lukuja vasten. Luvun 28 loppuosa (28.7–20: grahan merkin Iṣṭa ja Kaṣṭa pisteillä 60, 45, 30, 22, 15, 8, 4, 2 ja 0 sekä puolet niistä muissa vargoissa, Dig Balan ja Kāla Balan vastaavat ja talojen tulokset) ei ole mukana.

## 15. Vimśopaka Bala (BPHS 7.10–27)

Vimśopaka Bala kertoo, kuinka hyvin graha seisoo jakokartoissa, asteikolla 20. Se on kolmas välilehti kohdassa ANALYYSI → Bala. Graha saa pisteitä merkistä, jossa se on laskentatavan kussakin vargassa, ja jokainen varga painaa omalla painollaan 20:stä.

1. **Laskentatavat ja niiden painot (7.17–23).** Ṣaḍvarga: D1 6, D2 2, D3 4, D9 5, D12 2, D30 1. Saptavarga: D1 5, D2 2, D3 3, D7 2,5, D9 4,5, D12 2, D30 1. Daśavarga: D1 3, D60 5 ja 1,5 kullekin D2, D3, D7, D9, D10, D12, D16, D30. Ṣoḍaśavarga: D1 3,5, D9 3, D60 4, D16 2, D2, D3 ja D30 kukin 1 sekä 0,5 kullekin yhdeksälle muulle (D4, D7, D10, D12, D20, D24, D27, D40, D45). Jokainen laskentatapa on yhteensä 20. (7.18:n sanskritissa on *rama* siellä, missä Ṣaḍvargan D1:n 6:n pitäisi olla *rasa*; kolmella laskentatapa olisi yhteensä 17, joten painettu sana on lipsahdus, jonka painokset jakavat.)
2. **Merkin pisteet (7.24–25).** 20 omassa merkissä; 18 **adhimitran** (suuren ystävän) merkissä, 15 **mitran**, 10 **saman**, 7 **śatrun** ja 5 **adhiśatrun**. Suhde on Saptavargaja Balan (§2.2) yhdistetty: luonnollinen ystävyys yhdessä tilapäisen kanssa, joka luetaan rāśi-kartasta (valinta C3, jaettu Saptavargaja Balan kanssa; toinen lukutapa ottaa sen varganin omasta kartasta).
3. **Korotus ja heikentymys (7.11).** Täysi voima, 20, korotusmerkissä kuten omassa merkissä, ja ei mitään seitsemännessä siitä. Heikentymismerkissä oleva graha saa 0 (valinta C16); toinen lukutapa antaa sille suhteensa mukaiset pisteet merkin herraan, kuten muillekin merkeille.
4. **Summa.** Laskentatavan jokaiselle vargalle: paino × pisteet / 20; summa on grahan Vimśopaka Bala 20:stä.
5. **Mitä summa antaa (7.26–27).** Alle 5 ei anna tuloksia, yli 5 vähän, yli 10 kohtalaisesti ja yli 15 täydet (säkeen *tithi* on 15; auditoinnin sivuston käännös lukee sen kolmenakymmenenä). Näkymä tulostaa tämän sanan luvun viereen.

**Valintakohdat.** C3 (tilapäinen ystävyys: rāśi-kartasta, oletus, tai kunkin varganin omasta kartasta) ja **C16** (heikentymismerkki: 0 kohdan 7.11 mukaan, oletus; tai suhteen mukaiset pisteet). Vimśopaka-näkymä näyttää ne kohdassa "Laskennan valinnat".

**Laskettuna vertailukartalle** (oletuksilla):

| Graha | Ṣaḍvarga | Saptavarga | Daśavarga | Ṣoḍaśavarga |
|---|---:|---:|---:|---:|
| Sun | 15,80 | 16,55 | 13,60 | 13,65 |
| Moon | 8,95 | 10,45 | 12,75 | 10,12 |
| Mars | 9,00 | 9,62 | 10,88 | 12,00 |
| Mercury | 8,50 | 9,12 | 12,38 | 11,45 |
| Jupiter | 10,00 | 10,00 | 12,50 | 11,38 |
| Venus | 15,45 | 14,15 | 15,28 | 15,20 |
| Saturn | 12,00 | 13,25 | 14,62 | 14,18 |

Jakokartat ovat §2.2:n kuusi sekä D4, D10, D16, D20, D24, D27, D40, D45 ja D60 laskettuna niiden määritelmistä BPHS 6:ssa. Testit ovat tiedostossa `src/lib/vimsopaka.test.ts`: painot, merkin pisteet, rajat, kuudentoista vargan merkit ja jokaisen grahan neljä laskentatapaa kolmella kartalla erillistä ohjelmaa vasten. Ei mukana: merkin läpi asteittain kulkeva voima (*gṛhaviṃśopaka*, 7.11–16) ja Auringon etäisyydestä johtuva (*udayāsta*, 7.28–29).
