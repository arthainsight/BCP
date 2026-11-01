# Tājika, Praśna ja Varṣaphala: mitä klassikot sanovat ja mitä sovellus tekee

Tämä on yhteenveto 1.11.2026 tehdystä työstä (versiot v3.74–v3.76). Tarkemmat taulukot ovat tiedostoissa
`docs/tajika-nilakanthi-vs-app.md` (Tājika Nīlakaṇṭhī ja Praśna) ja `docs/phaladipika-vs-app.md` (transitit).
Tämä tiedosto kokoaa ne yhteen ja kertoo, mihin voi luottaa ja mihin ei.

## 1. Lähteet ja niiden luettavuus

| Teksti | Mitä käytin | Luettavuus |
|---|---|---|
| Tājika Nīlakaṇṭhī (Nīlakaṇṭha, 1500-luku), sanskrit + Mahīdharan hindi-kommentaari | koko Varṣa- ja Praśna-tantra | OCR painetusta devanagarista: jakeet usein luettavissa, kommentaari heikommin. Osa kohdista (Dvādaśavargī, Yamayā, Maṇaū) on liian rikki |
| Phaladīpikā (Mantreśvara), sanskrit + hindi | luku 26 (gochara) | hyvä tekstikerros |
| Praśna Mārga (Nārāyaṇan Nambūdiri, 1649), osa 1 | – | **liian huono OCR**, ei käytetty. Praśna on tehty Tājika-tekstistä, ei Kerala-perinteestä |

Tärkeä rajaus: testit todistavat, että koodi tekee sen, mitä tässä kuvataan. Ne eivät todista, että tulkintani painetusta tekstistä
on oikea. Siksi jokaisessa kohdassa alla on merkitty, onko se luettu selvästi vai luettu jonkin verran epävarmasti.

## 2. Varṣaphala (vuosikartta)

| Asia | Teksti | Sovellus |
|---|---|---|
| Pañcavargīya Bala (Kṣetra 30, Uccha 20, Hadda 15, Drekkāṇa 10, Navāṁśa 5; oma täysi, ystävä ¾, neutraali ½, vihollinen ¼; summa ÷ 4) | luettu selvästi | **vastaa tekstiä** (oli jo ennestään) |
| Pañcādhikārī (viisi virkamiestä: syntymälagnan herra, vuosilagnan herra, Munthan herra, Tri-rāśin herra, päivävuodella Auringon / yövuodella Kuun merkin herra) | luettu: se, joka katsoo lagnaa, on vuoden herra; jos useita, se jolla on enemmän katseita tai voimaa | **sopii pääpiirteissään**: sovellus valitsee Pañcavargīya Balalla vahvimman niistä, jotka katsovat lagnaa. Sanasta sanaan tekstin sääntö on "enemmän katseita, tasatilanteessa voima" – tätä en ole erikseen testannut |
| **Pātyāṁśī daśā** (Varṣatantra 1–3): Lagna ja grahat merkkiensä asteiden mukaan pienimmästä; kunkin osuus on sen asteet miinus edellisen asteet; summa = suurimmat asteet; vuosi jaetaan suhteessa | luettu selvästi | **uusi v3.75**. Tämä on Nīlakaṇṭhan oma daśā |
| Mudda daśā | Mahīdhara kuvaa sen kommentaarissa ("kaikkien käyttöön"), ei Nīlakaṇṭha | oli sovelluksessa; teksti nyt kertoo, että se on kommentaarin daśā |
| Muut vuosidaśāt (Tāsīra, Bhāva-tāsīra, Kālahorā, Hadda, Naisargika, Tanubhāva, Balarāma-, Gaurī-, Rāma-mata) | vain nimet kommentaarissa | **ei tehty** |
| Māsa-praveśa: Aurinko (n−1) merkkiä syntymäpaikkansa jälkeen; Dina-praveśa: (n−1) astetta | luettu selvästi | **uusi v3.75**: kartta 12 kuukaudelle ja 360 päivälle |
| Kuukauden virkamiehet (kuusi) | luettu: kuukauden lagnan, Munthan, syntymälagnan ja vuosilagnan herrat sekä Tri-rāśin ja Auringon/Kuun merkin herrat; "se joka on enemmän" on herra | **uusi**. Mikä tekee yhden "enemmästä", ei kerro mikään lukemani kohta, joten merkitsen vahvimman Pañcavargīya Balalla ja sanon sen sovelluksen mittariksi |
| Kuukauden Muntha | kommentaarin mukaan vuoden Muntha + 2°30′ kutakin kuukautta kohti ("kuukauden numero") | **tulkinta**: (n−1)×2°30′, jolloin 12. kuukauden loppu osuu seuraavan vuoden Munthaan. Tämä on minun lukuni, ei varma |
| Kuukauden ja päivän tulokset, päivän seitsemän virkamiestä | osin luettu | **ei tehty** |
| Harṣa Bala | ei löydy tästä tekstistä millään kirjoitusasulla | **ei tehty** (kuuluu toisiin Tājika-kirjoihin) |
| **Dvādaśavargī** (12 vargaa; hyvien herrojen enemmistö = hyvä vuosi) | tekstissä (jakeet 41–47), mutta daśāṁśa ja ekādaśāṁśa rikki | **ei tehty**: kahden vargan arvaaminen rikkoisi laskennan |

