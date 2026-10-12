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
        'Dasha: the daśā periods of the systems you have chosen. Summary: the running periods at a glance. Transit Hits: when the transiting and Paraya grahas reach points of the chart. Sign changes: when the grahas move to another sign. Muhurta: Rahu Kala, Yamaganda, Gulika Kala, Abhijit and the Choghadiya of a day. Tithi Praveśa and Varṣaphala: the yearly charts.',
        'All of them work for the target date, which is set in the target bar (the date, the time and now).',
      ],
      fi: [
        'Dasha: valitsemiesi järjestelmien daśā-jaksot. Summary: käynnissä olevat jaksot yhdellä silmäyksellä. Transit Hits: milloin transiittigrahat ja Paraya-grahat saavuttavat kartan pisteitä. Sign changes: milloin grahat siirtyvät toiseen merkkiin. Muhurta: päivän Rahu Kala, Yamaganda, Gulika Kala, Abhijit ja Choghadiya. Tithi Praveśa ja Varṣaphala: vuosikartat.',
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
        'Grahas: the table of the grahas with their positions, karakas and nakshatras, and the yogas. Varga: the divisional charts in a grid. Nāḍī: the Nadi amsas. Aṣṭakavarga: the bindu tables. Gochara: the transits by the Moon. Dṛṣṭi: the aspects. Argala: argala and virodhargala. Bhava Chalit: the Śrīpati chart. Nava-Tara: the nine-star wheel. Directions: the directional chart. Special Sphutas: the lagnas and sphutas that run on the time since sunrise.',
      ],
      fi: [
        'Grahas: grahojen taulukko sijainteineen, karakoineen ja nakshatroineen sekä yogat. Varga: jakokartat ruudukossa. Nāḍī: Nadi-amsat. Aṣṭakavarga: bindu-taulukot. Gochara: transiitit Kuusta lukien. Dṛṣṭi: aspektit. Argala: argala ja virodhargala. Bhava Chalit: Śrīpati-kartta. Nava-Tara: yhdeksän tähden kehä. Directions: suuntakartta. Special Sphutas: auringonnoususta kuluvan ajan mukaan kulkevat lagnat ja sphuṭat.',
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
    id: 'sunrise',
    section: 'analysis',
    q: { en: 'Which sunrise do the special lagnas use?', fi: 'Mitä auringonnousua erikoislagnat käyttävät?' },
    a: {
      en: [
        'The Bhava, Hora, Ghati, Vighati and Prana lagnas and the other sphutas run on the time since sunrise. Settings → calculations → sunrise for the special lagnas chooses between the mean-time sunrise (the true sunrise plus the equation of time, which is about 12 minutes in October) and the true sunrise. If another program or a book uses a sunrise of its own, type it in the manual sunrise field of Special Sphutas (HH:MM:SS).',
      ],
      fi: [
        'Bhava-, Hora-, Ghati-, Vighati- ja Prana-lagnat sekä muut sphuṭat kulkevat auringonnoususta kuluvan ajan mukaan. Asetukset → laskenta → auringonnousu erikoislagnoille valitsee keskiaikaisen auringonnousun (todellinen auringonnousu plus aikayhtälö, noin 12 minuuttia lokakuussa) ja todellisen auringonnousun välillä. Jos toinen ohjelma tai kirja käyttää omaa auringonnousuaan, kirjoita se Special Sphutasin oma auringonnousu -kenttään (HH:MM:SS).',
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
        'EXPORT writes all the saved charts to one file, bcp-charts-export.json, and IMPORT reads such a file back, for example on another device.',
      ],
      fi: [
        'Yläpalkin kartan toiminnot ovat UUSI, AVAA, TALLENNA, TALLENNA NIMELLÄ, VIE ja TUO. TALLENNA NIMELLÄ antaa kartalle nimen ja säilyttää sen tässä selaimessa; AVAA avaa tallennetun kartan; TALLENNA tallentaa uudet muutokset avattuun karttaan. UUSI aloittaa alusta (se kysyy ensin, ettei karttaa menetetä vahingossa).',
        'VIE kirjoittaa kaikki tallennetut kartat yhteen tiedostoon, bcp-charts-export.json, ja TUO lukee sellaisen tiedoston takaisin, esimerkiksi toisella laitteella.',
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
        'A backup with photographs can be large (a photograph is about a megabyte). If you only want a copy of a marked-up palm to show or send, Download PNG saves the picture on its own.',
      ],
      fi: [
        'Asetukset → Täysi paikallinen varmuuskopio. Lataa varmuuskopio tallentaa yhden tiedoston, jossa ovat tallennetut kartat, kaikki tapahtumalistat, laskenta- ja näyttöasetukset, daśā-menetelmät ja, ellet kytke sitä pois, kämmenkuvat piirroksineen. Palauta painamalla Valitse varmuuskopio ja valitsemalla tiedosto, sitten Korvaa ja palauta; tämä korvaa sen, mitä selaimessa nyt on, ja kämmenkuvat myös, kun tiedostossa on niitä.',
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
        'Settings → display → language: English or Suomi. This guide follows the same choice and has its own language switch at the top. Settings → display → graha names chooses English names (Sun, Moon, Mars …) or Sanskrit ones (Sūrya, Candra, Maṅgala …). Sanskrit terms such as daśā, varga and the nakshatras are the same in both languages.',
        'The dark and light mode is switched with the button at the top right.',
      ],
      fi: [
        'Asetukset → näyttö → kieli: English tai Suomi. Tämä opas seuraa samaa valintaa, ja sillä on oma kielenvaihto ylhäällä. Asetukset → näyttö → grahojen nimet valitsee englanninkieliset nimet (Sun, Moon, Mars …) tai sanskritinkieliset (Sūrya, Candra, Maṅgala …). Sanskritin termit, kuten daśā, varga ja nakshatrat, ovat samat molemmilla kielillä.',
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
