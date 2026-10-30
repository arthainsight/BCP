// The user guide: questions and answers in both languages, in sections. The help page (/help) shows them;
// kept apart from the interface strings in i18n.ts because the answers are whole paragraphs.

import type { Language } from './i18n';

export interface Bilingual<T> {
  en: T;
  fi: T;
}

export interface FaqSection {
  id: string;
  title: Bilingual<string>;
}

export interface FaqEntry {
  /** Used in the address (/help#id), so it never changes. */
  id: string;
  section: string;
  q: Bilingual<string>;
  /** The answer, one string for each paragraph. */
  a: Bilingual<string[]>;
}

export const FAQ_SECTIONS: FaqSection[] = [
  { id: 'start', title: { en: 'Getting started', fi: 'Alkuun' } },
  { id: 'charts', title: { en: 'The chart', fi: 'Kartta' } },
  { id: 'timing', title: { en: 'Timing', fi: 'Ajankohta' } },
  { id: 'analysis', title: { en: 'Analysis', fi: 'Analyysi' } },
  { id: 'library', title: { en: 'Library and research', fi: 'Kirjasto ja tutkimus' } },
  { id: 'palm', title: { en: 'Palm', fi: 'Kämmen' } },
  { id: 'workspace', title: { en: 'Screen layout and recording', fi: 'Näytön asettelu ja tallennus' } },
  { id: 'data', title: { en: 'Saving, backup and privacy', fi: 'Tallennus, varmuuskopio ja yksityisyys' } },
  { id: 'settings', title: { en: 'Settings and calculations', fi: 'Asetukset ja laskenta' } },
  { id: 'trouble', title: { en: 'When something does not work', fi: 'Kun jokin ei toimi' } },
];

