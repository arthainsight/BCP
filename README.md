# bhrigu.code

A fast, experimental Jyotish toolkit focused on **daśā analysis** and practical chart reading.

Built for exploration — not dogma.

Live: [bcp-five.vercel.app](https://bcp-five.vercel.app)

---

## What this is

**bhrigu.code** is a browser-based astrology tool. The calculations (Swiss
Ephemeris) run in the app's own API routes, which store nothing; saved charts,
event lists, palm photographs and settings live only in the browser. Looking up
a city sends its name to a geocoding service.

The goal is simple:

> Make chart reading faster, clearer, and more systematic.

---

## Core ideas

* **Chart first, theory second**
* **Toggle everything**
* **See patterns, not just data**
* **Say plainly what is calculated and what is approximated**

This is not meant to replace traditional study — it's meant to **accelerate it**.

---

## Features

### Chart

* North and South Indian styles
* BCP (Bhṛgu Chakra Paddhati) year/month highlighting
* Special lagnas and chara karakas
* Ashtakavarga tables (SAV and per-planet BAV)
* Mixed charts (the D1 chart inside, any varga outside, in the same houses)
* Selectable ayanamsa, including a signed custom offset from Lahiri
* Transits with automatic recalculation
* Tithi Praveśa annual chart with Tithi Aṣṭottarī daśā
* Nakṣatra Praveśa and Yoga Praveśa annual charts (the Moon's return to its natal longitude, and the return of the Sun-and-Moon sum), with two rules for the year's start and a Vimśottarī daśā of the year
* Year at a glance: the four annual charts on one time axis
* Tājika Varṣaphala: Muntha, year lord, Pañcavargīya Bala and Mudda daśā
* Sudarśana Chakra: the chart counted from the Lagna, the Moon and the Sun in three rings, and the Sudarśana daśā: the house each year of age makes active in all three, with the twelve months and twelve days of the year

### Daśā

The largest part of the app. Nine calculated systems:

| System | Kind | Status |
| --- | --- | --- |
| Vimśottarī (and Vimśottarī Original) | Nakṣatra | Implemented |
| Aṣṭottarī | Nakṣatra | Implemented, chart-conditional eligibility |
| Yoginī | Nakṣatra | Implemented |
| Chara | Rāśi | Implemented |
| Kālachakra | — | Implemented |
| Nārāyaṇa, Mūla, Sthira | Rāśi | Beta — see *Validation* below |

All of them support six-level sub-daśā navigation. The **Daśā workspace** wraps
them in nine tabs (Timeline, Slider, Yearly, Finder, Events, History, Patterns,
Overlap and Systems), among them:

* **Timeline** — one date-driven cross-system view with the active MD–AD–PD path
* **Finder** — search a date range for MD/AD/PD combinations, across systems
* **Events** — saved life events (single days or periods) with categories, tags,
  notes and significance; many can be pasted, imported, changed or deleted at
  once, with Undo; CSV/JSON import and export; each event shows the daśās, the
  transits and the progressions (Paraya, with the natal points aspected) of its
  day
* **Patterns** — recurring rulers across saved events, with category filters
* **Systems** — per-system method settings and calculation provenance

### Strength and divisional analysis

* Varga matrix (D1 → D60)
* Bala view with a diagram and a table each: Ṣaḍbala (beta; against the required strength and its six parts), Bhāva Bala (beta; a column per house) and Viṁśopaka Bala (four schemes)
* Sensitive degrees: Sandhi, Gandanta, Mṛtyu Bhāga, Puṣkara Navāṁśa and Puṣkara Bhāga and combustion for the Lagna, the grahas and Māndi, in the rāśi chart or in any divisional chart; marked in the graha table and in the hover text of the charts
* Yogi, Sahayogi and Avayogi (in the Special Sphutas, and as a chart layer)
* Graha dṛṣṭi and rāśi dṛṣṭi (Jaimini)
* Sarvatobhadra chakra: the 9 × 9 chart of the nakṣatras (with Abhijit), vowels, consonants, signs, tithi groups and weekdays, with the grahas in their squares and their vedha (across the chart and on the two diagonals), the squares the lines cross, the syllable of a name and the birth points a graha pierces
* Kota Chakra: the 28 nakṣatras (with Abhijit) in the four squares of the fort (Bāhya, Prākāra, Durgāntara, Stambha), counted from the Moon's nakṣatra, with the grahas in their squares, natal and transiting, and the Kota Swāmī and Kota Pāla
* Yoga detection with the reason each yoga holds or not, and a strength: the Pañcha Mahāpuruṣa, Raja, Dhana, Solar and Lunar yogas, the 32 Nabhasa yogas of BPHS 35 (Ashraya, Dala, Akriti and Sankhya), Gajakesari, Lakshmi, Maha Raja, Dharma-Karmadhipati, the Maha, Khala and Dainya Parivartanas, Harsha, Sarala and Vimala (Viparita Raja), Neecha Bhanga, Khadga, Kusuma and Matsya, and from BPHS 36 and 37 the Lagna yogas, Vasumati, Kemadruma and its cancellation, Varishta, Sama and Adhama, Parvata, Kahala, Chamara, Shankha, Bheri, Mridanga, Srinatha, Sharada, Kurma, Kalanidhi, Kalpadruma, Hari, Hara, Brahma and Lagnaadhi (and Parijata, from Raman and JHora)
* Avasthās, sahams, panchanga

### Research tools

* Nāḍī paraya progressions for Jupiter, Saturn, Rahu and Ketu, and for Mars, Mercury and Venus as a beta (off until chosen), all beginning at their natal degrees; a graha that was retrograde at birth begins one sign back or in its natal sign, as chosen in Settings
* A Paraya tab in TIMING: where the seven progressing grahas stand and every hit to the natal points (1st, 5th, 7th and 9th sign) in the order of time, with an overview of the seven against the ten natal points
* A Research view in ANALYSIS: do the progressions have something in common at the time of the same kind of event (moves, weddings, …) across several saved charts? Events picked by category, tag and words in their name, tags or notes (with a list of the events chosen); houses (from the ascendant) and aspects by sign of the progressing grahas at each event (the day or a window of up to 180 days either side), set against the same chart at random moments of its life, with a permutation test and a false-discovery-rate correction, a matrix, a table and the events behind each cell; one feature chosen beforehand with its exact p and the result without each chart in turn; two kinds of event compared side by side (Fisher exact test); CSV export; features from the progressions, the transits (Jupiter, Saturn, Rahu, Ketu) and the daśā lords (what they rule, where they stand), to see which source separates the events best
* A Paraya aspects tab in TIMING: who aspects each natal point by sign (the 1st, 5th, 7th and 9th) for the progressions or the transits, when several grahas do at once, a timeline of how many aspect through time, a search for when a graha aspects another, the exact-degree dates inside each stretch, and the daśā lords running through it (with a filter for a daśā lord being the aspected graha)
* Nāḍī aṁśa (Deva Keralam and Siddhar)
* Local backup and restore of every saved chart, event list, setting and,
  optionally, palm photograph; a backup can be encrypted with a password
  (AES-GCM, in the browser)
* Saved charts kept by client, with search and ordering

### Palmistry, sharing and reports

* **PALM** workspace: photographs of palms with a pen, lines, arrows, circles,
  a ruler (in pixels or centimetres), age scales, text and pins, an eraser,
  reshaping, and two photographs side by side with a shared zoom
* **REPORT**: a printable client report (chart, timing summary, palm photographs)
* **SHARE**: a link that carries the birth data and opens the chart
* A split view that shows CHART, TIMING, ANALYSIS and PALM together, a screen
  recorder, an English and Finnish interface, and a user guide at `/help`

---

## Validation

Calculation accuracy is tracked explicitly rather than assumed.

* **Implemented** systems have regression fixtures covering seeds, period order,
  continuity and durations.
* **Beta** systems (Nārāyaṇa, Mūla, Sthira) are checked against PyJHora 4.8.7
  itself: seed, Brahma, period order and length and Nārāyaṇa antardaśās agree on
  every chart in a fixture set generated by running PyJHora. Nārāyaṇa also
  reproduces both worked examples in P.V.R. Narasimha Rao's book. They stay
  Beta until a comparison against the JHora desktop application is added.
* Birth times are turned into UTC with the clock time of the place, so that births
  near a change of summer time, half-hour and 45-minute zones and historical
  offsets (India in wartime, for example) get the offset the tz database gives.
* The Sun and the Moon are checked against almanac times of equinoxes,
  solstices and new and full Moons.
* Ashtakavarga is pinned to the classical BPHS totals — per-planet BAV of
  48/49/39/54/56/52/39 summing to an SAV of 337. Those totals are properties of
  the bindu table, so they hold for every chart and catch any drift in the rules.
* Ṣaḍbala and Bhāva Bala components are labelled in the UI as exact or
  approximate (`~`). Do not read an approximated component as a precise value.

Run the suite with `npm test`. Every calculation module under `src/lib` has a
fixture; they exercise the real implementation, not a copy of it.

---

## Development

```bash
npm install
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests and calculation fixtures (Node 24, see `engines`) |
| `npx playwright test` | End-to-end tests (needs `npm run build` first) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

`npm audit --omit=dev` reports no vulnerabilities in what the app ships; the remaining findings of `npm audit` are in the lint tooling (`eslint-config-next` → `braces`) and have no fix that is not a downgrade.

CI runs lint (`--max-warnings=0`), typecheck, tests and a production build on
every push and pull request.

A release bumps `APP_VERSION` in `src/lib/config.ts` and adds an entry at the top
of `CHANGELOG` in `src/lib/changelog.ts`.

---

## Privacy and security

* Charts, event lists, settings and palm photographs stay in the browser. A
  backup can be encrypted with a password; a lost password cannot be recovered.
* A shared link carries the birth data after the `#`, which a browser never sends
  to a server.
* The server adds `nosniff`, no framing, no referrer and a Permissions-Policy
  that withholds the camera and the location.

## Performance

The first screen loads about 0.76 MB of JavaScript. Settings, Analysis, Timing,
Panchang, the palm workspace and the report load when they are opened, and
`html-to-image` loads when a chart is exported.

---

## Roadmap

* Compare Nārāyaṇa, Mūla and Sthira against the JHora desktop application
  (they stay Beta until then)
* Yoga detection: settle the rules that are only as good as their source
  (the other cancellations of Kemadruma and Sakata, Mukuta, Amara, Dhvaja, Muni; the Navamsa condition of Neecha Bhanga and the stricter forms of Gajakesari and Viparita Raja;
  a "strong" lord by Shadbala instead of by sign and house in Lakshmi, Kahala, Shankha, Bheri and Mridanga; Parijata (stricter here than Raman and JHora), Kurma (extremely rare) and Vasumati (also from the Lagna, as Raman and JHora count it))

---

## Tech

* Next.js 16 + React 19 + TypeScript
* Swiss Ephemeris via `swisseph-wasm`
* Tailwind CSS 4
* API routes under `src/app/api` for the calculations; local storage for saved charts

---

## Status

Actively developed. Expect bugs, changes, and unfinished ideas.

---

## Disclaimer

This is a research tool. Use your own judgement.