## 3. Praśna (kysymys)

Tekstin idea: kartta kysymyksen hetkelle ja paikalle. Lagnan herra edustaa kysyjää, asian talon herra asiaa.
Tapahtuuko se, riippuu herrojen välisistä Tājika-yogista.

| Yoga | Ehto (kommentaarin mukaan) | Sovellus |
|---|---|---|
| Ithasāla | nopeampi graha on hitaamman takana merkkinsä asteissa, merkit ovat Tājika-aspektissa (yhtymä, 3/11, 4/10, 5/9, 7) ja hitaampi on nopeamman dīptāṁśan sisällä; asia toteutuu, päivät = asteiden ero × 12 | tehty |
| Īśarāpha | nopeampi on mennyt asteen tai enemmän ohi; asia kääntyy pois | tehty |
| Nakta | herroilla ei ole aspektia; kolmas, kumpaakin nopeampi graha asteiden välissä katsoo molempia dīptāṁśansa sisällä ja siirtää valon; asia tulee toisen kautta | tehty |
| Kambūla | herrojen Ithasāla + Kuun Ithasāla toisen tai molempien kanssa; Kuun luokka (uttama jne.) | tehty lyhennettynä (uttama / adhama / sama; keskiluokka puuttuu, koska teksti on siinä rikki) |
| Yamayā, Maṇaū, Ikkavāla, Indūvāra | luettu toisesta painoksesta (Naval Kishore, hindi-kommentaari Shaktichar Shukla): jakeet 2.17 ja 2.28–35 selvät | **tehty v3.89** |
| Gairikambūla, Khallāsara, Radda, Duphāli-kuttha, Duttotthadavīra, Tambīra, Kuttha, Duruppha ja Kambūlan 16 lajia | luettavissa samassa painoksessa | **ei vielä tehty** |

Dīptāṁśat: Aurinko 15, Kuu 12, Mars 8, Merkurius 7, Jupiter 9, Venus 7, Saturnus 9 (jotkut antavat kaikille 12).

**Käyttö:** laske kartta kysymyksen hetkelle ja paikalle → ANALYYSI → Praśna → valitse talo (esim. 7 = puoliso/kauppa, 10 = työ).
Paneeli näyttää kaksi herraa ja lauseen siitä, mitä yogaa niiden välillä on.

## 4. Transitit (Phaladīpikā 26)

Taulukko Gochara-näkymässä (v3.74): missä merkin osassa graha antaa tuloksensa, nakṣatran luku syntymänakṣatrasta
raajoineen, lattā, vedha, vaaralliset paikat ja mitätöinnit. Lisäksi v3.73:ssa tuli vedha Kuusta laskettuihin suotuisiin taloihin.

Ristiriita tekstissä: Merkurius 4. talossa on hyvä kohdassa 26.2 ja pahin kohdassa 26.34. Sovellus näyttää molemmat.
Ei tehty: saṅkrānti-, pimennys- ja graha-sotapäivät (26.29).

## 5. Avoimet kohdat

1. **Ithasālan orbi.** Kommentaari sanoo: nopeamman dīptāṁśa. Teksti saattaa tarkoittaa myös kahden dīptāṁśan puolisummaa (yleinen Tājika-käytäntö). Käytössä on kommentaarin lukutapa.
2. **Takaperoinen graha** nopeampana/hitaampana: teksti ei sano luettavasti; käytetään nopeuden itseisarvoa.
3. **Antardaśojen järjestys** Pātyāṁśīssa: lukemissani riveissä ei sanota; sama kuin muissa paneelin daśoissa (alkaa daśān herrasta).
4. **Kuukauden Muntha** (n−1) vai n kertaa 2°30′.
5. Kopio, jossa Dvādaśavargī-taulukot ovat luettavissa (löytyi toinen painos, jossa jakeet ja selitykset ovat luettavissa mutta taulukot eivät), ja kunnollinen Praśna Mārga.

## 6. Mitä seuraavaksi kannattaa tehdä

1. **Etsi parempi Tājika Nīlakaṇṭhī -kopio** (toinen painos tai käsikirjoitus). Se avaisi Dvādaśavargīn, Yamayān, Maṇaūn ja ehkä Harṣa Balan kerralla.
2. **Anna minun tarkistaa Pañcādhikārī-sääntö sanasta sanaan** (enemmän katseita, sitten voima) ja testata se. Tämä on pieni työ ja muuttaisi vain tasatilanteita.
3. **Yhteensopivuus (Ashta Kuta, Rajju, Vedha)** on Kalan suurin aukko sovelluksessa ja eri aihe kuin tämä; lähteet ovat valmiina.
4. Jos haluat käyttää Praśnaa oikeasti: kokeile tunnetulla kysymyksellä, jonka vastaus tiedät jälkikäteen, ja katso, osuuko Ithasāla/Īśarāpha. Se on ainoa tapa nähdä, onko tulkinta järkevä.