export const FAQ_ENTRIES: FaqEntry[] = [
  // ── Getting started ────────────────────────────────────────────────
  {
    id: 'what-is',
    section: 'start',
    q: { en: 'What is bhrigu.code?', fi: 'Mikä bhrigu.code on?' },
    a: {
      en: [
        'bhrigu.code is a Jyotish (Vedic astrology) calculator and a palmistry workbench in one browser app. It calculates sidereal charts with whole-sign houses, the BCP (Bhrigu Chakra Paddhati) year and month, many daśā systems, transits, divisional charts and a set of analysis tools, and it lets you mark up photographs of palms.',
        'It is made by Riku Forsell. It runs in the browser: there is nothing to install and no account to make.',
      ],
      fi: [
        'bhrigu.code on Jyotish-laskin (vedic-astrologia) ja kämmenlukijan työpöytä samassa selainsovelluksessa. Se laskee sideeriset kartat kokonaisilla merkkitaloilla, BCP-vuoden ja -kuukauden (Bhrigu Chakra Paddhati), monia daśā-järjestelmiä, transiitteja, jakokarttoja ja joukon analyysityökaluja, ja sillä voi piirtää merkintöjä kämmenten valokuviin.',
        'Sovelluksen on tehnyt Riku Forsell. Se toimii selaimessa: mitään ei tarvitse asentaa eikä tiliä tarvitse luoda.',
      ],
    },
  },
  {
    id: 'first-chart',
    section: 'start',
    q: { en: 'How do I calculate a chart?', fi: 'Miten lasken kartan?' },
    a: {
      en: [
        'Open the data panel (on a phone, the Data tab at the bottom). Enter the birth date and time, type the birth city and press lookup, then pick the place from the list. The coordinates and the time zone are filled in, with the daylight saving time of that date.',
        'Press Calculate Chart. The chart appears in CHART, and TIMING, ANALYSIS and the rest work from it. Change the data and press Calculate Chart again to see another chart.',
      ],
      fi: [
        'Avaa tietopaneeli (puhelimessa alareunan Tiedot-välilehti). Anna syntymäaika ja kellonaika, kirjoita syntymäkaupunki ja paina hae, ja valitse paikka listasta. Koordinaatit ja aikavyöhyke täyttyvät, kesäaika sen päivän mukaan.',
        'Paina Laske kartta. Kartta tulee KARTTA-näkymään, ja AJANKOHTA, ANALYYSI ja muut toimivat sen pohjalta. Muuta tietoja ja paina Laske kartta uudelleen nähdäksesi toisen kartan.',
      ],
    },
  },
  {
    id: 'time-zone',
    section: 'start',
    q: { en: 'How is the time zone worked out, and how do I correct it?', fi: 'Miten aikavyöhyke selvitetään ja miten sen voi korjata?' },
    a: {
      en: [
        'The city lookup gives the coordinates and the time zone of the place, and the UTC offset is taken for the birth date, so daylight saving time is included. Under the birth date a single line shows the coordinates, the time zone and the UTC offset.',
        'If the offset is wrong (an old date, or a place whose clocks were changed), press the edit button on that line. It opens the latitude, longitude and UTC offset fields. Type the offset in hours, for example 5.5 for India or 2 for Finland in winter; leave it blank for the automatic one. The line warns you when the offset has been set by hand.',
      ],
      fi: [
        'Kaupunkihaku antaa paikan koordinaatit ja aikavyöhykkeen, ja UTC-ero otetaan syntymäpäivän mukaan, joten kesäaika on mukana. Syntymäajan alla yksi rivi näyttää koordinaatit, aikavyöhykkeen ja UTC-eron.',
        'Jos ero on väärin (vanha päivämäärä tai paikka, jonka kelloja on muutettu), paina rivin muokkauspainiketta. Se avaa leveys-, pituus- ja UTC-ero-kentät. Kirjoita ero tunteina, esimerkiksi 5.5 Intialle tai 2 Suomelle talvella; jätä tyhjäksi, niin ero on automaattinen. Rivi varoittaa, kun ero on asetettu käsin.',
      ],
    },
  },
  {
    id: 'unknown-time',
    section: 'start',
    q: { en: 'What if I do not know the birth time?', fi: 'Entä jos en tiedä syntymäaikaa kellonajan tarkkuudella?' },
    a: {
      en: [
        'The ascendant, the houses, the divisional charts and the daśā timing all depend on the exact time, and the Moon moves about 13 degrees a day, so a wrong time moves them. Treat everything that depends on the ascendant or the Moon with care until the time is known.',
      ],
      fi: [
        'Lagna, talot, jakokartat ja daśā-ajoitus riippuvat tarkasta kellonajasta, ja Kuu liikkuu noin 13 astetta vuorokaudessa, joten väärä aika siirtää niitä. Suhtaudu varauksella kaikkeen, mikä riippuu lagnasta tai Kuusta, kunnes aika tunnetaan.',
      ],
    },
  },

  // ── The chart ──────────────────────────────────────────────────────
  {
    id: 'chart-style',
    section: 'charts',
    q: { en: 'North Indian, South Indian or both?', fi: 'North Indian, South Indian vai molemmat?' },
    a: {
      en: [
        'The N, S and N+S buttons above the chart choose the style. N is the North Indian diamond, S the South Indian square with fixed signs, and the third shows both at once, the North chart inside and the South chart around it. The choice is remembered.',
        'The text size of the full-size charts can be changed with the text size slider in the chart display menu (the ··· button); in North + South both charts get the same size of text.',
      ],
      fi: [
        'Kartan yläpuolen N-, S- ja N+S-painikkeet valitsevat tyylin. N on pohjoisintialainen salmiakki, S eteläintialainen neliö kiinteillä merkeillä, ja kolmas näyttää molemmat yhtä aikaa: North-kartta sisällä ja South-kartta ympärillä. Valinta muistetaan.',
        'Täysikokoisten karttojen tekstin kokoa voi muuttaa kartan näyttö -valikon (··· -painike) tekstikoko-liukusäätimellä; North + South -kartassa molempien tekstit ovat samankokoisia.',
      ],
    },
  },
  {
    id: 'mixed-chart',
    section: 'charts',
    q: { en: 'What is the mixed chart, and how do I choose the varga in it?', fi: 'Mikä on sekoitettu kartta ja miten valitsen siihen vargan?' },
    a: {
      en: [
        'MIX N and MIX S, beside N, S and N+S, draw two charts in the same houses. A square in the middle, three quarters of the chart, belongs to the D1 chart: the part of every house inside it holds the planets of the D1 chart, and the part outside it, the band around, holds the planets of a varga chart, the navamsa (D9) to begin with. The list beside the buttons, outer chart, has every varga from the hora (D2) to the shashtiamsa (D60). MIX N is in the North Indian layout, where the houses are counted from the D1 lagna, and MIX S in the South Indian one, where the signs stay in their places and the names of the two charts are in the middle.',
        'A planet is always in the sign it is in, in each of the charts, so the same house shows where it stands in D1 and where in the varga. A graha tapped on either chart is marked on both. The divisional buttons are not used in these styles. The style and the varga are kept, and they can also be chosen in Settings → display → chart style. The client report draws the mixed chart as well.',
      ],
      fi: [
        'MIX N ja MIX S, N-, S- ja N+S-painikkeiden vieressä, piirtävät kaksi karttaa samoihin taloihin. Keskellä oleva neliö, kolme neljännestä kartasta, kuuluu D1-kartalle: jokaisen talon sen sisään jäävä osa sisältää D1-kartan planeetat, ja sen ulkopuolinen osa, ympärillä oleva kehä, varga-kartan planeetat, aluksi navamsan (D9). Painikkeiden vieressä oleva lista, ulompi kartta, sisältää jokaisen vargan horasta (D2) śaṣṭiaṁśaan (D60). MIX N on North Indian -asettelussa, jossa talot lasketaan D1-lagnasta, ja MIX S South Indian -asettelussa, jossa merkit pysyvät paikoillaan ja kahden kartan nimet ovat keskellä.',
        'Planeetta on kummassakin kartassa aina siinä merkissä, jossa se on, joten sama talo näyttää, missä se on D1:ssä ja missä vargassa. Kummalta tahansa kartalta napautettu graha merkitään molemmille. Jakokarttapainikkeita ei käytetä näissä tyyleissä. Tyyli ja varga muistetaan, ja ne voi valita myös kohdasta Asetukset → näyttö → chart style. Asiakasraportti piirtää myös sekoitetun kartan.',
      ],
    },
  },
  {
    id: 'divisional',
    section: 'charts',
    q: { en: 'How do I see the divisional charts (vargas)?', fi: 'Miten näen jakokartat (vargat)?' },
    a: {
      en: [
        'Above the chart are the D buttons, D1 (the rāśi chart) and so on. Press one to show that chart; press several to see them side by side. Hover over a button to see the name of the varga and what it signifies. The + more list holds the rest of the vargas. The last chart cannot be switched off, so there is always something to see.',
      ],
      fi: [
        'Kartan yläpuolella ovat D-painikkeet, D1 (rāśi-kartta) ja niin edelleen. Paina yhtä näyttääksesi sen kartan; paina useita nähdäksesi ne vierekkäin. Vie osoitin painikkeen päälle nähdäksesi vargan nimen ja merkityksen. + lisää -lista sisältää loput vargat. Viimeistä karttaa ei voi sammuttaa, joten jotakin on aina näkyvissä.',
      ],
    },
  },
  {
    id: 'layers',
    section: 'charts',
    q: { en: 'What can I show on the chart?', fi: 'Mitä kartalle voi näyttää?' },
    a: {
      en: [
        'Press the ··· button above the chart (chart display) for the chart layers: the BCP year and month, the dasha lords, the dasha houses, the transit, the RSN major and minor and the Paraya grahas (Jupiter, Saturn, Ketu, Rahu). The same menu has the arudha padas, the upagrahas and karakamsa, and the labels: nakshatra, karaka, outer planets and special lagnas.',
        'Each layer is switched on and off on its own, and the choices are remembered. The ⤢ full button of the chart shows it on the whole screen.',
      ],
      fi: [
        'Paina kartan yläpuolen ··· -painiketta (kartan näyttö) karttojen kerroksia varten: BCP-vuosi ja -kuukausi, daśā-herrat, daśā-talot, transiitti, RSN major ja minor sekä Paraya-grahat (Jupiter, Saturnus, Ketu, Rahu). Samassa valikossa ovat arudha-padat, upagrahat ja karakamsa sekä nimiöt: nakshatra, karaka, ulkoplaneetat ja erikoislagnat.',
        'Jokainen taso kytketään päälle ja pois erikseen, ja valinnat muistetaan. Kartan ⤢ full -painike näyttää sen koko ruudulla.',
      ],
    },
  },
  {
    id: 'paraya',
    section: 'charts',
    q: { en: 'What are the Paraya grahas?', fi: 'Mitä ovat Paraya-grahat?' },
    a: {
      en: [
        'The Paraya grahas Jupiter, Saturn, Ketu and Rahu are moved through the signs by age and shown on the chart. The paraya chips in the chart display menu choose them one at a time or all together. In Settings → calculations you choose how long Saturn and Rahu stay in each sign; either way a round takes 30 years for Saturn and 18 for Rahu. TIMING → Paraya lists when they reach a natal graha or the ascendant.',
        'Where a Paraya graha begins: every one of them at its natal degree, Jupiter, Saturn, Rahu and Ketu like the beta grahas. Jupiter at 7° of Libra is at 7° of Libra at age 0, comes to 7° of Scorpio a year after that and goes on a sign a year; Saturn and Rahu begin the same way inside their first stay (the part of it that was gone at birth is not lived again), Rahu and Ketu going backwards, so that Rahu at 20° of Cancer is at 20° of Cancer at age 0, goes down through the rest of Cancer and on into Gemini. A degree already passed in the natal sign is reached the next round, not at a negative age. A graha that was retrograde at birth begins one sign back by default, at the same degree: natal Jupiter retrograde at 7° of Libra is at 7° of Virgo at age 0 and comes to 7° of Libra at age 1 (Saturn the same, with its stays of 3 and 2 years or 2½; Rahu and Ketu go backwards and have no such shift). In Settings → calculations the choice "paraya retrograde" lets a retrograde graha begin in its natal sign instead. Whether the graha is retrograde is read from the natal chart (its speed).',
        'Mars, Mercury and Venus can be tried as Paraya grahas too (beta, off until you choose them): they are the second row of chips (beta) in the chart display menu, and the Paraya tab has them among its chips. They are moved the same way, from their natal sign and degree (one sign back, at the same degree, if they were retrograde), so that Mercury at 7° and Venus at 18° of Libra are not in the same place and reach the same degree of another sign at different times, and stay as long as they take in the sky on average: Mars two months in each sign (a round in two years), Mercury and Venus a month (a round in a year). The periods are not settings, and they are not from a text of the tradition: they are the same idea as the four, which stay as long as they take in the sky (Jupiter a year, Saturn 2½, Rahu 1½). Because they come round so often, each of them hits every natal point every year or two.',
      ],
      fi: [
        'Paraya-grahat Jupiter, Saturnus, Ketu ja Rahu kuljetetaan merkkien läpi iän mukaan ja näytetään kartalla. Kartan näyttö -valikon paraya-painikkeilla ne valitaan yksi kerrallaan tai kaikki yhdessä. Asetukset → laskenta -kohdassa valitaan, kuinka kauan Saturnus ja Rahu viipyvät kussakin merkissä; kierros kestää Saturnuksella 30 ja Rahulla 18 vuotta kummassakin tavassa. AJANKOHTA → Paraya -välilehti luettelee, milloin ne saavuttavat natal-grahan tai lagnan.',
        'Mistä Paraya-graha lähtee: jokainen natal-asteestaan, Jupiter, Saturnus, Rahu ja Ketu kuten beta-grahatkin. Jupiter 7° Vaa\'assa on iässä 0 Vaa\'an 7°:ssa, tulee Skorpionin 7°:aan vuotta myöhemmin ja etenee merkin vuodessa; Saturnus ja Rahu lähtevät samoin ensimmäisen viipymänsä sisältä (syntymässä kulunutta osaa ei eletä uudestaan), ja Rahu ja Ketu kulkevat taaksepäin, joten Rahu Ravun 20°:ssa on iässä 0 Ravun 20°:ssa, kulkee alas loppu Ravun läpi ja siirtyy sitten Kaksosiin. Natal-merkissä jo ohitettu aste saavutetaan seuraavalla kierroksella, ei negatiivisessa iässä. Syntymässä retrogradi graha lähtee oletuksena yhden merkin taakse samalta asteelta: natal Jupiter retrogradina Vaa\'an 7°:ssa on iässä 0 Neitsyen 7°:ssa ja tulee Vaa\'an 7°:aan iässä 1 (Saturnus samoin 3 ja 2 vuoden tai 2½ vuoden viipymillä; Rahu ja Ketu kulkevat taaksepäin, eikä niillä ole tällaista siirtoa). Asetukset → laskenta -kohdan valinta "paraya retrograde" antaa retrogradin grahan lähteä sen sijaan natal-merkistään. Se, onko graha retrogradi, luetaan natal-kartasta (sen nopeudesta).',
        'Myös Marsia, Merkuriusta ja Venusta voi kokeilla Paraya-grahoina (beta, pois päältä kunnes valitset ne): ne ovat kartan näyttö -valikon toinen painikerivi (beta), ja Paraya-välilehdellä ne ovat painikkeiden joukossa. Ne kuljetetaan samoin natal-merkistä ja -asteesta alkaen (merkki taaksepäin samalla asteella, jos ne olivat retrogradeja), joten esimerkiksi Merkurius 7° ja Venus 18° Vaa\'assa eivät ole samassa kohdassa ja saavuttavat toisen merkin saman asteen eri aikoihin, ja ne viipyvät niin kauan kuin taivaalla keskimäärin: Mars kaksi kuukautta kussakin merkissä (kierros kahdessa vuodessa), Merkurius ja Venus kuukauden (kierros vuodessa). Kestot eivät ole asetuksia, eivätkä ne ole perinteen tekstistä: ne ovat sama ajatus kuin neljällä muulla, jotka viipyvät niin kauan kuin taivaalla (Jupiter vuoden, Saturnus 2½, Rahu 1½). Koska ne kiertävät niin tiheästi, kukin osuu jokaiseen natal-pisteeseen vuoden tai parin välein.',
      ],
    },
  },

  // ── Timing ─────────────────────────────────────────────────────────
  {
    id: 'muhurta-finder',
    section: 'timing',
    q: { en: 'How do I find a good time with the Muhurta Finder?', fi: 'Miten löydän hyvän ajan Muhurta-haulla?' },
    a: {
      en: [
        'TIMING → Muhurta Finder. Choose what suits from the vāra (the weekday, which changes at sunrise), the tithi (S1 to S15 for the bright half and K1 to K15 for the dark), the karaṇa, the yoga and the nakṣatra of the Moon, and in the grid the signs the Ascendant and each graha (Su to Sa, Ra and Ke) may be in. Each group has all, flip and none; a group with everything chosen puts no condition, and one with nothing chosen can never be met (the page says where). Then choose the date to start from and the number of days (7 to 366), and press search.',
        'The list is the stretches of time at the place (the birthplace, or the residence that you look up) in which every choice holds at once, with the clock times to the minute, the length of each, and the tithi, nakṣatra, yoga, karaṇa and rising sign at its start. "use as target" sets the start of a stretch as the target of the chart. The zodiac, the ayanamsa and the node are the chart\'s. The sky is looked at every 15 minutes (every 5 when the Ascendant is limited), so a stretch shorter than that can be missed; your choices are kept in the browser.',
        'D1 wishes: the group "Wishes about the Rāśi chart (D1)" has five places of the Lagna and the grahas that the book names as favourable (the Lagna and the Navāṁśa Lagna of a benefic, more benefics than malefics in the angles, the Moon in an upachaya, the 8th and 12th empty); each is a wish worth one point, because the book gives no weights, and they limit nothing. Wishes: in the title of the groups tithi, nakṣatra, vāra, karaṇa, yoga, Tarabala and Chandrabala the button "wish" makes the group a wish instead of a condition: it limits nothing, and a stretch that holds it earns its weight (tithi 1, nakṣatra 4, vāra 8, karaṇa 16, yoga 32, Tarabala 60, Chandrabala 100; the scale of the Atharvaṇa Jyotiṣa as the Phalita Navaratna Saṅgraha extends it). The list then has stretches over which the score stays the same, in time order or best first, and "lowest score" keeps only those that reach it. At the start the suiting Tarabala and Chandrabala are wishes. Tarabala: the tārā (1 to 9) of the Moon\'s nakṣatra counted from the nakṣatra of the Moon at birth; the button "usual five" chooses Sampat, Kṣema, Sādhana, Mitra and Parama Mitra, and Janma, Vipat, Pratyak and Naidhana are the ones to avoid. Mahādoṣas: the group "Mahādoṣas to keep clear of" lists the great faults of a muhūrta from the source of the list of 21 (Ernst Wilhelm\'s Classical Muhurta, with his Muhurta Yogas): 24 to choose from, among them the Pañcāṅga Doṣa, Udayāsta Śuddhi, Saṅkrānti, Pāpaṣaḍvarga, Gaṇḍānta, Kartarī, Viṣa Ghaṭī, Dūrmuhūrta, the Vāra Doṣa, six of the Daśa Doṣas, the eclipses, Vyatipāta and Vaidhṛti, each with what it avoids and what part of it is not applied; the stretches found are free of the ones you tick. The few that are not worked out are listed with the reason. Ticked all together they leave very little of the time. Chandrabala: the houses (1st to 12th) from the sign of the Moon at birth that the Moon may be in; the button "usual six" chooses the 1st, 3rd, 6th, 7th, 10th and 11th and the 8th (Candrāṣṭama) is the one to avoid. Sources differ on the 2nd, 5th and 9th, so you choose. Placements: below the grid you can add rules about the houses, counted from the sign of the Ascendant (the 1st house): "at least one of" some grahas in some houses, or "none of" them in some houses, for example Venus or the Moon in the 1st, or no malefic in the 8th and the 12th. Every rule must hold at once; the benefics and malefics buttons fill in the grahas. With a rule the sky is looked at every 5 minutes. The ready-made choices at the top set all the groups and rules for a purpose: Store or business opening has the favourable nakṣatras, leaves out the 4th, 9th and 14th tithi, Tuesday and Aquarius rising, and asks for Venus or the Moon in the Lagna, no malefic in the 8th and 12th and a benefic in the 2nd, 10th or 11th. The more rules, the fewer the stretches: remove a rule to loosen the search.',
      ],
      fi: [
        'AJANKOHTA → Muhurta-haku. Valitse, mikä sopii: vāra (viikonpäivä, joka vaihtuu auringonnousussa), tithi (S1–S15 kasvavalle ja K1–K15 vähenevälle puolelle), karaṇa, yoga ja Kuun nakṣatra, sekä ruudukossa merkit, joissa Ascendantti ja kukin graha (Su–Sa, Ra ja Ke) saa olla. Jokaisessa ryhmässä on kaikki, käännä ja ei mitään; ryhmä, jossa kaikki on valittu, ei aseta ehtoa, ja ryhmä, jossa mitään ei ole valittu, ei voi täyttyä (sivu kertoo missä). Valitse sitten päivä, josta haetaan, ja päivien määrä (7–366) ja paina haku.',
        'Lista on ajanjaksoja paikassa (syntymäpaikka tai hakemasi asuinpaikka), joissa kaikki valinnat pätevät yhtä aikaa, kellonaikoineen minuutin tarkkuudella, kunkin kestoineen sekä tithi, nakṣatra, yoga, karaṇa ja nouseva merkki alussa. "aseta kohteeksi" asettaa jakson alun kartan kohteeksi. Vyöhyke, ayanamsa ja solmu ovat kartan omat. Taivasta katsotaan 15 minuutin välein (5 minuutin, kun Ascendanttia on rajattu), joten sitä lyhyempi jakso voi jäädä huomaamatta; valintasi säilyvät selaimessa.',
        'D1-toiveet: ryhmässä "Toiveet Rāśi-kartasta (D1)" on viisi Lagnan ja grahojen paikkaa, jotka kirja nimeää suotuisiksi (hyväntekijän Lagna ja Navāṁśa-Lagna, enemmän hyvän- kuin pahantekijöitä kulmataloissa, Kuu upachayassa, 8. ja 12. talo tyhjiä); kukin on yhden pisteen toive, koska kirja ei anna painoja, eivätkä ne rajaa mitään. Toiveet: tithi-, nakṣatra-, vāra-, karaṇa-, yoga-, Tarabala- ja Chandrabala-ryhmän otsikon "toive"-painike tekee ryhmästä ehdon sijaan toiveen: se ei rajaa mitään, ja jakso, jossa se pätee, saa painonsa (tithi 1, nakṣatra 4, vāra 8, karaṇa 16, yoga 32, Tarabala 60, Chandrabala 100; Atharvaṇa Jyotiṣan asteikko sellaisena kuin Phalita Navaratna Saṅgraha sitä laajentaa). Lista koostuu jaksoista, joiden pistemäärä pysyy samana, aikajärjestyksessä tai parhaat ensin, ja "pienin pistemäärä" pitää vain ne, jotka sen saavuttavat. Alussa sopivat Tarabala ja Chandrabala ovat toiveita. Tarabala: Kuun nakṣatran tārā (1–9) laskettuna syntymän Kuun nakṣatrasta; painike "yleiset viisi" valitsee Sampatin, Kṣeman, Sādhanan, Mitran ja Parama Mitran, ja Janma, Vipat, Pratyak ja Naidhana vältetään. Mahādoṣat: ryhmä "Vältettävät Mahādoṣat" listaa muhūrtan suuret virheet 21:n listan lähteen mukaan (Ernst Wilhelmin Classical Muhurta ja Muhurta Yogas): 24 valittavissa, muun muassa Pañcāṅga Doṣa, Udayāsta Śuddhi, Saṅkrānti, Pāpaṣaḍvarga, Gaṇḍānta, Kartarī, Viṣa Ghaṭī, Dūrmuhūrta, Vāra Doṣa, kuusi Daśa Doṣaa, pimennykset, Vyatipāta ja Vaidhṛti, kunkin sen mukaan mitä se välttää ja mikä osa siitä jää soveltamatta; löydetyt jaksot ovat valitsemiesi virheiden vapaita. Muutama laskematon on listattu syineen. Kaikki yhdessä valittuina ne jättävät hyvin vähän aikaa. Chandrabala: Kuun talot (1.–12.) syntymän Kuun merkistä laskettuna, joissa Kuu saa olla; painike "yleiset kuusi" valitsee 1., 3., 6., 7., 10. ja 11. talon, ja 8. (Candrāṣṭama) on vältettävä. Lähteet eroavat 2., 5. ja 9. talon kohdalla, joten valitset itse. Sijainnit: ruudukon alle voi lisätä sääntöjä taloista, laskettuna Ascendantin merkistä (1. talo): "vähintään yksi näistä" joissakin taloissa tai "ei yksikään näistä" joissakin taloissa, esimerkiksi Venus tai Kuu 1. talossa tai ei pahantekijää 8. eikä 12. talossa. Kaikkien sääntöjen pitää päteä yhtä aikaa; hyväntekijät- ja pahantekijät-painikkeet täyttävät grahat. Säännön kanssa taivasta katsotaan 5 minuutin välein. Ylhäällä olevat valmiit valinnat asettavat kaikki ryhmät ja säännöt tarkoitusta varten: Kaupan tai liiketoiminnan avaus sisältää suotuisat nakṣatrat, jättää pois 4., 9. ja 14. tithin, tiistain ja Vesimiehen nousun, ja vaatii Venuksen tai Kuun Lagnaan, ei pahantekijää 8. eikä 12. taloon sekä hyväntekijän 2., 10. tai 11. taloon. Mitä enemmän sääntöjä, sitä vähemmän jaksoja: poista sääntö, jos haluat väljemmän haun.',
      ],
    },
  },
  {
    id: 'timing-views',
    section: 'timing',
    q: { en: 'What is in TIMING?', fi: 'Mitä AJANKOHTA sisältää?' },
    a: {
      en: [
        'Dasha: the daśā periods of the systems you have chosen. Summary: the running periods at a glance. Transit Hits: when the transiting grahas reach points of the chart. Paraya: where the progressing (Paraya) grahas stand and when they reach the natal points. Paraya aspects: who aspects each natal point by sign, progressions or transits, with a timeline, the exact dates and the daśā running through each stretch. Sign changes: when the grahas move to another sign. Muhurta: Rahu Kala, Yamaganda, Gulika Kala, Abhijit and the Choghadiya of a day. Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa and Varṣaphala: the yearly charts. Year at a glance: the four yearly charts side by side. Sudarśana: the three charts of the Sudarśana Chakra and the daśā of the year of age.',
        'All of them work for the target date, which is set in the target bar (the date, the time and now).',
      ],
      fi: [
        'Dasha: valitsemiesi järjestelmien daśā-jaksot. Summary: käynnissä olevat jaksot yhdellä silmäyksellä. Transit Hits: milloin transiittigrahat saavuttavat kartan pisteitä. Paraya: missä etenevät (Paraya-) grahat ovat ja milloin ne saavuttavat natal-pisteet. Paraya aspects: kuka aspektoi mitäkin natal-pistettä merkin mukaan, progressiot tai transiitit, aikajanalla, tarkkoine päivineen ja jokaisen jakson läpi kulkevine daśineen. Sign changes: milloin grahat siirtyvät toiseen merkkiin. Muhurta: päivän Rahu Kala, Yamaganda, Gulika Kala, Abhijit ja Choghadiya. Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa ja Varṣaphala: vuosikartat. Vuosi yhdellä silmäyksellä: neljä vuosikarttaa rinnakkain. Sudarśana: Sudarśana-chakran kolme karttaa ja ikävuoden daśā.',
        'Kaikki toimivat tavoitepäivälle, joka asetetaan tavoitepalkista (päivä, kellonaika ja now).',
      ],
    },
  },
  {
    id: 'dasha-systems',
    section: 'timing',
    q: { en: 'Which daśā systems are there, and how do I choose them?', fi: 'Mitä daśā-järjestelmiä on ja miten ne valitaan?' },
    a: {
      en: [
        'Vimsottari (with the Utpanna, Kshema and Adhana variants where they apply, and the Original of U K Jha), Chara, Yoginī, Aṣṭottarī, Kālachakra, the Naisargika daśā and the Nārāyaṇa, Mūla and Sthira daśās, which are still marked beta.',
        'Settings → display → dasha systems chooses which of them are active. TIMING → Dasha → Dasas draws the active ones in three groups: the nakṣatra daśās (Vimsottari and its variants, Yoginī, Aṣṭottarī), the rāśi daśās (Chara, Kālachakra, Nārāyaṇa, Mūla, Sthira) and the others (the Naisargika daśā, which is off to begin with). The … button there, with the number of active systems, opens the list of all of them with a box for each, and all / none for a group; it is the same choice as in Settings. Settings → dasha methods holds the choices of the methods themselves.',
      ],
      fi: [
        'Vimsottari (Utpanna-, Kshema- ja Adhana-muunnelmineen, kun ne soveltuvat, sekä U K Jhan Original), Chara, Yoginī, Aṣṭottarī, Kālachakra, Naisargika-daśā sekä Nārāyaṇa-, Mūla- ja Sthira-daśāt, jotka on vielä merkitty beetaksi.',
        'Asetukset → näyttö → daśā-järjestelmät valitsee, mitkä niistä ovat aktiivisia. AJANKOHTA → Dasha → Daśāt piirtää aktiiviset kolmessa ryhmässä: nakṣatra-daśāt (Vimsottari ja sen muunnelmat, Yoginī, Aṣṭottarī), rāśi-daśāt (Chara, Kālachakra, Nārāyaṇa, Mūla, Sthira) ja muut (Naisargika-daśā, joka on aluksi pois päältä). Siellä oleva …-painike aktiivisten määrineen avaa luettelon kaikista järjestelmistä, kunkin omalla ruudullaan sekä ryhmän kaikki / ei yhtään -painikkeilla; valinta on sama kuin Asetuksissa. Asetukset → daśā-menetelmät sisältää itse menetelmien valinnat.',
      ],
    },
  },
  {
    id: 'naisargika-dasha',
    section: 'timing',
    q: { en: 'How does the Naisargika daśā work?', fi: 'Miten Naisargika-daśā toimii?' },
    a: {
      en: [
        'The natural daśā runs in the order of the natural strength of the grahas, from the birth moment and with no balance of a nakṣatra: the Moon 1 year, Mars 2, Mercury 9, Venus 20, Jupiter 18, the Sun 20, Saturn 50 and the Lagna 12, 132 years in all. BPHS gives the years of the seven (Nisargayu, chapter 46); Saravali 47 adds the Lagna at the end, and so does JHora.',
        'The antardaśās and the periods inside them follow JHora: a daśā is shared equally by the grahas that stand in the 1st, 4th, 7th, 10th, 2nd, 5th, 8th, 11th, 3rd, 6th, 9th and 12th sign from the sign of its lord, taken in that order; the lord itself and Rahu and Ketu are left out. The Lagna\'s daśā counts from the Lagna sign and has all seven grahas. It is in the group of the other daśās in TIMING → Dasha → Dasas, off to begin with; the … button there turns it on. Its lords can also be marked on the charts (Settings → display → dasha lords from).',
      ],
      fi: [
        'Luonnollinen daśā kulkee grahojen luontaisen voiman järjestyksessä syntymähetkestä alkaen ilman nakṣatran jäännöstä: Kuu 1 vuosi, Mars 2, Mercury 9, Venus 20, Jupiter 18, Aurinko 20, Saturn 50 ja Lagna 12, yhteensä 132 vuotta. BPHS antaa seitsemän vuodet (Nisargayu, luku 46); Saravali 47 lisää loppuun Lagnan, samoin JHora.',
        'Antardaśāt ja niiden sisällä olevat jaksot noudattavat JHoraa: daśā jaetaan tasan niiden grahojen kesken, jotka ovat sen herran merkistä lukien 1., 4., 7., 10., 2., 5., 8., 11., 3., 6., 9. ja 12. merkissä, tässä järjestyksessä; herra itse sekä Rahu ja Ketu jäävät pois. Lagnan daśā lasketaan Lagnan merkistä ja siinä on kaikki seitsemän grahaa. Se on muiden daśojen ryhmässä kohdassa AJANKOHTA → Dasha → Daśāt, aluksi pois päältä; siellä oleva …-painike kytkee sen päälle. Sen herrat voi myös merkitä kartoille (Asetukset → näyttö → daśā-herrat järjestelmästä).',
      ],
    },
  },
  {
    id: 'yoga-strength',
    section: 'analysis',
    q: { en: 'How is the strength of a yoga worked out?', fi: 'Miten yogan voimakkuus lasketaan?' },
    a: {
      en: [
        'After the method of "Qualifying Yogas" (Ernst Wilhelm): each planet that forms a yoga gets the points of the Subha / Asubha table, and the strength is their sum. Rāśi ±30 (the sign is a benefic\'s or a malefic\'s) and the dignity in it (exaltation +60, moolatrikona +45, own sign +30, debilitation -60); the same for the Navamsa; vargottama +60; Tara ±60 (the planet\'s nakṣatra counted from the Moon\'s: the 1st, 2nd, 4th, 6th, 8th and 9th are auspicious, the 3rd, 5th and 7th not; the Moon has none, and the nakṣatras follow the nakṣatra zodiac of Settings); the conjunctions; the aspects in virupas; and hemmed between benefics +60 or between malefics -60.',
        'The nature of a planet is the natural one: the Sun, Mars, Saturn, Rahu and Ketu are malefic, Jupiter, Venus and Mercury benefic (Mercury stays so with a malefic), the Moon benefic from 120° to 240° from the Sun, malefic within 60° of it and neutral between. A planet that joins or aspects counts by its own dignity in the rāśi or the Navamsa: a benefic gives +60 unless it is debilitated (then 0); a malefic gives -60, +30 when exalted, +15 in its moolatrikona and 0 in its own sign or when vargottama. The aspects are those of the whole sign in the virupas of Parāśara (the 7th 60, the 4th and 8th 45, the 5th and 9th 30, the 3rd and 10th 15; full on the 4th and 8th for Mars, the 5th and 9th for Jupiter, the 3rd and 10th for Saturn), by the same dignity. A benefic sign in which the planet is debilitated, or a malefic sign that is its own or its exaltation or that it is vargottama in, gives no ±30.',
        'The label (Very Strong over 150, Strong from 75, Moderate from 0, else Weak) is that of the average per planet of the yoga; the thresholds are the app\'s own. The tooltip of the strength lists the points and says whether the yoga is Subha, Asubha or Misra: Subha when its planets have more auspicious influences (a benefic sign or Navamsa, auspicious Tara, benefic conjunctions, aspects or a hemming) than inauspicious ones, Asubha when fewer, and Misra when equal. Not applied: the book\'s note that a planet joined with the lord of the 6th, 8th or 12th in one of those houses is harmed (it gives no number).',
      ],
      fi: [
        'Menetelmä on "Qualifying Yogas" (Ernst Wilhelm): jokainen yogan muodostava planeetta saa Subha / Asubha -taulukon pisteet, ja voimakkuus on niiden summa. Rāśi ±30 (merkki on hyväntekijän tai pahantekijän) ja arvokkuus siinä (korotus +60, moolatrikona +45, oma merkki +30, heikennys -60); sama Navamsalle; vargottama +60; Tara ±60 (planeetan nakṣatra laskettuna Kuun nakṣatrasta: 1., 2., 4., 6., 8. ja 9. ovat suotuisia, 3., 5. ja 7. eivät; Kuulla ei ole, ja nakṣatrat seuraavat Asetusten nakṣatra-zodiakkia); yhtymät; aspektit virupoina; sekä hyväntekijöiden väliin jääminen +60 tai pahantekijöiden väliin -60.',
        'Planeetan luonne on luonnollinen: Aurinko, Mars, Saturn, Rahu ja Ketu ovat pahantekijöitä, Jupiter, Venus ja Mercury hyväntekijöitä (Mercury pysyy sellaisena pahantekijän seurassakin), Kuu on hyväntekijä 120°–240° Auringosta, pahantekijä 60° sisällä siitä ja neutraali siinä välissä. Yhtyvä tai aspektoiva planeetta lasketaan oman arvokkuutensa mukaan rāśissa tai Navamsassa: hyväntekijä antaa +60, ellei se ole heikennetty (silloin 0); pahantekijä antaa -60, korotettuna +30, moolatrikonassaan +15 ja omassa merkissään tai vargottamana 0. Aspektit ovat koko merkin aspekteja Parāśaran virupoina (7. 60, 4. ja 8. 45, 5. ja 9. 30, 3. ja 10. 15; täysi Marsilla 4. ja 8., Jupiterilla 5. ja 9., Saturnilla 3. ja 10.), samalla arvokkuussäännöllä. Hyväntekijän merkki, jossa planeetta on heikennetty, tai pahantekijän merkki, joka on planeetan oma tai korotusmerkki tai jossa se on vargottama, ei anna ±30.',
        'Luokka (Very Strong yli 150, Strong 75:stä, Moderate 0:sta, muuten Weak) määräytyy yogan planeettojen keskiarvosta; rajat ovat sovelluksen omia. Voimakkuuden vihjeessä on pisteet ja se kertoo, onko yoga Subha, Asubha vai Misra: Subha, kun sen planeetoilla on enemmän suotuisia vaikutuksia (hyväntekijän merkki tai Navamsa, suotuisa Tara, hyväntekijöiden yhtymät, aspektit tai väliin jääminen) kuin epäsuotuisia, Asubha, kun vähemmän, ja Misra, kun yhtä paljon. Ei sovellettu: kirjan huomautus, että 6., 8. tai 12. herran kanssa näissä taloissa yhtyvä planeetta kärsii (siitä ei anneta lukua).',
      ],
    },
  },
  {
    id: 'event-list',
    section: 'timing',
    q: { en: 'How do I add and change many events in the Event List at once?', fi: 'Miten lisään ja muutan monta tapahtumaa kerralla tapahtumalistassa?' },
    a: {
      en: [
        'TIMING → Events → Paste opens a box for many events. Write or paste one event on each line, the date and the name: 15.6.2015 Moved abroad. The date can be 15.6.2015, 15/6/2015 or 2015-06-15 (the day first), a month (3/2015) or a year (2015), and it can also be at the end of the line. A month or a year alone is taken to be the middle of it and the event is tagged approx. date. Two dates make an event that lasted for a while: 15.6.2015 - 20.8.2017 Studied abroad, or 2015 - 2017 Studied abroad. Under the box you see how many events were understood, how many are already in the list and the lines that were not understood; Add puts the new ones in the list, in date order.',
        'A line copied from a spreadsheet (the cells are separated by tabs) or written with semicolons can go on with more: the category, the varga, the significance from 1 to 5 and the notes, for example 2.1.2018; New job; work; D10; 5; started at the bank. What a line does not say takes the category and varga chosen under the box. The Finnish names of the categories (työ, raha, parisuhde, terveys, koti, perhe, henkinen, muu) are understood too. A first line that only names the columns is skipped, and a CSV file with a header row or a JSON list can be pasted as it is. Import reads a whole CSV or JSON file instead.',
        'Under the search row of the list is the bulk editing bar. Tick the events (or Select all shown) and set their category, varga or significance, add or remove tags, make them single days again with Clear end date, or delete them. Only the events that the search and the significance filter show are changed. Every paste, import, bulk change and deletion can be taken back with Undo in the message above the list. Group by year adds a heading for each year. Open Varga Matrix in an event shows ANALYSIS → Varga → Matrix. An event can have an end date (when adding it, or in its card, where the date can be changed too): the dashas are then shown for both its first and its last day.',
        'Classify events by words, above the bulk editing bar, sorts many events at once by what is written in them, which is what a pasted list needs when everything came in as Other with no tags. Choose a set (Moves, Marriages, Divorces, Accidents, Illnesses and surgery, Jobs, Births of children, Deaths), which fills in the words (English and Finnish), a category and a tag, or write your own words, category and tag. The line beside the button says how many events the words find and how many would change, and lists the first few; nothing changes until you press Sort. By default only the events still in the category Other are taken, so what you sorted by hand stays as it is; Undo brings the old list back. Sorted this way, the events can be picked in LIBRARY → Research by category or tag.',
        'How exactly the date of an event is known (to the day, to the month, to the year) is chosen in the card of the event, with "Date accuracy", in the bulk bar for many events at once, and when one is added with the form. An event pasted with only a month or a year gets it from the date. Research reads an event known to the month or to the year over a window when its window is chosen by the accuracy of the date, and what you chose here outweighs the tag "approx. date".',
        'Every card also has the progressions (Paraya) of the event\'s day: for each progressing graha (the ones chosen for the chart in the chart display menu: Jupiter, Saturn, Rahu and Ketu to begin with) the sign and degree it stood at, its house, and the natal points it aspected by sign (1 is the point\'s own sign, 5, 7 and 9 the signs counted from it), with a ● where it stood within a degree of the natal degree. An event with an end date has them for its last day too. They follow the Paraya options of Settings, and they are what TIMING → Paraya and Paraya aspects show when the event is set as the target.',
      ],
      fi: [
        'AJANKOHTA → Tapahtumat → Liitä avaa kentän monelle tapahtumalle. Kirjoita tai liitä yksi tapahtuma riville, päivä ja nimi: 15.6.2015 Muutto ulkomaille. Päivä voi olla 15.6.2015, 15/6/2015 tai 2015-06-15 (päivä ensin), kuukausi (3/2015) tai vuosi (2015), ja se voi olla myös rivin lopussa. Pelkkä kuukausi tai vuosi tulkitaan sen keskikohdaksi, ja tapahtuma saa tunnisteen approx. date. Kaksi päivää tekee jonkin aikaa kestäneen tapahtuman: 15.6.2015 - 20.8.2017 Opiskelu ulkomailla tai 2015 - 2017 Opiskelu ulkomailla. Kentän alla näkyy, kuinka monta tapahtumaa ymmärrettiin, kuinka monta on jo listassa ja rivit, joita ei ymmärretty; Lisää-painike lisää uudet listaan päivämäärän mukaiseen järjestykseen.',
        'Taulukosta kopioitu rivi (solut erotettu sarkaimilla) tai puolipisteillä kirjoitettu rivi voi jatkua: luokka, varga, merkitys 1–5 ja muistiinpanot, esimerkiksi 2.1.2018; Uusi työ; work; D10; 5; aloitin pankissa. Mitä rivi ei kerro, saa kentän alta valitun luokan ja vargan. Luokkien suomenkieliset nimet (työ, raha, parisuhde, terveys, koti, perhe, henkinen, muu) ymmärretään myös. Ensimmäinen rivi, joka vain nimeää sarakkeet, ohitetaan, ja otsikkorivillisen CSV-tiedoston tai JSON-listan voi liittää sellaisenaan. Tuo-painike lukee sen sijaan kokonaisen CSV- tai JSON-tiedoston.',
        'Listan hakurivin alla on massamuokkauspalkki. Valitse tapahtumat (tai Valitse kaikki näkyvät) ja aseta niiden luokka, varga tai merkitys, lisää tai poista tunnisteita, tee niistä taas yksittäisiä päiviä painikkeella Tyhjennä loppupäivä tai poista ne. Muutos koskee vain tapahtumia, jotka haku ja merkitysrajaus näyttävät. Jokaisen liittämisen, tuonnin, massamuutoksen ja poiston voi perua listan yläpuolella olevan viestin Kumoa-painikkeella. Ryhmittele vuoden mukaan lisää jokaisesta vuodesta otsikon. Avaa Varga-matriisi näyttää ANALYYSI → Varga → Matriisi. Tapahtumalla voi olla loppupäivä (lisättäessä tai sen kortissa, jossa myös päivää voi muuttaa): daśāt näytetään silloin sekä ensimmäiselle että viimeiselle päivälle.',
        'Lajittele tapahtumat sanojen mukaan, massamuokkauspalkin yläpuolella, lajittelee monta tapahtumaa kerralla sen mukaan, mitä niissä lukee, mitä liitetty lista tarvitsee, kun kaikki tuli sisään luokkana Muu ja ilman tunnisteita. Valitse sanajoukko (Muutot, Avioliitot, Erot, Tapaturmat, Sairaudet ja leikkaukset, Työpaikat, Lasten syntymät, Kuolemat), joka täyttää sanat (englanniksi ja suomeksi), luokan ja tunnisteen, tai kirjoita omat sanat, luokka ja tunniste. Painikkeen vieressä oleva rivi kertoo, montako tapahtumaa sanat löytävät ja montako muuttuisi, ja luettelee muutaman ensimmäisen; mikään ei muutu ennen kuin painat Lajittele. Oletuksena otetaan vain tapahtumat, jotka ovat yhä luokassa Muu, joten käsin lajittelemasi pysyy ennallaan; Kumoa palauttaa vanhan listan. Näin lajitellut tapahtumat voi poimia kohdassa KIRJASTO → Tutkimus luokan tai tunnisteen mukaan.',
        'Kuinka tarkasti tapahtuman päivämäärä tunnetaan (päivän, kuukauden vai vuoden tarkkuudella) valitaan tapahtuman kortissa kohdasta "Päivämäärän tarkkuus", massamuokkauspalkissa monelle tapahtumalle kerralla ja lomakkeella yhtä lisättäessä. Pelkän kuukauden tai vuoden sisältävä liitetty tapahtuma saa sen päivämäärästä. Research lukee kuukauden tai vuoden tarkkuudella tunnetun tapahtuman ikkunalla, kun ikkuna valitaan päivämäärän tarkkuuden mukaan, ja tässä valitsemasi ohittaa tunnisteen "approx. date".',
        'Jokaisessa kortissa on myös tapahtuman päivän progressiot (Paraya): jokaisesta etenevästä grahasta (kartan näyttö -valikosta kartalle valitut: aluksi Jupiter, Saturnus, Rahu ja Ketu) merkki ja aste, jossa se oli, sen talo sekä natal-pisteet, joita se aspektoi merkin mukaan (1 on pisteen oma merkki, 5, 7 ja 9 siitä lukien), ja ● silloin, kun se oli enintään asteen päässä natal-asteesta. Tapahtumalla, jolla on loppupäivä, ne näytetään myös viimeiselle päivälle. Ne noudattavat Asetusten Paraya-valintoja, ja ne ovat se, mitä AJANKOHTA → Paraya ja Paraya aspects näyttävät, kun tapahtuma asetetaan tavoitteeksi.',
      ],
    },
  },
  {
        id: 'target-date',
    section: 'timing',
    q: { en: 'What is the target date?', fi: 'Mikä on tavoitepäivä?' },
    a: {
      en: [
        'The date (and time) for which the transits, the running daśās and the BCP year are shown. It starts as today, and the now button returns to the present moment. Change it to look at a past event or a coming time: the chart, the transits and TIMING follow it.',
      ],
      fi: [
        'Päivä (ja kellonaika), jolle transiitit, käynnissä olevat daśāt ja BCP-vuosi näytetään. Se alkaa tästä päivästä, ja now-painike palauttaa nykyhetkeen. Vaihda se katsoaksesi menneitä tapahtumia tai tulevaa aikaa: kartta, transiitit ja AJANKOHTA seuraavat sitä.',
      ],
    },
  },
  {
    id: 'bcp',
    section: 'timing',
    q: { en: 'What are the BCP year and month?', fi: 'Mitä ovat BCP-vuosi ja -kuukausi?' },
    a: {
      en: [
        'In the Bhrigu Chakra Paddhati the running year of life (the completed age plus one) is given to a house, and the houses repeat every twelve years: the 1st year goes to the 1st house, the 13th year again to the 1st. The months of the running year are counted from the birthday, not from the calendar. The BCP layer of the chart marks the house of the year and of the month at the target date.',
      ],
      fi: [
        'Bhrigu Chakra Paddhatissa käynnissä oleva elinvuosi (täysi ikä plus yksi) annetaan talolle, ja talot toistuvat kahdentoista vuoden välein: 1. vuosi kuuluu 1. talolle, 13. vuosi taas 1. talolle. Käynnissä olevan vuoden kuukaudet lasketaan syntymäpäivästä, ei kalenterista. Kartan BCP-taso merkitsee vuoden ja kuukauden talon tavoitepäivänä.',
      ],
    },
  },

  // ── Analysis ───────────────────────────────────────────────────────
  {
    id: 'analysis-views',
    section: 'analysis',
    q: { en: 'What is in ANALYSIS?', fi: 'Mitä ANALYYSI sisältää?' },
    a: {
      en: [
        'Grahas: the table of the grahas with their positions, karakas and nakshatras, and the yoga table (open at first; closing it is remembered). Varga: the divisional charts in a grid. Nāḍī: the Nadi amsas. Aṣṭakavarga: the bindu tables. Gochara: the transits by the Moon. Dṛṣṭi: the aspects. Argala: argala and virodhargala. Bhava Chalit: the Śrīpati chart. Nava-Tara: the nine-star wheel. Directions: the directional chart. Special Sphutas: the lagnas and sphutas that run on the time since sunrise. Sarvatobhadra: the Sarvatobhadra chakra. Kota Chakra: the fort wheel of the 28 nakshatras.',
      ],
      fi: [
        'Grahas: grahojen taulukko sijainteineen, karakoineen ja nakshatroineen sekä yogat. Varga: jakokartat ruudukossa. Nāḍī: Nadi-amsat. Aṣṭakavarga: bindu-taulukot. Gochara: transiitit Kuusta lukien. Dṛṣṭi: aspektit. Argala: argala ja virodhargala. Bhava Chalit: Śrīpati-kartta. Nava-Tara: yhdeksän tähden kehä. Directions: suuntakartta. Special Sphutas: auringonnoususta kuluvan ajan mukaan kulkevat lagnat ja sphuṭat. Sarvatobhadra: Sarvatobhadra-chakra. Kota Chakra: 28 nakshatran linnoituspyörä.',
      ],
    },
  },
  {
    id: 'karakas',
    section: 'analysis',
    q: { en: 'Where are the Chara karakas?', fi: 'Missä Chara-karakat ovat?' },
    a: {
      en: [
        'In ANALYSIS → Grahas the table has a Kāraka column: AK, AmK, BK, MK, PiK, PuK, GK and DK (hover for the full name). The column and the Nakṣatra column are always shown, whatever the chart itself shows. Settings → calculations chooses how the karakas are ranked and whether there are seven or eight of them.',
      ],
      fi: [
        'ANALYYSI → Grahas -taulukossa on Kāraka-sarake: AK, AmK, BK, MK, PiK, PuK, GK ja DK (vie osoitin päälle nähdäksesi koko nimen). Sarake ja Nakṣatra-sarake näkyvät aina, mitä kartta itse sitten näyttääkin. Asetukset → laskenta valitsee, miten karakat järjestetään ja onko niitä seitsemän vai kahdeksan.',
      ],
    },
  },
  {
    id: 'directions',
    section: 'analysis',
    q: { en: 'How does the directional chart work?', fi: 'Miten suuntakartta toimii?' },
    a: {
      en: [
        'In the directional chart of the Nadi the direction belongs to the sign: the fire signs are east, the earth signs south, the air signs west and the water signs north. Every graha is written in the direction of its sign, in the order of its degree.',
        'A retrograde graha (not Rahu and Ketu, which are always retrograde) is also written, in brackets, in the direction of the sign before its own: that is the sign it aspects. There are no houses or transits in this chart, because the directions go by sign.',
      ],
      fi: [
        'Nadin suuntakartassa suunta kuuluu merkille: tulimerkit ovat itä, maamerkit etelä, ilmamerkit länsi ja vesimerkit pohjoinen. Jokainen graha kirjoitetaan merkkinsä suuntaan asteensa järjestyksessä.',
        'Taaksepäin kulkeva graha (ei Rahu ja Ketu, jotka ovat aina taaksepäin) kirjoitetaan myös sulkeisiin sen merkkiä edeltävän merkin suuntaan: se on merkki, jota se aspektoi. Tässä kartassa ei ole taloja eikä transiitteja, koska suunnat kulkevat merkin mukaan.',
      ],
    },
  },
  {
    id: 'nakshatra-zodiac',
    section: 'analysis',
    q: { en: 'Which zodiac are the nakshatras counted in?', fi: 'Missä zodiakissa nakshatrat lasketaan?' },
    a: {
      en: [
        'By default in the same ayanamsa as the grahas. Settings → calculations → nakshatra zodiac can change that to any ayanamsa of the ayanamsa list above it (Lahiri, Raman, Krishnamurti, Fagan–Bradley and the rest, Custom Lahiri with its adjustment) or to the tropical zodiac, for example to see the nakshatras in the tropical zodiac or to keep the grahas in one ayanamsa and the nakshatras in another. The choice applies to the nakshatras everywhere: the charts, the table, the panchang, the Nava-Tara, the Sarvatobhadra, the Kota Chakra and the special sphutas.',
      ],
      fi: [
        'Oletuksena samassa ayanamsassa kuin grahat. Asetukset → laskenta → nakṣatrojen zodiakki voi vaihtaa sen mihin tahansa sen yläpuolella olevan ayanamsa-luettelon ayanamsaan (Lahiri, Raman, Krishnamurti, Fagan–Bradley ja muut, Mukautettu Lahiri säätöineen) tai tropiikkiseen zodiakkiin, esimerkiksi nähdäksesi nakshatrat tropiikkisessa zodiakissa tai pitääksesi grahat yhdessä ayanamsassa ja nakshatrat toisessa. Valinta koskee nakshatroja kaikkialla: kartoissa, taulukossa, panchangassa, Nava-Tarassa, Sarvatobhadrassa, Kota Chakrassa ja erikoissphuṭissa.',
      ],
    },
  },
  {
    id: 'sarvatobhadra',
    section: 'analysis',
    q: { en: 'What is the Sarvatobhadra chakra and how do I read it?', fi: 'Mikä on Sarvatobhadra-chakra ja miten sitä luetaan?' },
    a: {
      en: [
        'ANALYSIS → Sarvatobhadra draws the chakra as nine rows of nine squares: the 28 nakshatras (Abhijit included) round the edge, the vowels and consonants and the twelve signs inside, and the five groups of tithis (Nanda, Bhadra, Jaya, Rikta, Poorna) with their weekdays in the middle. Every graha, and the Lagna as Asc, stands in the square of its nakshatra; a retrograde graha is in italics with ℞. Transit adds the transiting grahas in violet.',
        'The Moon\'s nakshatra (Janma nakshatra), the squares of the Moon\'s sign and of the Lagna\'s sign and the squares of the birth tithi and of the birth weekday are marked, and the list below the chart names them. The birth day counts from sunrise, so a birth before sunrise belongs to the day before. Abhijit is the stretch from 6°40′ to 10°53′20″ of Capricorn, cut from Uttara Ashadha and Shravana, and the nakshatras follow the nakshatra zodiac of Settings.',
        'Vedha: a graha has vedha on the nakshatra straight across the chart from its own and on the two nakshatras on the diagonals from it. Choose a graha in the Vedha row (natal, and transit when Transit is on) to draw its three lines and mark the nakshatras they end on; the Vedha list under the chart gives them for every graha, with the grahas that stand in them in brackets (a transiting one with ↗). A nakshatra that holds grahas is pierced by the graha that has vedha on it.',
        'The squares the three lines cross on the way are tinted, and the nakshatras they end on are outlined. Type the first letter or syllable of a name as the chart writes it (ch, kh, a …) in Name syllable to mark its squares. Birth points pierced, under the chart, lists which graha has vedha on the Moon\'s nakshatra, the Moon\'s sign, the Lagna\'s sign, the birth tithi, the birth weekday and the syllable of the name: at the end of a line, or crossed by it. A transiting graha is marked with ↗ when Transit is on.',
      ],
      fi: [
        'ANALYSIS → Sarvatobhadra piirtää chakran yhdeksänä rivinä, joissa on yhdeksän ruutua: reunalla 28 nakshatraa (Abhijit mukana), sisällä vokaalit ja konsonantit sekä kaksitoista rāśia ja keskellä viisi tithi-ryhmää (Nanda, Bhadra, Jaya, Rikta, Poorna) viikonpäivineen. Jokainen graha ja Lagna (Asc) on oman nakshatransa ruudussa; retrogradinen graha on kursiivilla ja merkillä ℞. Transiitti lisää liikkuvat grahat violettina.',
        'Kuun nakshatra (Janma-nakshatra), Kuun rāśin ja Lagnan rāśin ruudut sekä syntymän tithin ja syntymäviikonpäivän ruudut on merkitty, ja kartan alla oleva lista nimeää ne. Syntymäpäivä lasketaan auringonnoususta, joten ennen auringonnousua syntynyt kuuluu edelliselle päivälle. Abhijit on Kauriin 6°40′:n ja 10°53′20″:n välinen jakso, joka on otettu Uttara Ashadhasta ja Shravanasta, ja nakshatrat noudattavat Asetusten nakshatra-zodiakkia.',
        'Vedha: grahalla on vedha nakshatraan, joka on suoraan vastapäätä sen omaa kartan toisella puolella, sekä kahteen nakshatraan sen viistoilla. Valitse graha Vedha-riviltä (natal, ja transiitti kun Transit on päällä), niin sen kolme viivaa piirtyvät ja nakshatrat, joihin ne päättyvät, merkitään; kartan alla oleva Vedha-lista näyttää ne jokaiselle grahalle, ja niissä olevat grahat ovat hakasulkeissa (transiittigraha merkillä ↗). Nakshatra, jossa on grahoja, on sen grahan lävistämä, jolla on siihen vedha.',
        'Kolme viivaa ylittämät ruudut on sävytetty, ja nakshatrat, joihin viivat päättyvät, on reunustettu. Kirjoita nimen ensimmäinen kirjain tai tavu sellaisena kuin kartta sen kirjoittaa (ch, kh, a …) kohtaan Nimen tavu, niin sen ruudut merkitään. Kartan alla oleva Lävistetyt syntymäpisteet kertoo, millä grahalla on vedha Kuun nakshatraan, Kuun rāśiin, Lagnan rāśiin, syntymän tithiin, syntymäviikonpäivään ja nimen tavuun: viivan päässä tai viivan lävistämänä. Transiittigraha on merkitty ↗:llä, kun Transit on päällä.',
      ],
    },
  },
  {
    id: 'kota-chakra',
    section: 'analysis',
    q: { en: 'What is the Kota Chakra and how do I read it?', fi: 'Mikä on Kota-chakra ja miten sitä luetaan?' },
    a: {
      en: [
        'ANALYSIS → Kota Chakra draws the fort wheel: the 28 nakshatras (Abhijit included) in four squares inside one another, the Bahya (exterior), the Praakaara (wall), the Durgantara (interior) and the Stambha (pillar) in the middle, 8, 8, 8 and 4 nakshatras. The count begins at the Moon\'s nakshatra at birth, which is the first place, at the top left of the outer square; the other places follow as in JHora. Count from Krittika (Agni Purana) shows the wheel of the Agni Purana, chapter 128, which begins with Krittika. Every graha, and the Lagna as Asc, stands in the square of its nakshatra; Transit adds the transiting grahas in violet.',
        'The Kota Swami, the lord of the fort, is the lord of the Moon\'s sign at birth (Mars for Scorpio, Saturn for Aquarius). The Kota Pala, the guard, is the graha of the first letter of the name syllable of the Moon\'s pada (vowels the Sun, ka the Mars, ca the Venus and so on), taken from the table of JHora; no classical text for that table was found, so it is a modern one. A Moon in Abhijit takes the pada of the nakshatra it really stands in, and the nakshatras follow the nakshatra zodiac of Settings.',
        'Reading: the Stambha and the Durgantara are the heart of the fort, the Praakaara and the Bahya what surrounds it. The modern school (K. K. Joshi, ed. K. N. Rao) reads the transiting grahas against the Moon\'s nakshatra of birth: benefics in the heart strengthen the fort and malefics there do the reverse, malefics outside are adverse circumstances and benefics outside improve them. The Reading under the chart lists the transiting benefics and malefics in the two places. This is a tradition that has not been validated, and the fort wheel of the Agni Purana itself is about war and has none of it.',
      ],
      fi: [
        'ANALYYSI → Kota Chakra piirtää linnoituspyörän: 28 nakshatraa (Abhijit mukana) neljässä sisäkkäisessä neliössä, Bahya (ulkopuoli), Praakaara (muuri), Durgantara (muurin sisäpuoli) ja keskellä Stambha (pilari), 8, 8, 8 ja 4 nakshatraa. Laskenta alkaa syntymän Kuun nakshatrasta, joka on ensimmäinen paikka ulkoneliön vasemmassa yläkulmassa; muut paikat seuraavat kuten JHorassa. Laske alkaen Krittika (Agni Purana) näyttää Agni Puranan luvun 128 pyörän, joka alkaa Krittikasta. Jokainen graha ja Lagna (Asc) on oman nakshatransa ruudussa; Transit lisää liikkuvat grahat violettina.',
        'Kota Swami, linnan herra, on syntymän Kuun rāśin herra (Skorpionille Mars, Vesimiehelle Saturnus). Kota Pala, vartija, on Kuun padan nimitavun ensimmäisen kirjaimen graha (vokaalit Aurinko, ka Mars, ca Venus ja niin edelleen) JHoran taulukosta; klassista lähdettä taulukolle ei löytynyt, joten se on nykyaikainen. Abhijitissa oleva Kuu ottaa sen nakshatran padan, jossa se todella on, ja nakshatrat noudattavat Asetusten nakṣatrojen zodiakkia.',
        'Tulkinta: Stambha ja Durgantara ovat linnan sydän, Praakaara ja Bahya sen ympäristö. Nykyaikainen koulukunta (K. K. Joshi, toim. K. N. Rao) lukee liikkuvia grahoja syntymän Kuun nakshatraa vasten: hyväntekijät sydämessä vahvistavat linnaa ja pahantekijät siellä päinvastoin, pahantekijät ulkopuolella ovat epäsuotuisia olosuhteita ja hyväntekijät ulkopuolella parantavat niitä. Kartan alla oleva Tulkinta listaa liikkuvat hyväntekijät ja pahantekijät molemmissa paikoissa. Tämä on validoimaton perinne, eikä Agni Puranan linnoituspyörä itse sisällä sitä, vaan koskee sotaa.',
      ],
    },
  },
  {
    id: 'sudarshana',
    section: 'timing',
    q: { en: 'What is the Sudarśana Chakra and the Sudarśana daśā?', fi: 'Mitä ovat Sudarśana-chakra ja Sudarśana-daśā?' },
    a: {
      en: [
        'TIMING → Sudarśana draws three charts one inside another (BPHS chapter 74): the signs counted from the Lagna (innermost), from the Moon (middle) and from the Sun (outermost), so that the same house number is on the same side of all three. In the Sudarśana daśā each year of age makes the next house active, the same house number in all three: the 1st in the first year of life, the 2nd in the second, and so on to the 12th, the 13th year being the 1st again. A year is cut in twelve months and a month in twelve days of about 2.5 days, the first of each having the house of the whole it belongs to.',
        'BPHS does not say what a year is; here it runs from one solar return to the next (the Sun back at its natal sidereal longitude), the first year from birth, as in the annual charts; the months and days are equal parts of it. The year stepper moves between the years; Choose a month in the table to mark it in the chart and see its twelve days.',
        'The table under the chart gives, for the active house in each chart, its sign, its lord and where the lord stands, the grahas in the sign and those that aspect it, and a verdict by the rule of BPHS 74: the grahas in the house decide, benefics against malefics (the Sun counts as a benefic only in the 1st house of a ring; a malefic in its exaltation sign does no harm); with none in it the grahas that aspect it decide; with none, its lord. BPHS says to use the chakra only when the Lagna, the Moon and the Sun are in three different signs, and to judge from the Lagna chart alone otherwise; the page says so when that is the case. The natal grahas are used; the adjustment by the Saptavarga, the check against the Ashtakavarga and the grahas at the start of the year are not taken into account, and BPHS has no rule for combining the three charts, so none is made.',
      ],
      fi: [
        'AJANKOHTA → Sudarśana piirtää kolme karttaa sisäkkäin (BPHS luku 74): merkit laskettuna Lagnasta (sisin), Kuusta (keskimmäinen) ja Auringosta (uloin), niin että sama talon numero on kaikissa kolmessa samalla puolella. Sudarśana-daśāssa jokainen ikävuosi tekee seuraavan talon aktiiviseksi, samalla talon numerolla kaikissa kolmessa: ensimmäisenä elinvuotena 1., toisena 2., ja niin edelleen 12. asti, 13. vuosi on taas 1. Vuosi jaetaan kahteentoista kuukauteen ja kuukausi kahteentoista noin 2,5 vuorokauden päivään, joista kummankin ensimmäisellä on sen kokonaisuuden talo, johon se kuuluu.',
        'BPHS ei sano, mikä vuosi on; tässä se kestää yhdestä aurinkopalauksesta seuraavaan (Aurinko takaisin syntymän sidereaalisessa pituusasteessaan), ensimmäinen vuosi syntymästä, kuten vuosikartoissa; kuukaudet ja päivät ovat sen tasaisia osia. Vuosivalitsin siirtyy vuodesta toiseen; Valitse kuukausi taulukosta merkitäksesi sen kartalle ja nähdäksesi sen kaksitoista päivää.',
        'Kartan alla oleva taulukko antaa kunkin kartan aktiiviselle talolle sen merkin, herran ja herran sijainnin, merkissä olevat grahat ja sitä aspektoivat sekä arvion BPHS 74:n säännöllä: talossa olevat grahat ratkaisevat, hyväntekijät pahantekijöitä vastaan (Aurinko on hyväntekijä vain kehän 1. talossa; korotusmerkissään oleva pahantekijä ei vahingoita); jos siinä ei ole yhtään, sitä aspektoivat ratkaisevat; jos niitäkään ei ole, sen herra. BPHS:n mukaan chakraa käytetään vain, kun Lagna, Kuu ja Aurinko ovat kolmessa eri merkissä, muuten arvio tehdään pelkästä Lagna-kartasta; sivu kertoo, kun näin on. Käytetään syntymän grahoja; Saptavargan säätöä, Aṣṭakavargan tarkistusta ja vuoden alun grahoja ei oteta huomioon, eikä BPHS anna tapaa yhdistää kolmea karttaa, joten sitä ei tehdä.',
      ],
    },
  },
  {
    id: 'bala-view',
    section: 'analysis',
    q: { en: 'Where are the Ṣaḍbala, the Bhāva Bala and the Vimśopaka, and how do I read their diagrams?', fi: 'Missä Ṣaḍbala, Bhāva Bala ja Vimśopaka ovat, ja miten niiden kaaviot luetaan?' },
    a: {
      en: [
        'ANALYSIS → Bala has the strengths in three parts: Ṣaḍbala (the grahas), Bhāva Bala (the houses) and Vimśopaka (the grahas in the divisional charts). Each has a diagram and, under it, the table with the numbers; ANALYSIS → Varga → Matrix keeps only the matrix of the signs and dignities in D1 to D60.',
        'Ṣaḍbala has two diagrams. The first shows each graha\'s total as a percentage of the strength it needs, with a line at 100 %: under 100 % is weak (✕, red), up to 120 % ok (!, amber) and more strong (✓, green); the word and the icon are there so the colour is not the only sign. The second shows the six balas (Sthāna, Dig, Kāla, Cheṣṭā, Naisargika, Dṛg) in virūpa, added up to the total, with a mark at the required strength; Dṛg can be negative and then goes to the left of the zero. Bhāva Bala starts with a bar for each house in one colour, in virūpa, with lines at 420 and 480 (✕ under 420, ! from 420, ✓ from 480; the verses give no minimum for a house, so the limits are a reading of this application), and then a blue column for each house with its total over it (what each total is made of is in the table). Vimśopaka has a bar for each graha, out of 20, for the scheme you choose (Ṣaḍvarga, Saptavarga, Daśavarga or Ṣoḍaśavarga), with the line at 10, the word for what the total gives by BPHS 7.26-27 (under 5 no results, over 5 little, over 10 middling, over 15 full results) and the numbers of all four schemes in the tooltip.',
        'Every bar and column answers to the pointer and to the keyboard (Tab to a row, and its numbers show), and the tables hold the same numbers as the diagrams.',
      ],
      fi: [
        'ANALYYSI → Bala näyttää voimat kolmessa osassa: Ṣaḍbala (grahat), Bhāva Bala (talot) ja Vimśopaka (grahat jakokartoissa). Jokaisella on kaavio ja sen alla taulukko lukuineen; ANALYYSI → Varga → Matriisi sisältää enää vain merkkien ja arvokkuuksien matriisin D1–D60.',
        'Ṣaḍbalalla on kaksi kaaviota. Ensimmäinen näyttää kunkin grahan summan prosenttina sen vaatimasta voimasta, viivana 100 %: alle 100 % on heikko (✕, punainen), 120 %:iin asti kelpo (!, keltainen) ja sen yli vahva (✓, vihreä); sana ja kuvake ovat mukana, jottei väri ole ainoa merkki. Toinen näyttää kuusi balaa (Sthāna, Dig, Kāla, Cheṣṭā, Naisargika, Dṛg) virūpoina summaan laskettuina, vaaditun voiman kohdalla merkki; Dṛg voi olla negatiivinen ja on silloin nollan vasemmalla puolella. Bhāva Balan alussa on yksivärinen palkki jokaiselle talolle kartan kahdentoista talon keskiarvoa vasten (✕ alle 90 %, ! 110 %:iin asti, ✓ 110 %:sta; säkeet eivät anna talolle vähimmäisvoimaa, joten tämä on kartta itseään vasten), ja sen jälkeen sininen pylväs jokaiselle talolle, summa pylvään päällä (mistä kukin summa muodostuu, näkyy taulukossa). Vimśopakalla on palkki jokaiselle grahalle asteikolla 20 valitsemallesi laskentatavalle (Ṣaḍvarga, Saptavarga, Daśavarga tai Ṣoḍaśavarga), viiva kohdassa 10, sana sille, mitä summa BPHS 7.26-27:n mukaan antaa (alle 5 ei tuloksia, yli 5 vähän, yli 10 kohtalaisesti, yli 15 täydet tulokset) ja kaikkien neljän laskentatavan luvut työkaluvihjeessä.',
        'Jokainen palkki ja pylväs vastaa osoittimeen ja näppäimistöön (Tab-näppäimellä riville, ja sen luvut näkyvät), ja taulukoissa on samat luvut kuin kaavioissa.',
      ],
    },
  },
  {
    id: 'sensitive-degrees',
    section: 'analysis',
    q: { en: 'What are Sandhi, Gandanta, Mṛtyu Bhāga and the Puṣkara degrees, and where are the Yogi, Sahayogi and Avayogi?', fi: 'Mitä ovat Sandhi, Gandanta, Mṛtyu Bhāga ja Puṣkara-asteet, ja missä Yogi, Sahayogi ja Avayogi ovat?' },
    a: {
      en: [
        'ANALYSIS → Sensitive Degrees lists the Lagna, the grahas and Māndi with the degrees that weaken or strengthen them, as Jagannatha Hora counts them. Weakening (⚠): Sandhi, a point within 1° of the start or the end of a sign; Gandanta, the last 3°20\' of Cancer, Scorpio and Pisces and the first 3°20\' of Leo, Sagittarius and Aries (the last pada of Ashlesha, Jyeshtha and Revati and the first of Magha, Mula and Ashwini, counted in the nakshatra zodiac of Settings), with the part within 0°26\'40" (two ghatis) of the junction marked as its core; and Mṛtyu Bhāga, the degree of death of the point in its sign (a table for the Sun to Ketu, Māndi and the Lagna, with an orb of ⅓° for the Sun, ⅔° for the Moon, Mercury and the Lagna and ¼° for the others). Strengthening (✦): the Puṣkara Navāṁśa, two navamsas of 3°20\' in each sign (from 20° in fire signs, 6°40\' in earth signs, 16°40\' in air signs and 0° in water signs, and 6°40\' after that), and the Puṣkara Bhāga, one degree in each sign (the 21st, 14th, 24th and 7th in turn). The view also marks combustion (☼): the Moon within 12° of the Sun, Mars 17°, Mercury 14° (12° when retrograde), Jupiter 11°, Venus 10° (8° when retrograde) and Saturn 15°.',
        'The chart beside the Chart selector says which chart is tested: the rāśi chart or any divisional chart, for example the Navamsa, on the sign and degree each point has there (combustion only counts in the rāśi chart). The same marks are on the other screens: ANALYSIS → Grahas has a Marks column with ⚠ ✦ ☼ for every row (hover a mark for the reason), and a graha in any chart tells its marks in its hover text, in the divisional chart as it stands there. The Yogi (ʸ), Sahayogi (ˢ) and Avayogi (ᵃ) can be marked on the grahas of the charts as a layer, switched on in the ··· menu of the chart (chart layers → yogi ʸ sahayogi ˢ avayogi ᵃ).',
        'The summary above the table names the points that are on a degree, and the folded table under it has the degrees of every sign. Rahu and Ketu are tested like the other grahas, and the Lagna for all five; JHora leaves the Lagna out of the Puṣkara degrees, which the Lagna also has in the classical texts.',
        'ANALYSIS → Special Sphutas has the Yogi, the Sahayogi and the Avayogi under the sphuṭas: the Yogi point is the Sun + the Moon + 93°20\', the Yogi is the lord of its nakshatra, the Sahayogi the lord of its sign and the Avayogi the lord of the nakshatra of the point 186°40\' after it; each is shown with the sign and house it stands in in the chart.',
      ],
      fi: [
        'ANALYYSI → Sensitive Degrees (Herkät asteet) listaa Lagnan, grahat ja Māndin sekä niitä heikentävät ja vahvistavat asteet Jagannatha Horan tavoin laskettuna. Heikentävät (⚠): Sandhi, piste enintään 1° päässä merkin alusta tai lopusta; Gandanta, Ravun, Skorpionin ja Kalojen viimeiset 3°20\' sekä Leijonan, Jousimiehen ja Oinaan ensimmäiset 3°20\' (Ashleshan, Jyeshthan ja Revatin viimeinen pada sekä Maghan, Mulan ja Ashwinin ensimmäinen, laskettuna Asetusten nakṣatra-zodiakissa), ja liitoskohdan 0°26\'40":n (kahden ghaṭīn) sisällä oleva osa merkitään sen ytimeksi; sekä Mṛtyu Bhāga, pisteen kuolinaste omassa merkissään (taulukko Auringosta Ketuun, Māndille ja Lagnalle, orbi Auringolle ⅓°, Kuulle, Merkuriukselle ja Lagnalle ⅔° ja muille ¼°). Vahvistavat (✦): Puṣkara Navāṁśa, kaksi 3°20\' navāṁśaa jokaisessa merkissä (tulimerkeissä 20°:sta, maamerkeissä 6°40\':sta, ilmamerkeissä 16°40\':sta ja vesimerkeissä 0°:sta alkaen sekä 6°40\' sen jälkeen), ja Puṣkara Bhāga, yksi aste jokaisessa merkissä (vuorotellen 21., 14., 24. ja 7.). Näkymä merkitsee myös palaneisuuden (☼): Kuu enintään 12° päässä Auringosta, Mars 17°, Merkurius 14° (12° retrogradina), Jupiter 11°, Venus 10° (8° retrogradina) ja Saturnus 15°.',
        'Kartta-valitsin kertoo, mikä kartta testataan: rāśi-kartta tai mikä tahansa jakokartta, esimerkiksi Navāṁśa, kunkin pisteen siellä olevalla merkillä ja asteella (palaneisuus lasketaan vain rāśi-kartassa). Samat merkinnät ovat muissa näkymissä: ANALYYSI → Grahat -taulukossa on Merkit-sarake, jossa jokaisella rivillä ⚠ ✦ ☼ (vie hiiri merkin päälle nähdäksesi syyn), ja kartan graha kertoo merkintänsä hover-vihjeessä, jakokartassa siinä asemassa kuin se siellä on. Yogi (ʸ), Sahayogi (ˢ) ja Avayogi (ᵃ) voi merkitä kartan grahoille kerroksena, joka kytketään kartan ··· -valikosta (chart layers → yogi ʸ sahayogi ˢ avayogi ᵃ).',
        'Taulukon yläpuolinen yhteenveto nimeää pisteet, jotka ovat jollakin asteella, ja sen alla oleva suljettu taulukko antaa jokaisen merkin asteet. Rahu ja Ketu tutkitaan kuten muut grahat, ja Lagna kaikilla viidellä; JHora jättää Lagnan pois Puṣkara-asteista, jotka klassisissa teksteissä koskevat myös Lagnaa.',
        'ANALYYSI → Special Sphutas näyttää Yogin, Sahayogin ja Avayogin sphuṭien alla: Yogi-piste on Aurinko + Kuu + 93°20\', Yogi on sen nakṣatran herra, Sahayogi sen merkin herra ja Avayogi sitä 186°40\' myöhemmän pisteen nakṣatran herra; kukin näytetään merkissä ja talossa, jossa se kartassa on.',
      ],
    },
  },
  {
    id: 'paraya-progressions',
    section: 'timing',
    q: { en: 'Where do I see when the progressions (Paraya) reach my natal planets?', fi: 'Mistä näen, milloin progressiot (Paraya) osuvat natal-planeettoihin?' },
    a: {
      en: [
        'TIMING → Paraya. The seven progressing grahas are Jupiter, Saturn, Rahu and Ketu and, in beta, Mars, Mercury and Venus (see "What are the Paraya grahas?" for how each is moved by age). The tab lists where each of them stands at the target moment (sign, degree and house) and the date of its next hit, then an overview of the seven against the ten natal points (the nine grahas and the ascendant): the cell has the date of the first hit of that pair in the range and how many there are. Under it come all the hits in the order of time, in months: the progressing graha reaches the same degree as the natal point in its own sign (1) or in the 5th, 7th or 9th sign from it. Nothing has to be switched on or waited for: it is all worked out from the age.',
        'The range (1, 3, 10 or 30 years from the target moment), the kinds of hit (1, 5, 7, 9) and the progressing grahas are chosen with the buttons above the table; a cell of the overview picks one pair and shows only its hits (the same cell again lets go of it). Set target moves the target moment to the hit, so the charts and the other tabs show that day.',
      ],
      fi: [
        'AJANKOHTA → Paraya. Seitsemän etenevää grahaa ovat Jupiter, Saturnus, Rahu ja Ketu sekä betana Mars, Merkurius ja Venus (katso "Mitä ovat Paraya-grahat?" siitä, miten kukin kuljetetaan iän mukaan). Välilehti kertoo, missä kukin niistä on tavoitehetkellä (merkki, aste ja talo) ja milloin sen seuraava osuma on, ja sitten yleiskuvan seitsemästä kymmentä natal-pistettä vasten (yhdeksän grahaa ja lagna): solussa on kyseisen parin ensimmäisen osuman päivä jaksossa ja osumien määrä. Sen alla ovat kaikki osumat aikajärjestyksessä kuukausittain: etenevä graha saavuttaa natal-pisteen asteen omassa merkissään (1) tai siitä lukien 5., 7. tai 9. merkissä. Mitään ei tarvitse kytkeä päälle eikä odottaa: kaikki lasketaan iästä.',
        'Jakso (1, 3, 10 tai 30 vuotta tavoitehetkestä), osumien lajit (1, 5, 7, 9) ja etenevät grahat valitaan taulukon yläpuolisilla painikkeilla; yleiskuvan solu valitsee yhden parin ja näyttää vain sen osumat (sama solu uudestaan päästää irti). Aseta tavoite siirtää tavoitehetken osumaan, jolloin kartat ja muut välilehdet näyttävät sen päivän.',
      ],
    },
  },
  {
    id: 'paraya-aspects',
    section: 'timing',
    q: { en: 'How do I see when several progressions or transits aspect the same natal planet, or when one graha aspects another?', fi: 'Mistä näen, milloin useampi progressio tai transiitti aspektoi samaa natal-planeettaa, tai milloin graha aspektoi toista?' },
    a: {
      en: [
        'TIMING → Paraya aspects. This tab counts by sign, not by exact degree: a graha aspects a natal point while it is in the sign of that point (1), or in the 5th, 7th or 9th sign from it, for as long as it stays there. The exact degrees come inside each stretch (below); here you see the stretches of time. The first two buttons choose whose aspects they are: the progressions (Paraya), or the transits, the grahas of the sky. The transits are worked out from the ephemeris: Jupiter, Saturn, Rahu and Ketu for 1, 3, 10 or 30 years, and Sun, Mars, Mercury and Venus as well for up to 10 years; a transiting graha that turns retrograde can leave a sign and come back, so its sign has two stays. The two sources count aspects differently. The progressions follow the Nāḍī method, in which every graha has the 1st, 5th, 7th and 9th. The transits follow each graha\'s own aspects, counted from the graha: Saturn the 3rd, 7th and 10th, Jupiter the 5th, 7th and 9th, Mars the 4th, 7th and 8th, Rahu and Ketu the 5th and 9th, and the Sun, Mercury and Venus the 7th, each with the sign it stands in (1). For the transits the buttons for the kinds of aspect are therefore 1, 3, 4, 5, 7, 8, 9 and 10, a graha shows only those it has, and the number is the house of the natal point counted from the graha ("Sa 3 Mo": the Moon is the 3rd sign from Saturn).',
        'At the target moment: a table of the ten natal points (the nine grahas and the ascendant) with the grahas that aspect each now and the kind of aspect (1, 5, 7 or 9), and a count, ticked when it reaches the number you chose. Timeline: a row for each sign that holds natal points and the range across; each stretch is shaded by how many grahas aspect the points of that sign during it (one to four or more), and hovering or focusing a stretch reads it out in words (click it to move the target moment to its start). Several at once: the stretches in which at least 2 (or 3, or 4) grahas aspect the same natal point, in the order of time, with who they are and what they do ("Su ← Ju 5 · Sa 9" is Jupiter in the 5th and Saturn in the 9th sign from the Sun). Natal points in the same sign are aspected by the same grahas at the same times, so they share one row (Su Mo Me Ve Sa in Cancer). Search: choose a graha and a natal point (or any), and the rows are the dates from which to which it aspects it, by the kind of aspect, and whether it does now.',
        'Every row has "exact dates": open it to see when, inside that stretch, the graha stands at the exact degree of the natal point (a Paraya progression once in a stay, a transit three times when it turns back over the degree, and not at all in a short stay at the edge of a sign where the graha does not reach it). Each has a Set target button too. Under each row is the daśā running through it, for example "Vimś Ju–Sa → Ju–Me": the mahādaśā and antardaśā lords in the order of time, a lord that is one of the natal points of the row in bold. The daśā buttons switch the line off, choose the system (Vimśottarī, Utpanna/Kṣema/Ādhāna, Original, Yoginī, Aṣṭottarī, Naisargika) and, with "MD lord" or "MD or AD lord", leave only the stretches in which the aspected graha is a daśā lord at some time (Aṣṭottarī needs the chart to meet its condition).',
        'The range (1, 3, 10 or 30 years from the target moment), the kinds of aspect (1, 5, 7, 9) and the grahas (Mars, Mercury and Venus of the progressions are beta and off to begin with; the faster transits are off to begin with) are chosen with the buttons above; Set target moves the target moment to the start of a stretch. The progressions begin at the natal degrees (see "What are the Paraya grahas?"), and Settings → calculations has the choices that change their dates.',
      ],
      fi: [
        'AJANKOHTA → Paraya aspects. Tämä välilehti laskee merkeittäin, ei tarkoin asteittain: graha aspektoi natal-pistettä, kun se on pisteen merkissä (1) tai siitä lukien 5., 7. tai 9. merkissä, niin kauan kuin se siinä viipyy. Tarkat asteet ovat kunkin jakson sisällä (alla); täällä näet ajanjaksot. Kaksi ensimmäistä painiketta valitsevat, kenen aspektit näytetään: progressiot (Paraya) vai transiitit, taivaan grahat. Transiitit lasketaan efemeridistä: Jupiter, Saturnus, Rahu ja Ketu 1, 3, 10 tai 30 vuodelle, ja Aurinko, Mars, Merkurius ja Venus mukana enintään 10 vuodelle; retrogradiksi kääntyvä transiittigraha voi lähteä merkistä ja palata siihen, jolloin merkillä on kaksi viipymää. Lähteet laskevat aspektit eri tavoin. Progressiot noudattavat Nāḍī-menetelmää, jossa jokaisella grahalla on 1., 5., 7. ja 9. Transiitit noudattavat kunkin grahan omia aspekteja grahasta lukien: Saturnus 3., 7. ja 10., Jupiter 5., 7. ja 9., Mars 4., 7. ja 8., Rahu ja Ketu 5. ja 9., ja Aurinko, Merkurius ja Venus 7., kullakin lisäksi merkki, jossa se on (1). Transiiteille aspektilajien painikkeet ovat siksi 1, 3, 4, 5, 7, 8, 9 ja 10, graha näyttää vain ne, jotka sillä on, ja luku on natal-pisteen talo grahasta lukien ("Sa 3 Mo": Kuu on kolmas merkki Saturnuksesta).',
        'Tavoitehetkellä: taulukko kymmenestä natal-pisteestä (yhdeksän grahaa ja lagna) sekä grahoista, jotka aspektoivat kutakin nyt, ja aspektin lajista (1, 5, 7 tai 9), sekä lukumäärä, joka saa rastin, kun se yltää valitsemaasi lukuun. Aikajana: rivi jokaiselle merkille, jossa on natal-pisteitä, ja jakso poikki; kukin ajanjakso on sävytetty sen mukaan, montako grahaa aspektoi merkin pisteitä sen aikana (yhdestä neljään tai useampaan), ja jakson päälle vietynä tai valittuna se luetaan sanoin (napsautus siirtää tavoitehetken jakson alkuun). Useampi yhtä aikaa: jaksot, joissa vähintään 2 (tai 3 tai 4) grahaa aspektoi samaa natal-pistettä, aikajärjestyksessä, kertoen ketkä ne ovat ja mitä ne tekevät (\"Su ← Ju 5 · Sa 9\" on Jupiter Auringosta lukien 5. ja Saturnus 9. merkissä). Saman merkin natal-pisteitä aspektoivat samat grahat samoina aikoina, joten ne ovat yhdellä rivillä (Su Mo Me Ve Sa Rapussa). Haku: valitse graha ja natal-piste (tai mikä tahansa), ja rivit ovat päivät, joista mihin asti se aspektoi sitä, aspektin lajin mukaan, sekä se, onko se käynnissä nyt.',
        'Jokaisella rivillä on \"tarkat päivät\": avaa se nähdäksesi, milloin jakson sisällä graha on natal-pisteen tarkalla asteella (Paraya-progressio kerran viipymän aikana, transiitti kolmesti, kun se kääntyy takaisin asteen yli, ja ei lainkaan lyhyessä viipymässä merkin reunalla, jossa graha ei ylety siihen). Jokaisella on myös Aseta tavoite -painike. Rivin alla on sen läpi kulkeva daśā, esimerkiksi \"Vimś Ju–Sa → Ju–Me\": mahādaśā- ja antardaśā-herrat aikajärjestyksessä, ja rivin natal-pisteisiin kuuluva herra on lihavoitu. Daśā-painikkeet kytkevät rivin pois, valitsevat järjestelmän (Vimśottarī, Utpanna/Kṣema/Ādhāna, Original, Yoginī, Aṣṭottarī, Naisargika) ja \"MD-herra\" tai \"MD- tai AD-herra\" jättää vain jaksot, joissa aspektoitu graha on jossain vaiheessa daśā-herra (Aṣṭottarī edellyttää, että kartta täyttää sen ehdon).',
        'Jakso (1, 3, 10 tai 30 vuotta tavoitehetkestä), aspektien lajit (1, 5, 7, 9) ja grahat (progressioiden Mars, Merkurius ja Venus ovat betaa ja aluksi pois päältä; nopeammat transiitit ovat aluksi pois päältä) valitaan yllä olevilla painikkeilla; Aseta tavoite siirtää tavoitehetken jakson alkuun. Progressiot lähtevät natal-asteista (katso \"Mitä ovat Paraya-grahat?\"), ja Asetukset → laskenta -kohdassa on valinnat, jotka muuttavat niiden päiviä.',
      ],
    },
  },
  {
    id: 'research-progressions',
    section: 'library',
    q: { en: 'Do the progressions have something in common at the time of my events, across several charts?', fi: 'Onko progressioilla jotain yhteistä tapahtumieni aikana usean kartan yli?' },
    a: {
      en: [
        'LIBRARY → Research. It takes the charts you have saved with SAVE and, for each, the events kept in TIMING → Dasha → Events (a chart saved twice for the same birth moment and place counts once). Choose the charts, the kind of event (the category, for example Home / move for moves, or Relationship for weddings, a tag if you use them, and words) and Run the comparison. The words box picks events by what is written in their name, tags or notes, in any case, any one of the words being enough ("move, moved, relocation"); it is the way to pick out the moves or the accidents from events that came in with no category, and it combines with the category and the tag. Under the box, "the events chosen" lists what the comparison will take (the chart, the day and the name), so that you can see it before you run. Each event\'s day is read for the progressions (Paraya): which house each progressing graha stood in (counted from the ascendant, so charts with different ascendants can be compared), which houses it aspected by sign, which natal points it aspected by sign (the same sign, or the 5th, 7th or 9th from it), and, if you add that, which natal points it stood within a degree of.',
        'What the events have in common is only interesting if it is more than chance. The same chart is therefore read at 400 random moments of its life, which gives the share of the time each feature is there anyway; Saturn aspects the Moon a third of the time whatever happens. Then the events are moved to random moments of their own chart 2000 times, and p is how often that gives as many events with the feature as you actually have. Looking at 100 or more features, some always look striking by chance, so q (false discovery rate) corrects p for that: a q of 0.1 or less is marked with bold and a ✓. The comparison is the same every time (the random numbers are seeded).',
        'The matrix shows one kind of feature at a time: a row for each progressing graha (Jupiter, Saturn, Rahu and Ketu; Mars, Mercury and Venus when chosen), a column for each house or natal point, in each cell the number of events with it, shaded by how many times more often than chance (darkest at three times or more). Click a cell or a row of the table to list its events. The table lists every feature that at least one event has, the most unusual first, with the events with it, how many would be expected by chance, the ratio, p and q. This shows what the events have in common, not why; with fewer than about fifteen events only a very strong pattern can show, and a pattern found in many features is a hint to test with more events, not a result.',
        'Four more things. Window: dates are often only approximate (the spring of 2015), so the window (the day itself, or 30, 90 or 180 days either side) counts a feature if it holds at any time within it, and "exact on natal" is then an exact hit inside it; the random moments are read over the same window, so the comparison stays fair. A feature chosen beforehand: tick "Test one feature chosen beforehand" and choose a graha, a kind and a house or natal point (for example Saturn in house 4 for moves) before you run; with one feature chosen in advance no correction for the number of features is needed, and p is the exact chance of as many events with it as there are. Without each chart in turn: the same exact test with one chart left out, shown for that feature and for any feature you click, to see whether a finding rests on a single chart. Two kinds of event: choose "two kinds of event" to compare two sets side by side (moves against weddings, or two tags) instead of one against chance; each feature is counted in both and compared with the Fisher exact test, with q for the number of features looked at, and the events of both sets that have a feature are listed. Export the table and Export the events save CSV files (the events one has a row for each event and a 0 or 1 for each feature) to go on with in a spreadsheet or a statistics program.',
        'Three sources of features. Progressions (Paraya) as above. Transits: the same kinds of feature for the real sky, for Jupiter, Saturn, Rahu and Ketu, read from one table of the sky from the first birth to now (a position every three days, which is plenty for signs and for degrees within a degree); a window works the same way. A transiting graha aspects by its own rule (Saturn the 3rd, 7th and 10th from itself, Jupiter the 5th, 7th and 9th, Mars the 4th, 7th and 8th, Rahu and Ketu the 5th and 9th), where the progressions give every graha the 1st, 5th, 7th and 9th. Daśā: the lords of the mahādaśā (MD) and antardaśā (AD) running at the moment, as a graha, as the houses they rule (counted from the ascendant; Rahu and Ketu rule none) and as the house they stand in at birth, in the system you choose (Vimśottarī, Yoginī and the others of the daśā buttons). Tick the kinds you want in the rows of the buttons; the table and the matrices say which source each feature is from, and you can compare which source separates the events best, or choose one feature of any source beforehand.',
        'Four more kinds of check, added later. Window "by the accuracy of the date": an event known to the day is read for that day, one known to the month for 15 days either side, one known to the year for 182 (dates imported with only a month or a year are marked "approx." and read that way); the random moments are read over the same windows. Training and test: choose "training and test" to find the best features in one part of the data and test them in another that they were not chosen from. Split by charts (stricter) or by events (when you have few charts); the training share and how many of the best features are carried over are chosen; the table shows each feature in both parts and the p corrected for the number carried over, with a ✓ for those that held, and the line above it says how many held and how many would pass by chance alone. A real pattern holds there; a chance one rarely does; Another split tries a different division. The Paraya settings: "the Paraya settings" runs the study under each of the eight combinations (a retrograde graha beginning one sign back or in its natal sign, Saturn and Rahu alternating or even) and lists them by the strength of the pattern, the mean of −log10 of the exact p of the five strongest features, with the strongest feature of each and its p corrected for the eight tried. Gochara: a fourth source of features, the traditional reading of the transits against the natal Moon: the house of a slow graha from the Moon, whether it is a favourable one (Jupiter and Saturn), the strength of the bindus of its own Bhinnāṣṭakavarga in the sign (Jupiter and Saturn), a high or low Sarvāṣṭakavarga of the sign, and Saturn over the Moon (Sade Sati, the 4th and the 8th).',
        'Six more things, added later. Combinations: "combinations" puts two kinds of feature together that are there at the same time, for example the lord of the daśā and the gochara of the same graha (the rule that a daśā lord works when the gochara supports it); choose the two kinds, and whether only the same graha counts. Each combination is set against how often both are there at random moments of the chart, and comes with the p of each part, because a combination is of interest only if it is more unusual than both of them. Joint model: "joint model" builds a logistic model on the training part from its best features, adding the feature that improves the fit most for as long as that is worth more than a penalty for choosing among so many, and then tries it as it stands on the test part. The AUC there is the chance that an event scores higher than a random moment of its own chart (0.5 is chance, 1 is perfect), with a p from events moved to random moments; the table shows the odds ratio of each feature and the AUC after each step. Time profile: the button under a feature chosen beforehand, or under a feature you clicked in the table, counts the events that have it from half a year before to half a year after, a month at a time, as bars of how many times more often than by chance; a pattern that leads the event shows left of 0, one that follows it right of 0. The chance level: "the other charts at the same moment" compares each event with the same moment in the other charts (at least three) and so asks whether the date is unusual and not only the moment in the life; the p-values are exact and, with few charts, coarse and cautious. Saved runs: "Keep this run" saves the run under a name, and any two kept runs can be set side by side, with how many of the features that held up in the first hold up in the second, for example after charts were added. The report: "Save the report (HTML)" makes one page of the run on the screen, the data, the method, the strongest results with their corrected p-values and the cautions, which prints well to a PDF from the browser.',
      ],
      fi: [
        'KIRJASTO → Tutkimus. Se ottaa SAVE-painikkeella tallentamasi kartat ja kustakin tapahtumat, jotka on tallennettu kohdassa AJANKOHTA → Dasha → Events (kahdesti samalle syntymähetkelle ja paikalle tallennettu kartta lasketaan kerran). Valitse kartat, tapahtuman laji (luokka, esimerkiksi Home / move muutoille tai Relationship häille, tunniste, jos käytät niitä, ja sanat) ja Aja vertailu. Sanakenttä poimii tapahtumat sen mukaan, mitä niiden nimessä, tunnisteissa tai muistiinpanoissa lukee, isoilla tai pienillä kirjaimilla, ja yksi sanoista riittää ("muutto, muutin, tapaturma"); sillä poimitaan muutot tai tapaturmat tapahtumista, jotka tulivat sisään ilman luokkaa, ja se toimii yhdessä luokan ja tunnisteen kanssa. Kentän alla "valitut tapahtumat" luettelee, mitkä vertailuun otetaan (kartta, päivä ja nimi), jotta näet ne ennen ajoa. Jokaisen tapahtuman päivä luetaan progressioiden (Paraya) kannalta: missä talossa kukin etenevä graha oli (lagnasta lukien, joten eri lagnojen kartat ovat vertailukelpoisia), mitä taloja se aspektoi merkin mukaan, mitä natal-pisteitä se aspektoi merkin mukaan (sama merkki tai siitä lukien 5., 7. tai 9.) ja, jos sen lisäät, mitä natal-pisteitä se oli enintään asteen päässä.',
        'Se, mitä tapahtumilla on yhteistä, on kiinnostavaa vain, jos se on enemmän kuin sattuma. Siksi sama kartta luetaan 400 satunnaisena hetkenä sen elämän aikana, mikä antaa osuuden ajasta, jona kukin ominaisuus on joka tapauksessa läsnä; Saturnus aspektoi Kuuta kolmasosan ajasta, mitä tahansa tapahtuu. Sitten tapahtumat siirretään satunnaisiin hetkiin oman karttansa elämässä 2000 kertaa, ja p kertoo, kuinka usein se antaa yhtä monta tapahtumaa, joilla ominaisuus on, kuin sinulla oikeasti on. Sadan tai useamman ominaisuuden joukossa jokin näyttää aina sattumalta silmiinpistävältä, joten q (false discovery rate) korjaa p:n sillä: enintään 0,1 oleva q merkitään lihavoinnilla ja ✓:llä. Vertailu on joka kerta sama (satunnaisluvut on siemennetty).',
        'Matriisi näyttää yhden ominaisuuslajin kerrallaan: rivi jokaiselle etenevälle grahalle (Jupiter, Saturnus, Rahu ja Ketu; Mars, Merkurius ja Venus, kun ne valitaan), sarake jokaiselle talolle tai natal-pisteelle, ja kussakin solussa tapahtumien määrä, sävytettynä sen mukaan, montako kertaa useammin kuin sattumalta (tummin kolminkertaisena tai enemmän). Napsauta solua tai taulukon riviä nähdäksesi sen tapahtumat. Taulukko luettelee jokaisen ominaisuuden, joka on ainakin yhdellä tapahtumalla, poikkeavin ensin, ja näyttää tapahtumat, joilla se on, kuinka monta odotettaisiin sattumalta, suhteen, p:n ja q:n. Tämä näyttää, mitä tapahtumilla on yhteistä, ei miksi; alle noin viidentoista tapahtuman joukosta näkyy vain hyvin vahva kuvio, ja monen ominaisuuden joukosta löytynyt kuvio on vihje testattavaksi useammalla tapahtumalla, ei tulos.',
        'Vielä neljä asiaa. Ikkuna: päivät ovat usein vain likimääräisiä (kevät 2015), joten ikkuna (päivä itse tai 30, 90 tai 180 päivää kummallekin puolelle) laskee ominaisuuden, jos se pätee jossain vaiheessa sen sisällä, ja "tarkka natalilla" on silloin tarkka osuma sen sisällä; satunnaiset hetket luetaan samalla ikkunalla, joten vertailu pysyy reiluna. Etukäteen valittu ominaisuus: rastita "Testaa yksi etukäteen valittu ominaisuus" ja valitse graha, laji sekä talo tai natal-piste (esimerkiksi Saturnus 4. talossa muutoille) ennen ajoa; yhdelle etukäteen valitulle ominaisuudelle ei tarvita korjausta ominaisuuksien määrän suhteen, ja p on tarkka todennäköisyys sille, että sattumalta olisi yhtä monta tapahtumaa, joilla se on. Ilman kutakin karttaa vuorollaan: sama tarkka testi yksi kartta pois jätettynä, näytetään tälle ominaisuudelle ja jokaiselle napsauttamallesi ominaisuudelle, jotta nähdään, nojaako löydös yhteen karttaan. Kaksi tapahtumalajia: valitse "kahteen tapahtumalajiin" verrataksesi kahta joukkoa rinnakkain (muutot häihin tai kaksi tunnistetta) yhden sattumaan vertaamisen sijaan; jokainen ominaisuus lasketaan molemmissa ja vertaillaan Fisherin tarkalla testillä, ja q korjaa tarkasteltujen ominaisuuksien määrällä; ominaisuuden omaavat tapahtumat molemmista joukoista luetellaan. Vie taulukko ja Vie tapahtumat tallentavat CSV-tiedostot (tapahtumatiedostossa on rivi jokaiselle tapahtumalle ja 0 tai 1 jokaiselle ominaisuudelle) jatkokäsittelyä varten taulukkolaskennassa tai tilasto-ohjelmassa.',
        'Kolme ominaisuuksien lähdettä. Progressiot (Paraya) kuten yllä. Transiitit: samat ominaisuuslajit todelliselle taivaalle, Jupiterille, Saturnukselle, Rahulle ja Ketulle, luettuna yhdestä taivaan taulukosta ensimmäisestä syntymästä nykyhetkeen (sijainti kolmen päivän välein, mikä riittää merkeille ja asteille asteen tarkkuudella); ikkuna toimii samoin. Transiittigraha aspektoi oman sääntönsä mukaan (Saturnus 3., 7. ja 10. itsestään, Jupiter 5., 7. ja 9., Mars 4., 7. ja 8., Rahu ja Ketu 5. ja 9.), kun progressioilla jokaisella grahalla on 1., 5., 7. ja 9. Daśā: sillä hetkellä käynnissä olevien mahādaśā- (MD) ja antardaśā- (AD) herrojen ominaisuudet grahana, hallitsemiensa talojen mukaan (lagnasta lukien; Rahu ja Ketu eivät hallitse yhtään) ja talona, jossa ne ovat syntymässä, valitsemassasi järjestelmässä (Vimśottarī, Yoginī ja muut daśā-painikkeiden järjestelmät). Rastita haluamasi lajit painikerivistä; taulukko ja matriisit kertovat, mistä lähteestä kukin ominaisuus on, ja voit vertailla, mikä lähde erottaa tapahtumat parhaiten, tai valita etukäteen yhden ominaisuuden miltä tahansa lähteeltä.',
        'Neljä lisätarkistusta, jotka tulivat myöhemmin. Ikkuna "päivämäärän tarkkuuden mukaan": päivän tarkkuudella tunnettu tapahtuma luetaan sille päivälle, kuukauden tarkkuudella tunnettu 15 päivää molemmin puolin ja vuoden tarkkuudella tunnettu 182 päivää (vain kuukauden tai vuoden sisältävät tuodut päivämäärät on merkitty "approx." ja luetaan näin); satunnaiset hetket luetaan samoilla ikkunoilla. Opetus ja testi: valitse "opetus ja testi" löytääksesi parhaat ominaisuudet yhdestä osasta aineistoa ja testataksesi ne toisella, josta niitä ei valittu. Jaa kartoittain (tiukempi) tai tapahtumittain (kun karttoja on vähän); opetusosuus ja testiin vietävien parhaiden ominaisuuksien määrä valitaan; taulukko näyttää jokaisen ominaisuuden molemmissa osissa ja testiin viedyillä ominaisuuksilla korjatun p:n, ja ✓ merkitsee ne, jotka pitivät, ja sen yläpuolella oleva rivi kertoo, montako piti ja montako läpäisisi pelkällä sattumalla. Todellinen kuvio pitää siellä, sattuman tekemä harvoin; Toinen jako kokeilee eri jakoa. Paraya-asetukset: "Paraya-asetukset" ajaa tutkimuksen kahdeksalla yhdistelmällä (taaksepäin kulkevan grahan alku yhtä merkkiä taaempaa tai syntymämerkistä, Saturnus ja Rahu vuorotellen tai tasaisesti) ja luettelee ne kuvion vahvuuden mukaan (viiden vahvimman ominaisuuden tarkan p:n −log10:n keskiarvo), kunkin vahvin ominaisuus ja sen kahdeksalla kokeillulla korjattu p. Gochara: neljäs ominaisuuksien lähde, transiittien perinteinen luku syntymäkuuta vasten: hitaan grahan talo Kuusta, onko se suotuisa (Jupiter ja Saturnus), oman Bhinnāṣṭakavargan bindujen vahvuus merkissä (Jupiter ja Saturnus), merkin korkea tai matala Sarvāṣṭakavarga sekä Saturnus Kuun yllä (Sade Sati, 4. ja 8.).',
        'Vielä kuusi myöhemmin tullutta asiaa. Yhdistelmät: "yhdistelmät" panee yhteen kaksi ominaisuuslajia, jotka ovat läsnä yhtä aikaa, esimerkiksi daśā-herran ja saman grahan gocharan (sääntö, että daśā-herra toimii, kun gochara tukee sitä); valitse kaksi lajia ja se, lasketaanko vain sama graha. Kukin yhdistelmä verrataan siihen, kuinka usein molemmat ovat läsnä kartan satunnaisina hetkinä, ja siihen kuuluu kummankin osan p, koska yhdistelmä on kiinnostava vain, jos se on epätavallisempi kuin kumpikin osansa. Yhteismalli: "yhteismalli" rakentaa logistisen mallin opetusosasta sen parhaista ominaisuuksista lisäämällä ominaisuuden, joka parantaa sovitusta eniten, niin kauan kuin se on enemmän arvoista kuin rangaistus valinnasta näin monen joukosta, ja kokeilee sitä sitten sellaisenaan testiosassa. Siellä AUC on todennäköisyys, että tapahtuma saa korkeamman pistemäärän kuin oman karttansa satunnainen hetki (0,5 on sattuma, 1 täydellinen), ja p saadaan satunnaisiin hetkiin siirretyistä tapahtumista; taulukko näyttää kunkin ominaisuuden kertoimen ja AUC:n jokaisen askeleen jälkeen. Aikaprofiili: etukäteen valitun ominaisuuden tai taulukosta napsauttamasi ominaisuuden alla oleva painike laskee tapahtumat, joilla se on, puoli vuotta ennen tapahtumaa puoli vuotta sen jälkeen kuukauden välein, pylväinä sen mukaan, montako kertaa useammin kuin sattumalta; tapahtumaa edeltävä kuvio näkyy nollan vasemmalla puolella, sitä seuraava oikealla. Sattumataso: "muista kartoista samalla hetkellä" vertaa kutakin tapahtumaa samaan hetkeen muissa kartoissa (vähintään kolme) ja kysyy siten, onko päivämäärä epätavallinen, ei vain hetki elämässä; p-arvot ovat tarkkoja ja, kun karttoja on vähän, karkeita ja varovaisia. Tallennetut ajot: "Tallenna tämä ajo" tallentaa ajon nimellä, ja mitkä tahansa kaksi tallennettua ajoa voi panna rinnakkain, ja nähdä, montako ensimmäisessä pitäneistä ominaisuuksista pitää toisessakin, esimerkiksi karttojen lisäämisen jälkeen. Raportti: "Tallenna raportti (HTML)" tekee näytöllä olevasta ajosta yhden sivun: aineisto, menetelmä, vahvimmat tulokset korjattuine p-arvoineen ja varoitukset, joka tulostuu hyvin PDF:ksi selaimesta.',
      ],
    },
  },
  {
    id: 'nabhasa-yogas',
    section: 'analysis',
    q: { en: 'Which yogas does the yoga table detect, and what are the Nabhasa yogas?', fi: 'Mitkä yogat yogataulukko tunnistaa, ja mitä ovat Nabhasa-yogat?' },
    a: {
      en: [
        'ANALYSIS → Grahas → yoga.detection lists the yogas with the reason behind each, the grahas that make it and a strength. Besides the Pañcha Mahāpuruṣa, Raja, Dhana, solar and lunar yogas it has the 32 Nabhasa yogas of BPHS chapter 35, which look at where the seven grahas (the Sun to Saturn; the nodes are not counted) stand as a whole: the Ashraya yogas (Rajju, Musala, Nala: all in movable, fixed or dual signs), the Dala yogas (Maala: three Kendras that hold a benefic and no malefic; Sarpa: three that hold a malefic and no benefic), the 20 Akriti yogas, which name the houses the grahas occupy (every named house occupied and no other, which is stricter than JHora for Kamala, Vapi, Yupa, Shara, Shakti and Danda; Vajra and Yava are the exceptions: benefics in the 1st and 7th and malefics in the 4th and 10th, or the other way round, the other grahas anywhere) and the 7 Sankhya yogas, by the number of signs the grahas stand in (Gola 1, Yuga 2, Shoola 3, Kedara 4, Pasha 5, Dama 6, Veena or Vallaki 7). The Nabhasa Sakata is not the Sakata of the Moon and Jupiter, which the table also has. A Dala or Akriti yoga stops an Ashraya yoga (Saravali). BPHS says the Sankhya yogas do not operate when another Nabhasa yoga is derivable; here only a Dala or Akriti yoga stops them, because the Ashraya yogas hold whenever the grahas are in one sign and Gola could never arise.',
        'The table also has Gajakesari, Lakshmi, Maha Raja (the Lagna lord and the 5th lord exchange signs), Dharma-Karmadhipati (the 9th and 10th lords joined, exchanging or in mutual aspect), the Maha, Khala and Dainya Parivartanas (an exchange of signs between lords, classed by the houses), Harsha, Sarala and Vimala (the lord of the 6th, 8th or 12th in the 6th, 8th or 12th: Viparita Raja), Neecha Bhanga (the cancellation of a debilitation), Khadga, Kusuma and Matsya. Each row gives the reason it is, or is not, active. Where the texts differ the rule is one of them, and the Roadmap of the README lists the ones that are only as good as their source; a rule that needs a "strong" lord (Lakshmi, Kahala, Shankha, Bheri) counts one that is not debilitated and stands in its own, exaltation or friendly sign or in a Kendra or Trikona.',
        'From BPHS 36 and 37 the table has the Lagna yogas Subha and Asubha (a benefic or a malefic in the Lagna, or on both sides of it; both can hold, and the two-sided case is also given as Subha Kartari and Papa Kartari), the three Vasumati yogas (counted from the Moon, as BPHS does), Kemadruma and its cancellation Kemadruma Bhanga (a planet in a Kendra from the Lagna or the Moon cancels it, so the two never hold together), Varishta, Sama and Adhama (the Moon in an Apoklima, a Panaphara or a Kendra from the Sun; exactly one holds), Parvata, Kahala, Chamara, Shankha, Bheri, Mridanga, Srinatha, Sharada, Kurma (extremely rare), Kalanidhi, Kalpadruma, Hari, Hara, Brahma and Lagnaadhi; Parijata is Raman\'s and JHora\'s, read strictly here. BPHS means Shadbala by a "strong" lord, which the chart alone cannot show, so on realistic charts Kahala and Shankha hold in about three charts in ten, Kalpadruma in one in five, Mridanga in one in six, Bheri in one in thirteen and Lakshmi in one in thirty. The reasons name what failed (\'Lagna lord is debilitated\').',
      ],
      fi: [
        'ANALYYSI → Grahas → yoga.detection listaa yogat, kunkin syyn, sen muodostavat grahat ja voimakkuuden. Pañcha Mahāpuruṣa-, Raja-, Dhana-, aurinko- ja kuuyogien lisäksi siinä on BPHS:n luvun 35 32 Nabhasa-yogaa, jotka katsovat, missä seitsemän grahaa (Auringosta Saturnukseen; solmuja ei lasketa) ovat kokonaisuutena: Ashraya-yogat (Rajju, Musala, Nala: kaikki liikkuvissa, pysyvissä tai kaksoisluonteisissa merkeissä), Dala-yogat (Maala: kolme Kendraa, joissa on hyväntekijä eikä pahantekijää; Sarpa: kolme, joissa on pahantekijä eikä hyväntekijää), 20 Akriti-yogaa, jotka nimeävät grahojen miehittämät talot (jokainen nimetty talo miehitetty eikä yksikään muu, mikä on tiukempaa kuin JHorassa yogille Kamala, Vapi, Yupa, Shara, Shakti ja Danda; Vajra ja Yava ovat poikkeuksia: hyväntekijät 1. ja 7. talossa ja pahantekijät 4. ja 10. talossa tai päinvastoin, muut grahat missä tahansa) ja 7 Sankhya-yogaa grahojen miehittämien merkkien lukumäärän mukaan (Gola 1, Yuga 2, Shoola 3, Kedara 4, Pasha 5, Dama 6, Veena eli Vallaki 7). Nabhasa-Sakata ei ole Kuun ja Jupiterin Sakata, joka taulukossa on myös. Dala- tai Akriti-yoga estää Ashraya-yogan (Saravali). BPHS:n mukaan Sankhya-yogat eivät toimi, kun toinen Nabhasa-yoga on johdettavissa; tässä niitä estää vain Dala- tai Akriti-yoga, koska Ashraya-yogat pätevät aina, kun grahat ovat yhdessä merkissä, eikä Gola voisi koskaan syntyä.',
        'Taulukossa on myös Gajakesari, Lakshmi, Maha Raja (Lagnan herra ja 5. herra vaihtavat merkkiä), Dharma-Karmadhipati (9. ja 10. herra yhtymässä, vaihdossa tai keskinäisessä aspektissa), Maha-, Khala- ja Dainya-Parivartana (herrojen merkinvaihto, luokiteltuna talojen mukaan), Harsha, Sarala ja Vimala (6., 8. tai 12. herra 6., 8. tai 12. talossa: Viparita Raja), Neecha Bhanga (heikennyksen kumoutuminen), Khadga, Kusuma ja Matsya. Jokainen rivi kertoo syyn, miksi se on tai ei ole aktiivinen. Kun tekstit eroavat, sääntö on yksi niistä, ja READMEn Roadmap listaa ne, jotka ovat vain lähteensä veroisia; sääntö, joka vaatii "vahvan" herran (Lakshmi, Kahala, Shankha, Bheri), laskee sellaiseksi herran, joka ei ole heikennetty ja on omassa, korotus- tai ystävän merkissään tai Kendrassa tai Trikonassa.',
        'BPHS:n luvuista 36 ja 37 taulukossa on Lagna-yogat Subha ja Asubha (hyväntekijä tai pahantekijä Lagnassa tai sen molemmin puolin; molemmat voivat toteutua, ja kaksipuolinen tapaus on annettu myös nimillä Subha Kartari ja Papa Kartari), kolme Vasumati-yogaa (lasketaan Kuusta, kuten BPHS), Kemadruma ja sen kumoutuminen Kemadruma Bhanga (Kendrassa Lagnasta tai Kuusta oleva planeetta kumoaa sen, joten ne eivät koskaan toteudu yhtä aikaa), Varishta, Sama ja Adhama (Kuu Apoklimassa, Panapharassa tai Kendrassa Auringosta; täsmälleen yksi toteutuu), Parvata, Kahala, Chamara, Shankha, Bheri, Mridanga, Srinatha, Sharada, Kurma (erittäin harvinainen), Kalanidhi, Kalpadruma, Hari, Hara, Brahma ja Lagnaadhi; Parijata on Ramanin ja JHoran, ja sitä luetaan tässä tiukasti. BPHS tarkoittaa "vahvalla" herralla Shadbalaa, jota kartta ei yksin näytä, joten todellisissa kartoissa Kahala ja Shankha toteutuvat noin kolmessa kartassa kymmenestä, Kalpadruma yhdessä viidestä, Mridanga yhdessä kuudesta, Bheri yhdessä kolmestatoista ja Lakshmi yhdessä kolmestakymmenestä. Syyt kertovat, mikä ehto ei täyty (\'Lagnan herra on heikennetty\').',
      ],
    },
  },
  {
    id: 'pravesha',
    section: 'timing',
    q: { en: 'What are Nakṣatra Praveśa and Yoga Praveśa, and which return begins the year?', fi: 'Mitä ovat Nakṣatra Praveśa ja Yoga Praveśa, ja mikä paluu aloittaa vuoden?' },
    a: {
      en: [
        'They are yearly charts counted like Tithi Praveśa, which repeats the Sun–Moon distance of birth. Nakṣatra Praveśa is cast when the Moon returns to exactly its natal longitude (the same nakshatra, pada and place in it, to the arc-second); Yoga Praveśa when the sum of the sidereal longitudes of the Sun and the Moon returns to its natal value (the same yoga, with the same part of it spent). TIMING → Nakṣatra Praveśa and Yoga Praveśa give the chart, the moment, the end of the year, the vāra lord of the year, the lagna and the planets, with the year stepper, the place of residence and the natal overlay of Tithi Praveśa.',
        'The Moon is back at its place every 27.3 days and the sum every 25.4, about thirteen times a year, so a rule chooses the one that begins the year; the two buttons above the chart, Same month and Before birthday, switch between them. Same month (the default): the return inside the lunar month of birth, the last one at or before the Tithi Praveśa (the lunar birthday), or the first one when both come after it. Before birthday: the last return at or before the birthday, the birth date and time of day carried to the year. The sum of two sidereal longitudes depends on the ayanamsa twice, so the moment of Yoga Praveśa moves with the ayanamsa of Settings. Each also has a daśā of the year (beta): the 120 years of Vimśottarī compressed into the year. At Nakṣatra Praveśa the Moon stands where it did at birth, so the daśā of birth begins again, from the lord of the birth nakshatra with the same part of its period spent; Yoga Praveśa counts the yoga of birth like a nakshatra (the 1st yoga as Ashwini, and so on round the nine lords) with the part of the yoga spent as the part of the period spent.',
        'TIMING → Year at a glance puts Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa and Varṣaphala side by side: a table with the moment each year begins and ends, the lord of the year and the lagna, and bars on one time axis, where the weeks between the starts can be seen at once. The year stepper, the place of residence and the Same month / Before birthday choice of the Nakṣatra and Yoga Praveśa work as in their own tabs.',
      ],
      fi: [
        'Ne ovat vuosikarttoja, jotka lasketaan kuten Tithi Praveśa, joka toistaa syntymän Auringon ja Kuun välisen etäisyyden. Nakṣatra Praveśa lasketaan hetkelle, jolloin Kuu palaa täsmälleen syntymän pituuteensa (sama nakshatra, pada ja kohta siinä, kaarisekuntiin asti); Yoga Praveśa hetkelle, jolloin Auringon ja Kuun sideeristen pituuksien summa palaa syntymän arvoonsa (sama yoga ja sama osa siitä kulunut). AJANKOHTA → Nakṣatra Praveśa ja Yoga Praveśa näyttävät kartan, hetken, vuoden lopun, vuoden vāra-herran, lagnan ja planeetat sekä vuosivalitsimen, asuinpaikan ja natal-peiton kuten Tithi Praveśa.',
        'Kuu on takaisin paikallaan 27,3 vuorokauden välein ja summa 25,4:n, eli noin kolmetoista kertaa vuodessa, joten sääntö valitsee sen, joka aloittaa vuoden; kartan yläpuolella olevat painikkeet Sama kuukausi ja Ennen syntymäpäivää vaihtavat niiden välillä. Sama kuukausi (oletus): syntymän kuukauden sisällä oleva paluu, viimeinen Tithi Praveśaa (kuun syntymäpäivää) edeltävä tai sen hetkellä, tai ensimmäinen, jos molemmat ovat sen jälkeen. Ennen syntymäpäivää: viimeinen paluu syntymäpäivää edeltävänä tai sen hetkenä, kun syntymäaika ja kellonaika siirretään vuoteen. Kahden sideerisen pituuden summa riippuu ayanamsasta kahdesti, joten Yoga Praveśan hetki siirtyy Asetusten ayanamsan mukana. Kummallekin on myös vuoden daśā (beeta): Vimśottarīn 120 vuotta puristettuna vuoteen. Nakṣatra Praveśassa Kuu on siellä, missä se oli syntymässä, joten syntymän daśā alkaa uudelleen syntymän nakshatran herrasta ja sen jaksosta on kulunut sama osa; Yoga Praveśa laskee syntymän yogan kuten nakshatran (1. yoga kuten Ashwini, ja niin edelleen yhdeksän herran kierros), ja yogasta kulunut osa on jaksosta kulunut osa.',
        'AJANKOHTA → Vuosi yhdellä silmäyksellä asettaa Tithi Praveśan, Nakṣatra Praveśan, Yoga Praveśan ja Varṣaphalan rinnakkain: taulukossa on hetki, jolloin kukin vuosi alkaa ja päättyy, vuoden herra ja lagna, ja palkit samalla aika-akselilla, jolla alkujen väliset viikot näkyvät yhdellä silmäyksellä. Vuosivalitsin, asuinpaikka ja Nakṣatra- ja Yoga Praveśan valinta Sama kuukausi / Ennen syntymäpäivää toimivat kuten omissa välilehdissään.',
      ],
    },
  },
  {
    id: 'sunrise',
    section: 'analysis',
    q: { en: 'Which sunrise do the special lagnas and sphutas use?', fi: 'Mitä auringonnousua erikoislagnat ja sphuṭat käyttävät?' },
    a: {
      en: [
        'The Bhava, Hora, Ghati, Vighati and Prana lagnas and the other sphutas run on the time since sunrise. Settings → calculations → sunrise for the special sphutas chooses between the true sunrise (the default, the one an almanac gives) and the mean-time sunrise (the true sunrise plus the equation of time, which is about 12 minutes in October). If another program or a book uses a sunrise of its own, type it in the field below the choice, Use another sunrise (HH:MM:SS). It replaces the calculated sunrise everywhere at once: in the charts, the graha table and ANALYSIS → Special Sphutas, which show the same values. The special lagnas on the charts (HL, BL, GL, SL, PP, ViL) are six of the twelve special sphutas; the Special Sphutas table also has Bhrigu Bindu, Arudha, Indu, Varnada and the 22nd Drekkana and 64th Navamsa.',
      ],
      fi: [
        'Bhava-, Hora-, Ghati-, Vighati- ja Prana-lagnat sekä muut sphuṭat kulkevat auringonnoususta kuluvan ajan mukaan. Asetukset → laskenta → auringonnousu erikoissphuṭoille valitsee todellisen auringonnousun (oletus, almanakan antama) ja keskiaikaisen auringonnousun (todellinen auringonnousu plus aikayhtälö, noin 12 minuuttia lokakuussa) välillä. Jos toinen ohjelma tai kirja käyttää omaa auringonnousuaan, kirjoita se valinnan alla olevaan kenttään Käytä toista auringonnousua (HH:MM:SS). Se korvaa lasketun auringonnousun kaikkialla yhtä aikaa: kartoissa, graha-taulukossa ja välilehdellä ANALYSIS → Special Sphutas, jotka näyttävät samat arvot. Kartoilla näkyvät erikoislagnat (HL, BL, GL, SL, PP, ViL) ovat kuusi kahdestatoista erikoissphuṭasta; Special Sphutas -taulukossa on lisäksi Bhrigu Bindu, Arudha, Indu, Varnada sekä 22. drekkana ja 64. navamsa.',
      ],
    },
  },

  // ── Palm ───────────────────────────────────────────────────────────
  {
    id: 'palm-photos',
    section: 'palm',
    q: { en: 'How do I add a palm photograph?', fi: 'Miten lisään kuvan kämmenestä?' },
    a: {
      en: [
        'Open LIFE and press Upload photos, or drop a picture on the page. On a phone, Take a photo opens the camera. Give the photograph a name and say whether it is the right or the left hand. A photograph is deleted with the 🗑 button, after a confirmation.',
        'The photographs stay on your device, in the browser; nothing is sent anywhere. Clearing the browser data deletes them, so keep a backup (see below) or a copy as a picture.',
      ],
      fi: [
        'Avaa ELÄMÄ-työtila ja paina Lataa kuvia tai pudota kuva sivulle. Puhelimessa Ota kuva avaa kameran. Anna kuvalle nimi ja kerro, onko se oikea vai vasen käsi. Kuva poistetaan 🗑-painikkeella vahvistuksen jälkeen.',
        'Kuvat pysyvät laitteellasi, selaimessa; mitään ei lähetetä minnekään. Selaimen tietojen tyhjennys poistaa ne, joten säilytä varmuuskopio (katso alla) tai kopio kuvana.',
      ],
    },
  },
  {
    id: 'palm-draw',
    section: 'palm',
    q: { en: 'How do I draw on the palm?', fi: 'Miten piirrän kämmenen päälle?' },
    a: {
      en: [
        'The tools are Move (to pan the picture), Select, Pen, Line, Arrow, Circle, Ellipse, Ruler, Pin, Text and Eraser. Choose a colour, and set the thickness of the line with the stroke slider. Pins are numbered; give any drawing a note and it is numbered too. Undo and Redo step through the changes; Delete removes the selected drawing. Zoom in, Zoom out and Fit to window change the view.',
        'Circle is always a true circle: drag from its centre to its edge. Ellipse is drawn in a box and can be oval.',
        'Ruler measures between two points and divides the line into 1 to 12 equal parts with marks; with two parts it marks the middle. It writes its length and the length of one part, in pixels of the photograph, so two rulers can be compared. If you know the real length of one ruler (a finger of 7 cm, say), select it, type the length in centimetres and press Use as the scale of the photograph: every ruler of that photograph then speaks in centimetres, and the scale is shown in the side panel until you clear it. A new drawing that starts or ends near a mark of a ruler, the middle of a line or the centre of a circle catches on it, so a pin can be put exactly in the middle; the snap button switches this off.',
        'A pen stroke, a line or an arrow can carry ages, such as the years of a life line: select it, tick Ages along the line, and give the age at its start, the age at its end and a mark every so many years (0 to 70, every 10 is the usual). The ages are spread evenly along the length of the line, each with a small mark across it and the number beside it.',
        'Eraser wipes: a pen stroke or a line is cut where the eraser passes, and any other drawing it touches is removed whole. The eraser has its own size slider, and one wipe is one undo step.',
        'Select moves a drawing, and its dots change it: drag an end of a line, an arrow or a ruler, the edge of a circle, a corner of an ellipse or any point of a pen stroke. The Move or reshape button beside the name of a new drawing takes you there. The colours and the stroke slider change the selected drawing.',
      ],
      fi: [
        'Työkalut ovat Siirrä (kuvan siirtäminen), Valitse, Kynä, Viiva, Nuoli, Ympyrä, Ellipsi, Mitta, Nasta, Teksti ja Pyyhekumi. Valitse väri ja säädä viivan paksuutta paksuusliukusäätimellä. Nastat numeroidaan; anna piirrokselle merkintä, niin se numeroidaan myös. Kumoa ja Tee uudelleen kulkevat muutosten läpi; Poista poistaa valitun piirroksen. Lähennä, Loitonna ja Sovita ikkunaan muuttavat näkymää.',
        'Ympyrä on aina oikea ympyrä: vedä sen keskipisteestä reunaan. Ellipsi piirretään laatikkoon, ja se voi olla soikea.',
        'Mitta mittaa kahden pisteen välin ja jakaa viivan 1–12 yhtä pitkään osaan merkeillä; kahdella osalla se merkitsee keskikohdan. Se kirjoittaa pituutensa ja yhden osan pituuden valokuvan pikseleinä, joten kahta mittaa voi verrata keskenään. Jos tiedät yhden mitan todellisen pituuden (esimerkiksi 7 cm:n sormi), valitse se, kirjoita pituus senteissä ja paina Käytä kuvan mittakaavana: kaikki kyseisen kuvan mitat kertovat silloin pituutensa senttimetreinä, ja mittakaava näkyy sivupaneelissa, kunnes tyhjennät sen. Uusi piirros, joka alkaa tai päättyy lähelle mitan merkkiä, viivan keskikohtaa tai ympyrän keskipistettä, tarttuu siihen, joten nastan voi laittaa tarkasti keskelle; tartu-painike kytkee tämän pois.',
        'Kynäviivalle, viivalle tai nuolelle voi merkitä ikiä, esimerkiksi elämänviivan vuosia: valitse se, rastita Iät viivan varrella ja anna ikä sen alussa, ikä sen lopussa ja merkki joka montako vuotta (0–70, joka 10. on tavallinen). Iät jaetaan tasaisesti viivan pituudelle, ja kullakin on pieni poikkiviiva ja numero vieressä.',
        'Pyyhekumi pyyhkii: kynäviiva tai viiva katkaistaan kohdasta, jossa pyyhekumi kulkee, ja mikä tahansa muu piirros, johon se osuu, poistetaan kokonaan. Pyyhekumilla on oma kokoliukusäädin, ja yksi pyyhkäisy on yksi kumoamisaskel.',
        'Valitse siirtää piirrosta, ja sen pisteet muuttavat sitä: vedä viivan, nuolen tai mitan päätä, ympyrän reunaa, ellipsin kulmaa tai mitä tahansa kynäviivan pistettä. Uuden piirroksen nimen vieressä oleva Siirrä tai muokkaa -painike vie siihen. Värit ja paksuusliukusäädin muuttavat valittua piirrosta.',
      ],
    },
  },
  {
    id: 'palm-export',
    section: 'palm',
    q: { en: 'How do I keep or show the marked-up palm?', fi: 'Miten säilytän tai näytän merkityn kämmenen?' },
    a: {
      en: [
        'Download PNG saves the picture with the drawings; with notes under the picture on, the notes are written under it. Client view shows the palm to the client: the notes one at a time with Previous note and Next note, and Whole palm for the full picture. Close client view returns to the editor.',
      ],
      fi: [
        'Lataa PNG tallentaa kuvan piirroksineen; kun merkinnät kuvan alle on päällä, merkinnät kirjoitetaan kuvan alle. Asiakasnäkymä näyttää kämmenen asiakkaalle: merkinnät yksi kerrallaan Edellinen merkintä- ja Seuraava merkintä -painikkeilla sekä Koko kämmen koko kuvalle. Sulje asiakasnäkymä palaa muokkaukseen.',
      ],
    },
  },

  {
    id: 'palm-compare',
    section: 'palm',
    q: { en: 'How do I compare two hands?', fi: 'Miten vertaan kahta kättä?' },
    a: {
      en: [
        'With two or more photographs in LIFE, the Compare button shows two of them side by side, with their drawings. The open photograph is on the left and, if you have said which hand each one is, the other hand on the right; either side can be changed from its list.',
        'The zoom and the place are shared: zoom or move one photograph and the other goes to the same place at the same zoom, even when the two photographs are different shapes. Fit to window on either one fits both. Untick link the zoom to move them separately.',
      ],
      fi: [
        'Kun KÄMMEN-näkymässä on kaksi tai useampi kuva, Vertaile-painike näyttää kaksi niistä vierekkäin piirroksineen. Avoin kuva on vasemmalla ja, jos olet kertonut, mikä käsi kukin on, toinen käsi oikealla; kumpaakin puolta voi vaihtaa sen omasta listasta.',
        'Zoomaus ja paikka ovat yhteiset: lähennä tai siirrä toista kuvaa, ja toinen siirtyy samaan paikkaan samalle zoomille, vaikka kuvat olisivat eri muotoisia. Sovita ikkunaan kummalla tahansa sovittaa molemmat. Poista rasti kohdasta linkitä zoomaus, niin niitä voi liikuttaa erikseen.',
      ],
    },
  },

  // ── Screen layout and recording ────────────────────────────────────
  {
    id: 'split',
    section: 'workspace',
    q: { en: 'How do I see CHART, TIMING, ANALYSIS and LIFE at the same time?', fi: 'Miten näen KARTAN, AJANKOHDAN, ANALYYSIN ja ELÄMÄ-työtilan yhtä aikaa?' },
    a: {
      en: [
        'Press ⊞ split beside the workspaces. The workspaces become switches, and every one that is on is shown side by side. With more than two panes you can choose one row or two rows, or leave it to the screen. On a phone the panes are stacked one under the other. Settings stays a screen of its own.',
        'The panes keep their natural height and the page scrolls, so each can be read whole.',
      ],
      fi: [
        'Paina työtilojen vieressä olevaa ⊞ split -painiketta. Työtilat muuttuvat kytkimiksi, ja jokainen päällä oleva näytetään rinnakkain. Kun ruutuja on yli kaksi, voit valita yhden tai kaksi riviä tai jättää valinnan näytölle. Puhelimessa ruudut pinotaan allekkain. Asetukset pysyy omana näkymänään.',
        'Ruudut säilyttävät luonnollisen korkeutensa ja sivu vierittyy, joten jokaisen voi lukea kokonaisena.',
      ],
    },
  },
  {
    id: 'full',
    section: 'workspace',
    q: { en: 'What does the full button do?', fi: 'Mitä full-painike tekee?' },
    a: {
      en: [
        'TIMING, ANALYSIS and LIFE each have a ⤢ full button. It gives the workspace the whole width of a wide screen and the chart steps aside; ⤡ narrow brings the chart back. Each workspace remembers its own choice.',
      ],
      fi: [
        'AJANKOHDALLA, ANALYYSILLA ja ELÄMÄ-työtilalla on kullakin ⤢ full -painike. Se antaa työtilalle leveän näytön koko leveyden ja kartta väistyy; ⤡ narrow tuo kartan takaisin. Jokainen työtila muistaa oman valintansa.',
      ],
    },
  },
  {
    id: 'recording',
    section: 'workspace',
    q: { en: 'How do I record the screen while I explain a chart or a palm?', fi: 'Miten tallennan ruudun, kun kerron kartasta tai kämmenestä?' },
    a: {
      en: [
        'Press rec in the top bar. The browser asks what to record: choose this tab to record the chart or the palm drawing. The 🎙 button beside it decides whether your voice is recorded too (🔇 means no voice).',
        'While recording, the red clock stops the recording, and ⏸ pauses it and ▶ continues. When you stop, a card shows the video: watch it, press Download video to save it as a .webm or .mp4 file, or Discard to throw it away. Stopping the sharing in the browser\'s own bar ends the recording too.',
        'The video stays in the memory of the browser until you download it, and it is lost if you close the page first (the browser warns you). Nothing is uploaded anywhere.',
      ],
      fi: [
        'Paina yläpalkin rec-painiketta. Selain kysyy, mitä tallennetaan: valitse tämä välilehti tallentaaksesi kartan tai kämmenpiirroksen. Sen vieressä oleva 🎙-painike päättää, tallennetaanko myös äänesi (🔇 tarkoittaa ei ääntä).',
        'Tallennuksen aikana punainen kello lopettaa tallennuksen, ⏸ keskeyttää sen ja ▶ jatkaa. Kun lopetat, kortti näyttää videon: katso se, tallenna se Lataa video -painikkeella .webm- tai .mp4-tiedostoksi tai hylkää se. Myös jaon lopettaminen selaimen omasta palkista päättää tallennuksen.',
        'Video pysyy selaimen muistissa, kunnes lataat sen, ja katoaa, jos suljet sivun ensin (selain varoittaa). Mitään ei lähetetä minnekään.',
      ],
    },
  },
  {
    id: 'no-rec',
    section: 'workspace',
    q: { en: 'There is no rec button. Why?', fi: 'Rec-painiketta ei ole. Miksi?' },
    a: {
      en: [
        'The button is shown only where the browser can record the screen. Phone browsers cannot, so use a computer (Chrome, Edge, Firefox or Safari on the desktop). On a phone you can use the recorder of the phone itself.',
      ],
      fi: [
        'Painike näkyy vain siellä, missä selain voi tallentaa ruudun. Puhelinten selaimet eivät voi, joten käytä tietokonetta (Chrome, Edge, Firefox tai Safari työpöydällä). Puhelimessa voit käyttää puhelimen omaa näytöntallenninta.',
      ],
    },
  },

  // ── Saving, backup and privacy ─────────────────────────────────────
  {
    id: 'saving',
    section: 'data',
    q: { en: 'How do I save a chart?', fi: 'Miten tallennan kartan?' },
    a: {
      en: [
        'The chart actions in the top bar are NEW, LOAD, SAVE, SAVE AS, EXPORT and IMPORT. SAVE AS gives the chart a name and keeps it in this browser; LOAD opens a saved chart; SAVE stores new changes to the open one. NEW starts again (it asks first, so a chart is not lost by mistake).',
        'SAVE AS also asks for a client (optional). A client can be a person with several charts or a family. LOAD shows the charts in groups by client, the clients in alphabetical order and the charts of no client last; the client button on a chart moves it to another client, and the search finds a client by name too. The event list of a chart is kept with that chart\'s birth moment, so it follows the chart into its group. With more than four saved charts LOAD also has the search and the order (latest first or by name).',
        'EXPORT writes all the saved charts to one file, bcp-charts-export.json, and IMPORT reads such a file back, for example on another device. IMPORT adds the charts of the file to the ones already saved and says how many it added, in a note on the screen; restoring a backup in Settings replaces everything instead.',
      ],
      fi: [
        'Yläpalkin kartan toiminnot ovat UUSI, AVAA, TALLENNA, TALLENNA NIMELLÄ, VIE ja TUO. TALLENNA NIMELLÄ antaa kartalle nimen ja säilyttää sen tässä selaimessa; AVAA avaa tallennetun kartan; TALLENNA tallentaa uudet muutokset avattuun karttaan. UUSI aloittaa alusta (se kysyy ensin, ettei karttaa menetetä vahingossa).',
        'TALLENNA NIMELLÄ kysyy myös asiakasta (valinnainen). Asiakas voi olla henkilö, jolla on useita karttoja, tai perhe. AVAA näyttää kartat asiakkaittain ryhmiteltynä: asiakkaat aakkosjärjestyksessä ja ilman asiakasta olevat kartat viimeisinä; kartan asiakas-painike siirtää sen toiselle asiakkaalle, ja haku löytää asiakkaan myös nimellä. Kartan tapahtumalista säilytetään kartan syntymähetken mukaan, joten se seuraa karttaa ryhmään. Kun tallennettuja karttoja on yli neljä, AVAA:ssa on myös haku ja järjestys (uusin ensin tai nimen mukaan).',
        'VIE kirjoittaa kaikki tallennetut kartat yhteen tiedostoon, bcp-charts-export.json, ja TUO lukee sellaisen tiedoston takaisin, esimerkiksi toisella laitteella. TUO lisää tiedoston kartat jo tallennettujen joukkoon ja kertoo ruudulla näkyvässä ilmoituksessa, montako se lisäsi; varmuuskopion palautus Asetuksissa korvaa sen sijaan kaiken.',
      ],
    },
  },
  {
    id: 'backup',
    section: 'data',
    q: { en: 'How do I back up everything?', fi: 'Miten varmuuskopioin kaiken?' },
    a: {
      en: [
        'Settings → Full local backup. Download backup saves one file with the saved charts, all the event lists, the calculation and display settings, the dasha methods and, unless you switch it off, the palm photographs with their drawings. To restore, press Choose backup and pick the file, then Replace and restore; this replaces what is in the browser now, the palm photographs too when the file has them.',
        'You can protect a backup with a password: type one before pressing Download backup. The file is encrypted in your browser (AES-GCM) and the password is sent nowhere. A lost password cannot be recovered. To open an encrypted file, press Choose backup and enter the password.',
        'A backup with photographs can be large (a photograph is about a megabyte). If you only want a copy of a marked-up palm to show or send, Download PNG saves the picture on its own.',
      ],
      fi: [
        'Asetukset → Täysi paikallinen varmuuskopio. Lataa varmuuskopio tallentaa yhden tiedoston, jossa ovat tallennetut kartat, kaikki tapahtumalistat, laskenta- ja näyttöasetukset, daśā-menetelmät ja, ellet kytke sitä pois, kämmenkuvat piirroksineen. Palauta painamalla Valitse varmuuskopio ja valitsemalla tiedosto, sitten Korvaa ja palauta; tämä korvaa sen, mitä selaimessa nyt on, ja kämmenkuvat myös, kun tiedostossa on niitä.',
        'Voit suojata varmuuskopion salasanalla: kirjoita salasana ennen Lataa varmuuskopio -painikkeen painamista. Tiedosto salataan selaimessasi (AES-GCM), eikä salasana lähde minnekään. Kadonnutta salasanaa ei voi palauttaa. Salattu tiedosto avataan Valitse varmuuskopio -painikkeella ja antamalla salasana.',
        'Kuvia sisältävä varmuuskopio voi olla iso (yksi valokuva on noin megatavun verran). Jos haluat vain kopion merkitystä kämmenestä näytettäväksi tai lähetettäväksi, Lataa PNG tallentaa kuvan sellaisenaan.',
      ],
    },
  },
  {
    id: 'privacy',
    section: 'data',
    q: { en: 'What is sent anywhere, and what stays on my device?', fi: 'Mitä lähetetään jonnekin ja mikä pysyy laitteellani?' },
    a: {
      en: [
        'Saved charts, settings and notes are kept in the browser (local storage), and the palm photographs in the browser\'s database. The recorded videos are only in memory. None of these leaves your device.',
        'Two things go over the network: the city you look up is sent, through this app\'s server, to the Open-Meteo geocoding service to find the place, and the birth data is sent to this app\'s own server to be calculated with the Swiss Ephemeris. There is no account, and the app does not ask for your name or your email.',
      ],
      fi: [
        'Tallennetut kartat, asetukset ja merkinnät säilytetään selaimessa (paikallinen tallennustila) ja kämmenkuvat selaimen tietokannassa. Tallennetut videot ovat vain muistissa. Mikään näistä ei lähde laitteeltasi.',
        'Kaksi asiaa kulkee verkon yli: hakemasi kaupunki lähetetään tämän sovelluksen palvelimen kautta Open-Meteon paikannuspalveluun paikan löytämiseksi, ja syntymätiedot lähetetään sovelluksen omalle palvelimelle laskettavaksi Swiss Ephemeris -kirjastolla. Tiliä ei ole, eikä sovellus kysy nimeäsi tai sähköpostiosoitettasi.',
      ],
    },
  },
  {
    id: 'other-device',
    section: 'data',
    q: { en: 'How do I move my charts to another device or browser?', fi: 'Miten siirrän kartat toiselle laitteelle tai selaimeen?' },
    a: {
      en: [
        'Everything is kept in one browser on one device, so another one starts empty. Download a backup (or EXPORT the charts) on the first, open the app on the second, and restore the backup (or IMPORT the file) there.',
      ],
      fi: [
        'Kaikki säilytetään yhdessä selaimessa yhdellä laitteella, joten toinen alkaa tyhjänä. Lataa varmuuskopio (tai VIE kartat) ensimmäisellä, avaa sovellus toisella ja palauta varmuuskopio (tai TUO tiedosto) siellä.',
      ],
    },
  },

  {
    id: 'client-report',
    section: 'data',
    q: { en: 'How do I make a report for a client?', fi: 'Miten teen raportin asiakkaalle?' },
    a: {
      en: [
        'Press REPORT in the top bar (on a phone, in the ⋮ menu). The report is a white page with the chart, the graha positions, the timing summary for the target date and every palm photograph with its drawing and its numbered notes. Tick what goes in it, give it a title, say who it is prepared for and add remarks at the end.',
        'Press Print / PDF: the browser\'s print window opens, and choosing Save as PDF as the printer makes a file named after the title. Only the report is printed, on as many pages as it needs, whatever theme the app is in. The timing summary is calculated when the report opens, so give it a moment before you print.',
      ],
      fi: [
        'Paina yläpalkin RAPORTTI-painiketta (puhelimessa ⋮-valikosta). Raportti on valkoinen sivu, jolla ovat kartta, grahojen sijainnit, ajankohtayhteenveto tavoitepäivälle sekä jokainen kämmenkuva piirroksineen ja numeroituine merkintöineen. Rastita, mitä siihen otetaan, anna sille otsikko, kerro, kenelle se on laadittu, ja lisää huomautukset loppuun.',
        'Paina Tulosta / PDF: selaimen tulostusikkuna aukeaa, ja kun valitset tulostimeksi Tallenna PDF:nä, syntyy otsikon mukaan nimetty tiedosto. Vain raportti tulostuu, niin monelle sivulle kuin se tarvitsee, riippumatta siitä, mikä teema sovelluksessa on. Ajankohtayhteenveto lasketaan raportin avautuessa, joten anna sille hetki ennen tulostusta.',
      ],
    },
  },
  {
    id: 'share-link',
    section: 'data',
    q: { en: 'How do I give a chart to someone else?', fi: 'Miten annan kartan jollekulle toiselle?' },
    a: {
      en: [
        'Press SHARE in the top bar (on a phone, in the ⋮ menu). It copies a link that holds the birth date and time, the place and the time zone. Whoever opens the link gets the form filled in and the chart calculated, with their own settings; nothing else of yours goes with it.',
        'The data is in the part of the address after the #, which the browser never sends to a server, but anyone who has the link can read it, so give it only to the person it is for. The link does not stay in the address bar after it has been opened.',
      ],
      fi: [
        'Paina yläpalkin JAA-painiketta (puhelimessa ⋮-valikosta). Se kopioi linkin, jossa ovat syntymäaika ja kellonaika, paikka ja aikavyöhyke. Linkin avaaja saa lomakkeen täytettynä ja kartan laskettuna omilla asetuksillaan; mitään muuta sinun tiedoistasi ei mene mukana.',
        'Tiedot ovat osoitteen #-merkin jälkeisessä osassa, jota selain ei koskaan lähetä palvelimelle, mutta jokainen, jolla on linkki, voi lukea ne, joten anna se vain sille, jolle se on tarkoitettu. Linkki ei jää osoiteriville sen jälkeen, kun se on avattu.',
      ],
    },
  },

  // ── Settings and calculations ──────────────────────────────────────
  {
    id: 'language',
    section: 'settings',
    q: { en: 'How do I change the language or the names of the grahas?', fi: 'Miten vaihdan kielen tai grahojen nimet?' },
    a: {
      en: [
        'Settings → display → language: English or Suomi. This guide follows the same choice and has its own language switch at the top. Settings → display → graha names chooses English names (Sun, Moon, Mars …) or Sanskrit ones (Sūrya, Candra, Maṅgala …). Sanskrit terms such as daśā, varga and the nakshatras are the same in both languages, and so are the names of the grahas and signs in the tables unless the graha names are changed. Everything else in the panels — their headings, descriptions, table headers, buttons and the sentences the calculations write, such as the reasons of the yogas and the notes of the daśā systems — is in Finnish when Suomi is chosen.',
        'The dark and light mode is switched with the button at the top right.',
      ],
      fi: [
        'Asetukset → näyttö → kieli: English tai Suomi. Tämä opas seuraa samaa valintaa, ja sillä on oma kielenvaihto ylhäällä. Asetukset → näyttö → grahojen nimet valitsee englanninkieliset nimet (Sun, Moon, Mars …) tai sanskritinkieliset (Sūrya, Candra, Maṅgala …). Sanskritin termit, kuten daśā, varga ja nakshatrat, ovat samat molemmilla kielillä, samoin grahojen ja merkkien nimet taulukoissa, ellei grahojen nimiä vaihdeta. Kaikki muu paneeleissa — otsikot, selitykset, taulukoiden otsikot, painikkeet ja laskennan kirjoittamat lauseet, kuten joogien perustelut ja daśā-järjestelmien huomautukset — on suomeksi, kun Suomi on valittu.',
        'Tumma ja vaalea tila vaihdetaan oikeasta yläkulmasta löytyvällä painikkeella.',
      ],
    },
  },
  {
    id: 'ayanamsa',
    section: 'settings',
    q: { en: 'Which ayanamsa and which nodes does it use?', fi: 'Mitä ayanamsaa ja solmuja se käyttää?' },
    a: {
      en: [
        'The default is the Lahiri ayanamsa, whole-sign houses and the mean node. Settings → calculations has many ayanamsas to choose from, and the Rahu and Ketu can be the mean or the true node.',
      ],
      fi: [
        'Oletuksena on Lahiri-ayanamsa, kokonaiset merkkitalot ja keskisolmu. Asetukset → laskenta tarjoaa monta ayanamsaa, ja Rahu ja Ketu voivat olla keski- tai todellinen solmu.',
      ],
    },
  },

  {
    id: 'accuracy',
    section: 'settings',
    q: { en: 'How accurate are the calculations, and how are they checked?', fi: 'Kuinka tarkkoja laskelmat ovat ja miten ne tarkistetaan?' },
    a: {
      en: [
        'The positions come from the Swiss Ephemeris. Every change of the app is tested against thirteen charts cast by another Jyotish program, PyJHora (both hemispheres, latitudes from Sydney to Oulu, birth years 1899 to 2035), and against the moments of the equinoxes, solstices and new and full Moons that the astronomical almanacs give. The Sun is within 1 arcsecond of the almanacs, and the grahas and the ascendant of a chart agree with the other program to about 2 arcseconds.',
        'One difference of convention is known. The app takes the apparent tropical longitude, which includes the nutation, and subtracts the mean ayanamsa, as the other program that the Special Sphutas were checked against does too. Every longitude of a chart is therefore moved by the same small amount, at most 17 arcseconds (0.005°), from the Swiss Ephemeris\'s own sidereal positions, which PyJHora gives. It matters only when a point is within a few arcseconds of a sign or a degree boundary.',
        'The Vimsottari dates count a year as 365.25 days; given the same Moon, they are within about a day of PyJHora\'s dates a hundred years on.',
      ],
      fi: [
        'Sijainnit tulevat Swiss Ephemeriksestä. Jokainen sovelluksen muutos testataan kolmeätoista kartta vastaan, jotka toinen Jyotish-ohjelma, PyJHora, on laskenut (molemmat pallonpuoliskot, leveysasteet Sydneystä Ouluun, syntymävuodet 1899–2035), sekä tasausten, päivänseisausten sekä uuden- ja täydenkuun hetkiä vastaan, jotka tähtitieteelliset almanakat antavat. Aurinko on 1 kaarisekunnin sisällä almanakoista, ja kartan grahat ja lagna ovat noin 2 kaarisekunnin sisällä toisesta ohjelmasta.',
        'Yksi käytäntöero tunnetaan. Sovellus ottaa näennäisen tropiikkisen pituuden, jossa nutaatio on mukana, ja vähentää siitä keskimääräisen ayanamsan, kuten tekee myös toinen ohjelma, jota vasten erikoissphuṭat tarkistettiin. Kartan jokainen pituus on siksi siirtynyt saman pienen määrän, enintään 17 kaarisekuntia (0,005°), Swiss Ephemeriksen omista sideerisistä sijainneista, joita PyJHora antaa. Sillä on merkitystä vain, kun piste on muutaman kaarisekunnin päässä merkin tai asteen rajasta.',
        'Vimsottari-päivät laskevat vuoden 365,25 päiväksi; samalla Kuulla ne ovat sadan vuoden päässä noin vuorokauden sisällä PyJHoran päivistä.',
      ],
    },
  },

  // ── When something does not work ───────────────────────────────────
  {
    id: 'city-not-found',
    section: 'trouble',
    q: { en: 'The city is not found.', fi: 'Kaupunkia ei löydy.' },
    a: {
      en: [
        'Try the English name of the place, or a bigger town nearby. If you know the coordinates, press the edit button on the data line and type the latitude and the longitude; then set the UTC offset by hand as well if the time zone is not found.',
      ],
      fi: [
        'Kokeile paikan englanninkielistä nimeä tai lähellä olevaa isompaa kaupunkia. Jos tiedät koordinaatit, paina tietorivin muokkauspainiketta ja kirjoita leveys- ja pituusaste; aseta sitten myös UTC-ero käsin, jos aikavyöhykettä ei löydy.',
      ],
    },
  },
  {
    id: 'lost-charts',
    section: 'trouble',
    q: { en: 'My saved charts are gone.', fi: 'Tallennetut karttani ovat kadonneet.' },
    a: {
      en: [
        'The charts live in the browser. They are not there if you open the app in another browser or on another device, in a private window, or after the browser data has been cleared. Restore them from a backup or an export file. Download a backup now and then to be safe.',
      ],
      fi: [
        'Kartat asuvat selaimessa. Niitä ei ole, jos avaat sovelluksen toisessa selaimessa tai toisella laitteella, yksityisessä ikkunassa tai sen jälkeen, kun selaimen tiedot on tyhjennetty. Palauta ne varmuuskopiosta tai vientitiedostosta. Lataa varmuuskopio silloin tällöin varmuuden vuoksi.',
      ],
    },
  },
  {
    id: 'versions',
    section: 'trouble',
    q: { en: 'Which version is this, and what has changed?', fi: 'Mikä versio tämä on ja mitä on muuttunut?' },
    a: {
      en: [
        'The version is at the bottom of the page, beside the name of the app. Settings → updates lists what each version changed, and Settings → about has the name and the maker.',
      ],
      fi: [
        'Versio on sivun alareunassa sovelluksen nimen vieressä. Asetukset → päivitykset luettelee, mitä kukin versio muutti, ja Asetukset → tietoja kertoo nimen ja tekijän.',
      ],
    },
  },
];

const stripMarks = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Lower case without diacritics, so "dasha" finds "daśā" and "karakamsa" finds "kāraka". */
export function normalizeSearch(text: string): string {
  return stripMarks(text.toLowerCase());
}

function searchText(entry: FaqEntry, language: Language): string {
  return normalizeSearch([entry.q[language], ...entry.a[language]].join(' '));
}

/**
 * The entries that match a search: every word of the query must be somewhere in the question or the answer
 * (in the language shown). An empty query matches everything.
 */
export function filterFaq(entries: FaqEntry[], query: string, language: Language): FaqEntry[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return entries;
  return entries.filter(entry => {
    const text = searchText(entry, language);
    return words.every(word => text.includes(word));
  });
}
