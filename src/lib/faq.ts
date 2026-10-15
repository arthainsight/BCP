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
        'The Paraya grahas Jupiter, Saturn, Ketu and Rahu are moved through the signs by age and shown on the chart. The paraya chips in the chart display menu choose them one at a time or all together. In Settings → calculations you choose how long Saturn and Rahu stay in each sign; either way a round takes 30 years for Saturn and 18 for Rahu. TIMING → Transit Hits lists when they reach a natal graha or the ascendant.',
      ],
      fi: [
        'Paraya-grahat Jupiter, Saturnus, Ketu ja Rahu kuljetetaan merkkien läpi iän mukaan ja näytetään kartalla. Kartan näyttö -valikon paraya-painikkeilla ne valitaan yksi kerrallaan tai kaikki yhdessä. Asetukset → laskenta -kohdassa valitaan, kuinka kauan Saturnus ja Rahu viipyvät kussakin merkissä; kierros kestää Saturnuksella 30 ja Rahulla 18 vuotta kummassakin tavassa. AJANKOHTA → Transit Hits -välilehti luettelee, milloin ne saavuttavat natal-grahan tai lagnan.',
      ],
    },
  },

  // ── Timing ─────────────────────────────────────────────────────────
  {
    id: 'timing-views',
    section: 'timing',
    q: { en: 'What is in TIMING?', fi: 'Mitä AJANKOHTA sisältää?' },
    a: {
      en: [
        'Dasha: the daśā periods of the systems you have chosen. Summary: the running periods at a glance. Transit Hits: when the transiting and Paraya grahas reach points of the chart. Sign changes: when the grahas move to another sign. Muhurta: Rahu Kala, Yamaganda, Gulika Kala, Abhijit and the Choghadiya of a day. Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa and Varṣaphala: the yearly charts. Year at a glance: the four yearly charts side by side. Sudarśana: the three charts of the Sudarśana Chakra and the daśā of the year of age.',
        'All of them work for the target date, which is set in the target bar (the date, the time and now).',
      ],
      fi: [
        'Dasha: valitsemiesi järjestelmien daśā-jaksot. Summary: käynnissä olevat jaksot yhdellä silmäyksellä. Transit Hits: milloin transiittigrahat ja Paraya-grahat saavuttavat kartan pisteitä. Sign changes: milloin grahat siirtyvät toiseen merkkiin. Muhurta: päivän Rahu Kala, Yamaganda, Gulika Kala, Abhijit ja Choghadiya. Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa ja Varṣaphala: vuosikartat. Vuosi yhdellä silmäyksellä: neljä vuosikarttaa rinnakkain. Sudarśana: Sudarśana-chakran kolme karttaa ja ikävuoden daśā.',
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
        'Vimsottari (with the Utpanna, Kshema and Adhana variants where they apply, and the Original of U K Jha), Chara, Yoginī, Aṣṭottarī, Kālachakra, and the Nārāyaṇa, Mūla and Sthira daśās, which are still marked beta.',
        'Settings → display → dasha systems chooses which of them are shown. Settings → dasha methods holds the choices of the methods themselves.',
      ],
      fi: [
        'Vimsottari (Utpanna-, Kshema- ja Adhana-muunnelmineen, kun ne soveltuvat, sekä U K Jhan Original), Chara, Yoginī, Aṣṭottarī, Kālachakra sekä Nārāyaṇa-, Mūla- ja Sthira-daśāt, jotka on vielä merkitty beetaksi.',
        'Asetukset → näyttö → daśā-järjestelmät valitsee, mitkä niistä näytetään. Asetukset → daśā-menetelmät sisältää itse menetelmien valinnat.',
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
        'Under the search row of the list is the bulk editing bar. Tick the events (or Select all shown) and set their category, varga or significance, add or remove tags, make them single days again with Clear end date, or delete them. Only the events that the search and the significance filter show are changed. Every paste, import, bulk change and deletion can be taken back with Undo in the message above the list. Group by year adds a heading for each year. Open Varga Matrix in an event shows ANALYSIS → Varga → Matrix & Bala. An event can have an end date (when adding it, or in its card, where the date can be changed too): the dashas are then shown for both its first and its last day.',
      ],
      fi: [
        'AJANKOHTA → Tapahtumat → Liitä avaa kentän monelle tapahtumalle. Kirjoita tai liitä yksi tapahtuma riville, päivä ja nimi: 15.6.2015 Muutto ulkomaille. Päivä voi olla 15.6.2015, 15/6/2015 tai 2015-06-15 (päivä ensin), kuukausi (3/2015) tai vuosi (2015), ja se voi olla myös rivin lopussa. Pelkkä kuukausi tai vuosi tulkitaan sen keskikohdaksi, ja tapahtuma saa tunnisteen approx. date. Kaksi päivää tekee jonkin aikaa kestäneen tapahtuman: 15.6.2015 - 20.8.2017 Opiskelu ulkomailla tai 2015 - 2017 Opiskelu ulkomailla. Kentän alla näkyy, kuinka monta tapahtumaa ymmärrettiin, kuinka monta on jo listassa ja rivit, joita ei ymmärretty; Lisää-painike lisää uudet listaan päivämäärän mukaiseen järjestykseen.',
        'Taulukosta kopioitu rivi (solut erotettu sarkaimilla) tai puolipisteillä kirjoitettu rivi voi jatkua: luokka, varga, merkitys 1–5 ja muistiinpanot, esimerkiksi 2.1.2018; Uusi työ; work; D10; 5; aloitin pankissa. Mitä rivi ei kerro, saa kentän alta valitun luokan ja vargan. Luokkien suomenkieliset nimet (työ, raha, parisuhde, terveys, koti, perhe, henkinen, muu) ymmärretään myös. Ensimmäinen rivi, joka vain nimeää sarakkeet, ohitetaan, ja otsikkorivillisen CSV-tiedoston tai JSON-listan voi liittää sellaisenaan. Tuo-painike lukee sen sijaan kokonaisen CSV- tai JSON-tiedoston.',
        'Listan hakurivin alla on massamuokkauspalkki. Valitse tapahtumat (tai Valitse kaikki näkyvät) ja aseta niiden luokka, varga tai merkitys, lisää tai poista tunnisteita, tee niistä taas yksittäisiä päiviä painikkeella Tyhjennä loppupäivä tai poista ne. Muutos koskee vain tapahtumia, jotka haku ja merkitysrajaus näyttävät. Jokaisen liittämisen, tuonnin, massamuutoksen ja poiston voi perua listan yläpuolella olevan viestin Kumoa-painikkeella. Ryhmittele vuoden mukaan lisää jokaisesta vuodesta otsikon. Avaa Varga-matriisi näyttää ANALYYSI → Varga → Matrix & Bala. Tapahtumalla voi olla loppupäivä (lisättäessä tai sen kortissa, jossa myös päivää voi muuttaa): daśāt näytetään silloin sekä ensimmäiselle että viimeiselle päivälle.',
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
        'By default in the same ayanamsa as the grahas. Settings → calculations → nakshatra zodiac can change that to Sidereal (Lahiri) or Tropical, for example to see the nakshatras in the tropical zodiac. The choice applies to the nakshatras everywhere: the charts, the table, the panchang, the Nava-Tara and the special sphutas.',
      ],
      fi: [
        'Oletuksena samassa ayanamsassa kuin grahat. Asetukset → laskenta → nakṣatrojen zodiakki voi vaihtaa sen valintaan Sidereal (Lahiri) tai Tropical, esimerkiksi nähdäksesi nakshatrat tropiikkisessa zodiakissa. Valinta koskee nakshatroja kaikkialla: kartoissa, taulukossa, panchangassa, Nava-Tarassa ja erikoissphuṭissa.',
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
    id: 'nabhasa-yogas',
    section: 'analysis',
    q: { en: 'Which yogas does the yoga table detect, and what are the Nabhasa yogas?', fi: 'Mitkä yogat yogataulukko tunnistaa, ja mitä ovat Nabhasa-yogat?' },
    a: {
      en: [
        'ANALYSIS → Grahas → yoga.detection lists the yogas with the rule behind each, the grahas that make it and a strength. Besides the Pañcha Mahāpuruṣa, Raja, Dhana, solar and lunar yogas it has the 32 Nabhasa yogas of BPHS chapter 35, which look at where the seven grahas (the Sun to Saturn; the nodes are not counted) stand as a whole: the Ashraya yogas (Rajju, Musala, Nala: all in movable, fixed or dual signs), the Dala yogas (Maala: three Kendras that hold a benefic and no malefic; Sarpa: three that hold a malefic and no benefic), the 20 Akriti yogas, which name the houses the grahas occupy (every named house occupied and no other, which is stricter than JHora for Kamala, Vapi, Yupa, Shara, Shakti and Danda; Vajra and Yava are the exceptions: benefics in the 1st and 7th and malefics in the 4th and 10th, or the other way round, the other grahas anywhere) and the 7 Sankhya yogas, by the number of signs the grahas stand in (Gola 1, Yuga 2, Shoola 3, Kedara 4, Pasha 5, Dama 6, Veena or Vallaki 7). The Nabhasa Sakata is not the Sakata of the Moon and Jupiter, which the table also has. A Dala or Akriti yoga stops an Ashraya yoga (Saravali). BPHS says the Sankhya yogas do not operate when another Nabhasa yoga is derivable; here only a Dala or Akriti yoga stops them, because the Ashraya yogas hold whenever the grahas are in one sign and Gola could never arise.',
        'The table also has Gajakesari, Lakshmi, Maha Raja (the Lagna lord and the 5th lord exchange signs), Dharma-Karmadhipati (the 9th and 10th lords joined, exchanging or in mutual aspect), the Maha, Khala and Dainya Parivartanas (an exchange of signs between lords, classed by the houses), Harsha, Sarala and Vimala (the lord of the 6th, 8th or 12th in the 6th, 8th or 12th: Viparita Raja), Neecha Bhanga (the cancellation of a debilitation), Khadga, Kusuma and Matsya. Each row states its rule and the reason it is, or is not, active. Where the texts differ the rule is one of them, and the Roadmap of the README lists the ones that are only as good as their source; a rule that needs a "strong" lord (Lakshmi, Kahala, Shankha, Bheri) counts one that is not debilitated and stands in its own, exaltation or friendly sign or in a Kendra or Trikona.',
        'From BPHS 36 and 37 the table has the Lagna yogas Subha and Asubha (and the two-sided Subha Kartari and Papa Kartari), the three Vasumati yogas, Kemadruma and its cancellation Kemadruma Bhanga (a planet in a Kendra from the Lagna or the Moon, so the two never hold together), Varishta, Sama and Adhama (the Moon in an Apoklima, a Panaphara or a Kendra from the Sun; exactly one holds), Parvata, Kahala, Chamara, Shankha, Bheri, Srinatha, Sharada, Kurma (extremely rare), Kalanidhi, Kalpadruma, Hari, Hara, Brahma, Lagnaadhi and Parijata. The yogas with a strong lord hold in a fifth to a third of charts, because the chart alone cannot show the strength (Shadbala) BPHS means.',
      ],
      fi: [
        'ANALYYSI → Grahas → yoga.detection listaa yogat, kunkin säännön, sen muodostavat grahat ja voimakkuuden. Pañcha Mahāpuruṣa-, Raja-, Dhana-, aurinko- ja kuuyogien lisäksi siinä on BPHS:n luvun 35 32 Nabhasa-yogaa, jotka katsovat, missä seitsemän grahaa (Auringosta Saturnukseen; solmuja ei lasketa) ovat kokonaisuutena: Ashraya-yogat (Rajju, Musala, Nala: kaikki liikkuvissa, pysyvissä tai kaksoisluonteisissa merkeissä), Dala-yogat (Maala: kolme Kendraa, joissa on hyväntekijä eikä pahantekijää; Sarpa: kolme, joissa on pahantekijä eikä hyväntekijää), 20 Akriti-yogaa, jotka nimeävät grahojen miehittämät talot (jokainen nimetty talo miehitetty eikä yksikään muu, mikä on tiukempaa kuin JHorassa yogille Kamala, Vapi, Yupa, Shara, Shakti ja Danda; Vajra ja Yava ovat poikkeuksia: hyväntekijät 1. ja 7. talossa ja pahantekijät 4. ja 10. talossa tai päinvastoin, muut grahat missä tahansa) ja 7 Sankhya-yogaa grahojen miehittämien merkkien lukumäärän mukaan (Gola 1, Yuga 2, Shoola 3, Kedara 4, Pasha 5, Dama 6, Veena eli Vallaki 7). Nabhasa-Sakata ei ole Kuun ja Jupiterin Sakata, joka taulukossa on myös. Dala- tai Akriti-yoga estää Ashraya-yogan (Saravali). BPHS:n mukaan Sankhya-yogat eivät toimi, kun toinen Nabhasa-yoga on johdettavissa; tässä niitä estää vain Dala- tai Akriti-yoga, koska Ashraya-yogat pätevät aina, kun grahat ovat yhdessä merkissä, eikä Gola voisi koskaan syntyä.',
        'Taulukossa on myös Gajakesari, Lakshmi, Maha Raja (Lagnan herra ja 5. herra vaihtavat merkkiä), Dharma-Karmadhipati (9. ja 10. herra yhtymässä, vaihdossa tai keskinäisessä aspektissa), Maha-, Khala- ja Dainya-Parivartana (herrojen merkinvaihto, luokiteltuna talojen mukaan), Harsha, Sarala ja Vimala (6., 8. tai 12. herra 6., 8. tai 12. talossa: Viparita Raja), Neecha Bhanga (heikennyksen kumoutuminen), Khadga, Kusuma ja Matsya. Jokainen rivi kertoo sääntönsä ja syyn, miksi se on tai ei ole aktiivinen. Kun tekstit eroavat, sääntö on yksi niistä, ja READMEn Roadmap listaa ne, jotka ovat vain lähteensä veroisia; sääntö, joka vaatii "vahvan" herran (Lakshmi, Kahala, Shankha, Bheri), laskee sellaiseksi herran, joka ei ole heikennetty ja on omassa, korotus- tai ystävän merkissään tai Kendrassa tai Trikonassa.',
        'BPHS:n luvuista 36 ja 37 taulukossa on Lagna-yogat Subha ja Asubha (sekä kaksipuolinen Subha Kartari ja Papa Kartari), kolme Vasumati-yogaa, Kemadruma ja sen kumoutuminen Kemadruma Bhanga (Kendrassa Lagnasta tai Kuusta oleva planeetta, joten ne eivät koskaan toteudu yhtä aikaa), Varishta, Sama ja Adhama (Kuu Apoklimassa, Panapharassa tai Kendrassa Auringosta; täsmälleen yksi toteutuu), Parvata, Kahala, Chamara, Shankha, Bheri, Srinatha, Sharada, Kurma (erittäin harvinainen), Kalanidhi, Kalpadruma, Hari, Hara, Brahma, Lagnaadhi ja Parijata. Yogat, joissa on vahva herra, toteutuvat viidenneksessä tai kolmanneksessa kartoista, koska pelkkä kartta ei näytä BPHS:n tarkoittamaa voimaa (Shadbalaa).',
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
        'Open PALM and press Upload photos, or drop a picture on the page. On a phone, Take a photo opens the camera. Give the photograph a name and say whether it is the right or the left hand. A photograph is deleted with the 🗑 button, after a confirmation.',
        'The photographs stay on your device, in the browser; nothing is sent anywhere. Clearing the browser data deletes them, so keep a backup (see below) or a copy as a picture.',
      ],
      fi: [
        'Avaa KÄMMEN ja paina Lataa kuvia tai pudota kuva sivulle. Puhelimessa Ota kuva avaa kameran. Anna kuvalle nimi ja kerro, onko se oikea vai vasen käsi. Kuva poistetaan 🗑-painikkeella vahvistuksen jälkeen.',
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
        'With two or more photographs in PALM, the Compare button shows two of them side by side, with their drawings. The open photograph is on the left and, if you have said which hand each one is, the other hand on the right; either side can be changed from its list.',
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
    q: { en: 'How do I see CHART, TIMING, ANALYSIS and PALM at the same time?', fi: 'Miten näen KARTAN, AJANKOHDAN, ANALYYSIN ja KÄMMENEN yhtä aikaa?' },
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
        'TIMING, ANALYSIS and PALM each have a ⤢ full button. It gives the workspace the whole width of a wide screen and the chart steps aside; ⤡ narrow brings the chart back. Each workspace remembers its own choice.',
      ],
      fi: [
        'AJANKOHDALLA, ANALYYSILLA ja KÄMMENELLÄ on kullakin ⤢ full -painike. Se antaa työtilalle leveän näytön koko leveyden ja kartta väistyy; ⤡ narrow tuo kartan takaisin. Jokainen työtila muistaa oman valintansa.',
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
